---
id: running-systems-software-on-serverless-containers
title: "The Choice of Cloud Run Gen2 over Gen1 for Redpanda Deployment"
date: September 4, 2026
excerpt: Cloud Run Gen1 uses a syscall sandbox that silently breaks high-performance systems software like Redpanda. Here is why Gen2 is the correct choice and how to evaluate this for any data engine.
readTime: 12 minutes read
tags:
  - Cloud Run
  - Redpanda
  - GCP
  - Container Runtime
  - Data Engineering
category: Cloud
---

If you have ever tried running Redpanda (or any Kafka-compatible message broker) on Google Cloud Run and hit an immediate crash before the container even started, this post is for you.

This is not a tutorial on deploying Redpanda. It is an explanation of one specific, non-obvious reason why serverless container platforms can silently break data engineering tools, and how choosing the right container execution environment resolves it.

If you are interested in going deep into how containers and cloud runtimes work under the hood, this breakdown walks through the exact mechanics.

---

## The setup: what we are trying to do

The goal is straightforward: run a single-broker Redpanda instance on Google Cloud Run so it scales to zero when idle and costs nothing during quiet periods.

Here is the high-level setup:

![Deploying Redpanda on Google Cloud Run](assets/redpanda-cloudrun-setup-simple.jpg)

We have a containerized Redpanda broker deployed on Cloud Run, and an ingestion producer app publishing streaming events to it. On paper, it sounds like an ideal lightweight setup: no dedicated VM instances to patch, no cluster management overhead, and pure pay-per-second billing.

However, as soon as the container is deployed, things fall apart before any messages can be sent.

---

## What went wrong: the crash before startup

Deploying Redpanda on Cloud Run Gen1 using the standard configuration produces this error immediately:

```
libc++abi: std::system_error: open: No such file or directory
```

This happens before the broker opens any ports. Even running `redpanda --help` to print help text triggers the same crash.

The error message says a file or directory is missing. But nothing obvious is missing from the container image. The image is complete. The crash is not about the image.

**So what is missing?**

The answer requires understanding one concept: **Container Runtime Isolation**.

---

## The concept: Container Runtime Isolation

When a container runs on a cloud platform, it does not run directly on bare metal hardware. There is always a layer between the container and the physical machine. The design of that layer determines what your container can and cannot do.

There are two fundamentally different approaches to this isolation layer.

### Approach 1: Application Sandbox (used by Cloud Run Gen1)

Cloud Run Gen1 uses **gVisor**, a sandbox built by Google.

gVisor sits between your container and the Linux kernel. Every time your application makes a system call (a request to the operating system — to open a file, read a directory, create a socket), gVisor intercepts that call and responds to it in software. Your container never directly touches the real kernel or real hardware.

For most web applications, this is invisible. A Python API opens a network socket. gVisor intercepts the request and provides a working socket. The API never notices the difference.

| What gVisor handles well | What gVisor does not emulate |
|---|---|
| Network sockets and HTTP | `/sys/devices/system/cpu/` CPU topology files |
| File I/O for application data | Direct hardware I/O (`O_DIRECT`, `io_uring`) |
| Process management | Thread-to-core pinning (`pthread_setaffinity`) |
| Standard POSIX calls | NUMA node inspection |

### Approach 2: MicroVM (used by Cloud Run Gen2)

Cloud Run Gen2 uses a different approach. Instead of intercepting system calls in software, it boots a real, lightweight Linux kernel inside a micro virtual machine. Your container runs on top of that real kernel.

The CPU topology files exist. The `/sys` filesystem is real. Hardware inspection works.

| | Cloud Run Gen1 (gVisor) | Cloud Run Gen2 (microVM) |
|---|---|---|
| Isolation method | Syscall interception in software | Lightweight VM with real Linux kernel |
| Cold start | Faster | Slightly slower |
| `/sys` filesystem | Partially emulated | Full Linux kernel |
| Systems software compatibility | Breaks many data engines | Full compatibility |
| Security | Very high (no kernel sharing) | High (separate kernel per container) |

![Container Runtime Isolation: Cloud Run Gen1 sandbox vs Gen2 microVM](assets/redpanda-cloudrun-gen2-architecture.jpg)

As shown in the diagram above:
- Under **Gen1**, the gVisor sandbox intercepts the container's calls to `/sys/devices/system/cpu/`. Because those files do not exist in the simulation, the process fails immediately.
- Under **Gen2**, Cloud Run boots a real microVM with an authentic Linux kernel. The kernel exposes real hardware topology, allowing systems software like Redpanda to inspect CPU cores, allocate memory, and start its services.

---

## Why Redpanda specifically breaks on Gen1

Redpanda is built on **Seastar**, a C++ framework originally developed for ScyllaDB. Seastar is engineered for extreme performance on multi-core machines and uses a **thread-per-core (shared-nothing) architecture**.

Here is what that means in plain terms:

- Normal applications let the operating system decide which thread runs on which CPU core. The OS switches threads around constantly.
- Seastar takes direct control. It creates exactly one thread per physical CPU core, locks each thread to its dedicated core, and gives each core its own memory and network queue.
- No core ever shares memory with another core. This eliminates lock contention and achieves much higher throughput.

To set this up, Seastar reads the CPU topology from the Linux virtual filesystem the instant it starts:

```
/sys/devices/system/cpu/cpu0/online
/sys/devices/system/cpu/cpu1/online
/sys/devices/system/cpu/cpu0/topology/core_id
... and so on
```

These are not regular files. They are a live interface the Linux kernel generates on demand to describe the physical hardware. gVisor does not emulate this part of `/sys`. When Seastar looks for these files, the path does not exist. Seastar cannot build its thread pool and aborts immediately.

That is the `std::system_error: open: No such file or directory` error.

