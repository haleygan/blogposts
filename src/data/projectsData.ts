/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PortfolioProject } from '../types';

export const DE_PROJECTS: PortfolioProject[] = [
  {
    id: "sloth-buffer-queue",
    title: "Sloth Stream-Throttle Engine (SSTE)",
    tagline: "Energy-Optimized Backpressure Buffer & Lazy-Evaluation Log Processor",
    description: "An open-source node stream scheduler executing ultra-low power buffer digestion. Modeled on the three-toed sloth's 37% bodily storage digest cycles to process raw IoT sensor feeds efficiently.",
    tags: ["Apache Kafka", "TypeScript", "Microservices", "Backpressure"],
    link: "https://github.com/example/sloth-stream-throttle",
    iconName: "Cpu",
    architectureIntro: "In high-throughput sensor telemetry, spikes can melt downstream single-thread database connections. SSTE acts as a smart, biologically throttled buffer queue. Instead of scaling up containers aggressively (high cloud budget drain), it runs a custom backpressure formula that forces messages into high-latency, multi-stage digestion lines until computational energy demands strictly drop.",
    techStack: ["Apache Kafka", "Node.js Streams", "Redis Cluster", "TypeScript", "Docker"],
    highLevelArchitecture: "SSTE intercept raw telemetry streams using raw TCP socket handlers. Upon high-volume ingress, it routes packets to memory-mapped files backed by disk (simulating multi-stomach buffer buffers). A localized cron scheduler evaluates packet importance scores (based on critical alerts vs routine data), digestively yielding payloads only when execution loops explicitly commanded. It keeps CPU cores idling in low-power states up to 82% longer during seasonal storm floods.",
    dataPipelineFlow: [
      "Ingest: Rain Canopy IoT Nodes (HTTP/TCP)",
      "Buffer: Mem-Mapped Multi-Chamber Queue (Kafka/Redis)",
      "Digest: Lazy-Evaluation Worker Polls (Scale-to-Zero)",
      "Egress: PostgreSQL Analytical Sink (Buffered Batch Insert)"
    ],
    designDecisions: [
      {
        title: "Micro-Batching via Digestion Windows",
        description: "Instead of microsecond trigger loops, messages are accumulated across adaptive 90-second epochs to minimize read/write disk cycles.",
        tradeoff: "Increases queue latency to ~1.5 minutes, but recovers 78% of memory space and decreases cloud energy footprints."
      },
      {
        title: "Memory-Mapped Disk Spillover",
        description: "Utilized physical file descriptors directly to cache extreme high-volume bursts safely during jungle cloudbursts.",
        tradeoff: "Slightly higher raw I/O latency, but guarantees absolute message survival backpressure during complete network partitions."
      },
      {
        title: "Dynamic Backpressure Throttling",
        description: "Incorporated active CPU threshold polling. If core heat indexes rise, incoming packets are choked using natural exponential cooling windows.",
        tradeoff: "Clients experience momentary throttles, but the hosting server avoids thermal crashes and operates completely off simple 12v solar grids."
      }
    ]
  },
  {
    id: "formica-swarm-pipeline",
    title: "Formica Swarm Join Protocol (FSJP)",
    tagline: "Decentralized Map-Reduce Stream Merger Inspired by Leafcutter Pheromone Trails",
    description: "A consensus-driven high-throughput stream partitioning pipeline. Employs natural chemical decay weights (TTLs) to route, cross-join, and garbage collect transient stream keys without a coordinate master node.",
    tags: ["Apache Spark", "Go", "Distributed Consensus", "Gossip Protocol"],
    link: "https://github.com/example/formica-swarm-pipeline",
    iconName: "Network",
    architectureIntro: "Standard ETL pipelines rely on single giant central coordinators (like Spark Master Nodes or Orchestrator instances) to maintain state and route logs. Under extreme rainforest humidity or physical branch partitions, master nodes fail. FSJP distributes join routing calculations across millions of light broker workers. Each worker drops transient log route trace markers to vote on perfect paths.",
    techStack: ["Go", "gRPC Mesh Network", "Apache Spark Structured Streaming", "Protocol Buffers", "Kubernetes"],
    highLevelArchitecture: "Each active worker peer is a completely decentralized router node. When two streams must be joined (e.g., soil humidity metadata combined with canopy solar intensity logs), worker nodes broadcast localized hashes using a custom gossip protocol. Popular paths naturally gain chemical reinforcement metrics while obsolete join branches decay automatically—triggering instant, zero-cost memory garbage-collection runs.",
    dataPipelineFlow: [
      "Swarms: Heterogeneous Telemetry Readers",
      "Gossip: Local Trail Weight Updates (gRPC)",
      "Resolve: Evaporative TTL Hash-Join Matrix",
      "Persist: S3/Google Cloud Storage Delta Lakes"
    ],
    designDecisions: [
      {
        title: "Pheromone Weight Routing Metrics",
        description: "Replaced classical round-robin proxies with an active mathematical weight matrix based on node output performance.",
        tradeoff: "Imposes a minor telemetry metadata overhead (~4%) directly on TCP headers to trace trail strengths."
      },
      {
        title: "No-Master Architecture",
        description: "No central leader node. Cluster nodes automatically discover adjacent neighbors using local multicast protocols.",
        tradeoff: "Eventual consistency takes ~300ms to converge, but the cluster can sustain a 65% node failure with zero loss of operations."
      },
      {
        title: "Evaporative Cache Expiry (TTL)",
        description: "Old state caches are dropped dynamically by subtracting trailing percentage weights on every cluster cycle.",
        tradeoff: "Requires precise clock synchronization across elements, requiring reliable NTP servers to handle the natural decay factors."
      }
    ]
  },
  {
    id: "jaguar-stealth-query",
    title: "Jaguar Stealth Query Envoy (JSQE)",
    tagline: "Zero-Trust Mesh Database Proxy & Decorative Honeypot Mask",
    description: "An analytical secure database ingress proxy. Employs camouflage design patterns to blend deep telemetry warehouses in standard plain flora logs, deflecting unauthorized scans with standard asset payloads.",
    tags: ["Rust", "SRE Security", "PostgreSQL Proxy", "Honeypot"],
    link: "https://github.com/example/jaguar-stealth-envoy",
    iconName: "Shield",
    architectureIntro: "Public data warehouses are continuous targets for automated bots. Instead of standard security gates (which return 401 Unauthorized, alerting bots that sensitive data exists), JSQE acts inside the brush. To unauthorized clients, it masquerades as a plain, zero-risk botanical text index. Behind the brush, validated data analyst requests are validated and proxy-routed down target analytical pipelines.",
    techStack: ["Rust", "eBPF Kernel Filters", "PostgreSQL Native wire protocol", "TLS 1.3 Encryption"],
    highLevelArchitecture: "JSQE intercepts traffic on the Postgres wire level before SQL execution. Valid requests carry encrypted temporal stealth tokens. Invalid requests bypass normal database layers entirely, automatically served dynamic, simulated static HTML lists containing harmless rainforest flora classifications.",
    dataPipelineFlow: [
      "Ingress: Postgres/HTTP Analytical Port",
      "Camouflage Filter: Rust eBPF Token Validation",
      "Decoy Path: Botanical Static Page (Low-Compute Mock)",
      "Secure Path: Postgres / Snowflake Production Warehouse"
    ],
    designDecisions: [
      {
        title: "Kernel-Level Packet Interception (eBPF)",
        description: "Used Linux kernel filters to analyze connection handshakes at the socket stage, keeping unauthorized requests out of user-space RAM entirely.",
        tradeoff: "Requires advanced root-level container capability privileges to run during production container deployments."
      },
      {
        title: "Decoy Payload Mimicry",
        description: "Instead of dropping packets, the proxy completes the connection to serve harmless lists of Costa Rican species with 200 OK headers.",
        tradeoff: "Consumes a small amount of static outbound bandwidth (~2KB per query), but completely hides the database existence."
      },
      {
        title: "Stealth Token Rotation",
        description: "Authorized systems generate tokens synced to canopy solar metrics to avoid static hardcoded security keys.",
        tradeoff: "Requires a minor offline synchronization algorithm running inside verified Client API wrappers."
      }
    ]
  }
];