> **Does this mean all C++ or Rust code breaks on Gen1?**
>
> No. A lightweight Rust web API (Axum) or C++ HTTP server (Crow) runs fine on Gen1. The trigger is not the language. It is whether the software does low-level hardware inspection. Seastar does. Most web frameworks do not.

---

## What other data engineering tools hit the same issue?

This is not a Redpanda-specific problem. Any data engine that bypasses OS abstractions for performance falls into the same category.

**Tools that require microVM or dedicated VM:**

| Tool | Why it breaks on Gen1 |
|---|---|
| Redpanda / ScyllaDB | Seastar thread-per-core inspects `/sys/cpu` |
| ClickHouse | Direct I/O, bypasses page cache |
| RocksDB (embedded) | Uses `io_uring` for async disk I/O |
| Apache Flink TaskManager | JVM with pinned thread affinity at scale |
| Redis (in some configurations) | `io_uring` and direct memory access |

**Tools that work fine on Gen1:**

| Tool | Why it works |
|---|---|
| Python FastAPI / Flask | Standard OS sockets and file I/O |
| Node.js services | V8 uses standard POSIX calls |
| Go HTTP servers | Standard net/http, no hardware inspection |
| Lightweight Rust APIs (Axum) | Uses Tokio async runtime, standard calls |

**The rule of thumb:** If a tool's documentation describes it as an "event broker", "columnar engine", "storage manager", or "shared-nothing architecture", it assumes bare-metal Linux: run it on Gen2 or a dedicated VM, not Gen1.

---

## How to research this for any cloud platform

You do not need to memorise every cloud provider's runtime behaviour. You only need to know the architecture category of the tool you are deploying and match it to the correct isolation type.

**The question to ask:** Does this tool inspect physical hardware, pin threads to CPU cores, or use direct I/O?

- **Yes** → It needs a **microVM** or dedicated VM runtime.
- **No** → A **syscall sandbox** (Gen1, standard Fargate) will work fine.

**Equivalents across cloud providers:**

| Isolation type | GCP | AWS | Azure |
|---|---|---|---|
| Syscall sandbox | Cloud Run Gen1 (gVisor) | Fargate (default) | Container Apps (default) |
| MicroVM | Cloud Run Gen2 | Fargate with Firecracker | Container Apps (Dedicated) |
| Dedicated VM | GCE / GKE node | EC2 / EKS node | Azure VM / AKS node |

---

## The fix: how to switch from Gen1 to Gen2

If you already deployed your service on Gen1 and watched it crash, you might wonder: do you need to delete the service and start over?

The short answer is no. You do not need to delete or recreate anything.

In Cloud Run, services are managed through immutable revisions. The execution environment setting belongs to the revision template. That means you can update an existing service in place, and Cloud Run will spin up a new revision running on Gen2 while keeping your service URL, IAM permissions, and domain mappings unchanged.

Here is how to switch an existing service step by step.

### Step 1: Update the execution environment

You can apply the Gen2 change through the CLI, the GCP Console, or your service YAML.

#### Method A: Using the gcloud CLI (Fastest)

If your service is already created (for example, named `redpanda`), you can update the execution environment in place with a single command:

```bash
gcloud run services update redpanda \
  --execution-environment gen2 \
  --region us-central1
```

If you prefer to redeploy the full configuration from your image:

```bash
gcloud run deploy redpanda \
  --image docker.io/redpandadata/redpanda:v24.1.1 \
  --execution-environment gen2 \
  --region us-central1 \
  --port 9092
```

Both commands tell Cloud Run to create a new revision using the second-generation microVM runtime.

#### Method B: Using the GCP Console UI

1. Open the Cloud Run console in Google Cloud.
2. Click on your existing `redpanda` service.
3. Click **Edit & Deploy New Revision** at the top.
4. Expand the **Container, Variables & Secrets, Connections, Security** section.
5. Go to the **Security** tab.
6. Under **Execution environment**, select **Second generation**.
7. Click **Deploy**.

#### Method C: Using Cloud Run Service YAML

If you manage your deployments declaratively via YAML or GitOps:

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: redpanda
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
    spec:
      containers:
        - image: docker.io/redpandadata/redpanda:v24.1.1
          args:
            - redpanda
            - start
            - --overprovisioned
            - --kafka-addr
            - 0.0.0.0:9092
            - --advertise-kafka-addr
            - 127.0.0.1:9092
          ports:
            - containerPort: 9092
          startupProbe:
            tcpSocket:
              port: 9092
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 12
          livenessProbe:
            httpGet:
              path: /v1/status/ready
              port: 9644
            periodSeconds: 30
```

Apply it with:

```bash
gcloud run services replace service.yaml --region us-central1
```

### Step 2: What Cloud Run does next

Once you trigger the update, Cloud Run does not immediately kill the old container. It provisions a fresh microVM instance running a real Linux kernel, pulls the container image, and boots it up.

### Step 3: Verify the logs

Check the Cloud Run revision logs to confirm the fix:

1. The previous fatal error (`libc++abi: std::system_error: open: No such file or directory`) should completely disappear.
2. You should see Redpanda's startup logs reporting detected CPU cores and initialized memory pools:
   ```text
   INFO  ... - Welcome to Redpanda!
   INFO  ... - Detected 2 hardware threads
   INFO  ... - Starting Seastar reactor on core 0
   INFO  ... - Starting Seastar reactor on core 1
   INFO  ... - Successfully bound Kafka listener on 0.0.0.0:9092
   ```
3. Cloud Run marks the new Gen2 revision as ready and routes 100% of incoming traffic to it.

On Gen2, the `/sys/devices/system/cpu/` virtual filesystem is authentic. Seastar detects the cores, sets up its threads, and Redpanda starts cleanly.
