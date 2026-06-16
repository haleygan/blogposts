---
layout: post
title: "Authenticate your workloads without keys: Workload Identity Federation in GCP"
date: 2026-06-16
---

# Authenticate your workloads without keys: Workload Identity Federation in GCP

This post covers Workload Identity Federation (WIF) in GCP — what it is, why it exists, and how to set it up. We'll use deploying Docker images to Artifact Registry via GitHub Actions as the running example.

---

## Why does this even exist?

When you have an external system — say, a GitHub Actions pipeline — that needs to talk to GCP, GCP needs some way to know "yes, this request is allowed." The classic way to do that was with a **service account** and a **service account key**.

A service account is basically an identity that represents a non-human actor in GCP — a pipeline, a background job, a piece of software. You create one in GCP, give it permissions, and then whatever uses that service account inherits those permissions. 

> [SCREENSHOT: service account in GCP]

A service account key is how external things prove they are that service account. When you create a key, GCP gives you a JSON file that looks something like this:

```json
{
  "type": "service_account",
  "project_id": "my-project",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...",
  "client_email": "my-sa@my-project.iam.gserviceaccount.com",
  ...
}
```

You store this file somewhere safe — like a GitHub Actions secret — and your pipeline uses it to sign API requests to GCP. GCP sees the signature, recognizes the key, and lets the request through.

In practice, this means for every pipeline that needs to interact with GCP, you need to:
1. Create a service account in GCP for that pipeline
2. Grant it the necessary permissions
3. Create and download a service account key
4. Store it securely somewhere

This works, but a service account key is effectively a permanent password. It doesn't expire on its own. If it leaks — accidentally committed to a repo, printed in a build log, exported by someone with access, or worse, accidentally shared with AI chat agents — that key stays valid until you go in and manually rotate or revoke it. It requires a lot of discipline and careful operational hygiene to manage and maintain them safely.

**Workload Identity Federation** is the answer to "what if we just didn't use static keys at all?"

The idea: instead of GCP trusting a credential you manufactured, GCP trusts tokens that an external system is already issuing for its own purposes. GitHub, for example, already mints a token for every workflow run that says "this run is from repo `my-org/my-repo`, on branch `main`, triggered by a push event." WIF lets GCP say — "I trust GitHub to issue these tokens, and if a token comes in that matches my conditions, I'll exchange it for short-lived GCP credentials."

No keys to download, rotate, or accidentally commit! The credentials GCP gives back are short-lived by design — they expire after an hour. The next workflow run gets a fresh set.

---

## The auth options in GCP

Before diving into WIF specifically, it's worth knowing the landscape. There are a few different auth mechanisms in GCP that get mixed up:

**Service Account + Key** — what we just described. Create a service account, download a JSON key, use it to authenticate. Simple, but the key is permanent and needs active management.

**Workload Identity Federation (WIF) with Service Account Impersonation** — what this post is about. For external *machines* or automated systems accessing GCP. No long-lived keys.

**Workload Identity Federation (WIF) with Direct Resource Access** — same concept as WIF, but instead of a service account impersonating an external identity, you attach a WIF pool directly to a resource (like a Cloud Run service), so the service itself authenticates via a federated identity — more on this later.

**Workforce Identity Federation** — same concept as WIF, but designed for *people*. If your team uses Okta, Azure AD, or another corporate identity provider and you want engineers to sign into GCP Console using their company SSO credentials, that's Workforce Federation. The setup looks similar but the use case is human login flows rather than machine-to-machine calls.

We'll get into when to use each at the end. For now, let's focus on WIF.

---

## How WIF actually works — the full picture

Before we start clicking around in the console, let's make sure the mental model is solid. WIF involves a few things working together, and understanding why each piece exists makes the config decisions make a lot more sense.

Here's the authentication flow at a high level:

> [DIAGRAM: WIF token exchange flow — see embedded diagram below]

There are two sides to this setup:

**The GCP side** — you configure GCP to trust tokens from a specific external system. You tell it: here's the URL of the system that issues these tokens, here's how to map the token's claims to GCP identities, and here's the condition a token has to meet to be accepted. GCP also has a service account that represents the actual permissions you want to grant. The external identity gets allowed to impersonate that service account.

**The external side (GitHub Actions in our case)** — when the workflow runs, it requests a token from GitHub that proves who it is. It then presents that token to GCP's Security Token Service (STS). GCP validates it, checks the conditions, and if everything checks out, hands back short-lived GCP credentials as per the service account's designated roles and permissions. The workflow uses those credentials to do its work — in our case, pushing a Docker image to Artifact Registry.

Here's the WIF setup at a high level:

> [DIAGRAM: WIF actual setup, pending]

A **Workload Identity Pool** — a container that holds one or more providers. Think of it as a namespace. You're saying "this pool represents external identities I'm willing to trust." One pool can hold providers for GitHub, GitLab, AWS, whatever you need. Typically one pool per project, or one per environment (dev/prod) if you want separation.

A **Provider** — lives inside a pool and represents one specific external system. It holds the configuration for trusting that system's tokens: where the tokens come from, how to verify they're legitimate, and how to translate claims in the token into GCP-understandable identity attributes.

A **Service Account** — still exists in WIF. The external identity doesn't directly get GCP permissions. Instead, it *impersonates* a GCP service account, and that service account is what actually holds IAM roles. The binding between "this WIF identity is allowed to impersonate this service account" is set via IAM.

An **Attribute mapping and condition** — configured on the provider. The mapping translates claims from the token into GCP attributes. The condition is a filter that says "only tokens matching this expression are allowed in." Without a condition, any token from the provider could authenticate — which is not what you want.

Now let's actually set it up.

---

## Enabling the APIs

First, make sure the relevant APIs are enabled in your project:

```bash
gcloud services enable \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  artifactregistry.googleapis.com
```

`sts.googleapis.com` is GCP's Security Token Service — the part that receives external tokens and exchanges them for GCP credentials. `iamcredentials.googleapis.com` is what handles the service account impersonation step. Both are needed for WIF to work.

---

## Creating the Workload Identity Pool

In the GCP Console, go to **IAM & Admin > Workload Identity Federation**.

> [SCREENSHOT: IAM & Admin sidebar showing Workload Identity Federation]

Click **Create Pool**.

> [SCREENSHOT: Workload Identity Federation page with Create Pool button]

Give the pool a name — something like `github-actions-pool`. The pool ID is auto-generated from the name but you can edit it if you want a cleaner string. The description field is worth filling in — it's easy to forget what a pool is for six months later.

> [SCREENSHOT: Create pool form with name, pool ID, and description filled in]

Leave the pool enabled and click **Continue**. The next step is adding a provider, which is where the real configuration happens.

---

## Adding a provider — and what providers actually are

After clicking Continue, you're prompted to add a provider to the pool.

> [SCREENSHOT: "Add a provider to this pool" step in the creation wizard]

A provider is the configuration for one specific external system whose tokens GCP should trust. You'll be asked to pick a **provider type** — let's go through what the options mean, because the right choice depends on how your external system issues tokens.

### How identity tokens work in general

When a system wants to prove its identity to another system, it needs some kind of signed credential. The signing is what prevents forgery — if GitHub signs a token saying "this run is from repo X," you can verify that signature using GitHub's public key, and know the claim is genuine.

There are a few different standards for how this signing works:

**OIDC (OpenID Connect)** is the modern standard. It's built on top of OAuth 2.0. The way it works: the external system issues a **JWT** (JSON Web Token) — a compact, URL-safe token with a JSON payload inside. The JWT is signed with the issuer's private key. Anyone can verify it using the issuer's public key, which is published at a well-known URL (called the OIDC discovery endpoint). GCP fetches those public keys and uses them to verify the token's signature before trusting any of its claims.

A JWT looks like three base64-encoded segments joined by dots: `header.payload.signature`. If you decode the payload, you get something like:

```json
{
  "iss": "https://token.actions.githubusercontent.com",
  "sub": "repo:my-org/my-repo:ref:refs/heads/main",
  "aud": "https://iam.googleapis.com/...",
  "repository": "my-org/my-repo",
  "repository_owner": "my-org",
  "ref": "refs/heads/main",
  "workflow": "Deploy",
  "exp": 1700000000
}
```

These fields inside the JWT are called **claims**. They're assertions the issuer is making about the identity. The `iss` claim is the issuer. The `sub` (subject) is who's being identified. The rest are context about the run.

**SAML** is the older enterprise standard — still widely used in corporate environments, especially with on-prem identity providers. Instead of JWTs, it uses XML-based assertions. More verbose and more complex to configure, but if your external system only supports SAML, this is your option.

**AWS** is a specific provider type for when your workloads run in AWS and need to access GCP. AWS uses its own signing mechanism (SigV4) rather than OIDC or SAML, so GCP has a dedicated provider type for it.

### How to know which one to use

Check what your external system issues. Most modern CI/CD platforms and cloud providers support OIDC — GitHub Actions, GitLab CI, Azure, CircleCI, and others all do. If you can find OIDC in your provider's docs, use it. If the system is older or enterprise-only and only supports SAML, use that. If you're bridging from AWS, use the AWS type.

GitHub Actions issues OIDC tokens natively. For our example, select **OpenID Connect (OIDC)**.

> [SCREENSHOT: Provider type dropdown with OpenID Connect (OIDC) selected]

### Filling in the provider details

- **Provider name**: `github-actions` or anything descriptive
- **Issuer (URL)**: `https://token.actions.githubusercontent.com`

The issuer URL is important. It's where GCP goes to fetch GitHub's public keys so it can verify token signatures. For GitHub Actions, this URL is fixed. For other OIDC providers, you'd find this in their documentation — it's usually called the OIDC discovery URL or issuer URL.

- **Audiences**: you can leave this as the default, or set it explicitly to your provider's full resource name: `https://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID`

The audience (the `aud` claim in the JWT) is what the token is intended for. Setting it explicitly narrows down which tokens are valid — a token issued for a different audience would be rejected. The default usually works fine for GitHub Actions.

> [SCREENSHOT: Provider form with issuer URL and provider name filled in]

---

## Attribute mapping — translating token claims into GCP identity

This is the part that trips people up most often. Stay with it — once it clicks, it makes sense.

When GCP receives a token from GitHub, the token has GitHub-specific claims (`repository`, `repository_owner`, `ref`, etc.). GCP doesn't know what these mean by default. **Attribute mapping** is you telling GCP: "take this claim from the token, and treat it as this attribute in GCP's identity system."

GCP has a small set of standard attributes it understands. The main one you always need to map is `google.subject` — this becomes the unique identifier for the external identity in GCP. You can also define custom attributes prefixed with `attribute.`, which you can then use in conditions.

The mapping uses the prefix `assertion.` to refer to claims from the incoming token. So:

```
google.subject = assertion.sub
```

This takes the `sub` claim from the GitHub JWT — which looks like `repo:my-org/my-repo:ref:refs/heads/main` — and uses it as the subject in GCP.

For GitHub, it's also useful to map repository and owner separately, so you can use them in your condition:

```
attribute.repository = assertion.repository
attribute.repository_owner = assertion.repository_owner
```

> [SCREENSHOT: Attribute mapping table with google.subject mapped to assertion.sub, and custom attribute mappings for repository and repository_owner]

The attribute names can be anything. But it's good practice to use names that are descriptive of what they represent. What you map here depends entirely on what claims your token provider includes. GitHub's [OIDC token docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token) list every available claim. Map the ones you need for your conditions.

---

## Attribute conditions — deciding which tokens are actually allowed in

Right below attribute mapping, there's a field for an **attribute condition**. This is a CEL (Common Expression Language) expression that acts as a filter. Only tokens where this expression evaluates to true get through.

Without a condition, any token from `https://token.actions.githubusercontent.com` would be accepted — meaning any GitHub Actions workflow from any repo in the world could potentially authenticate to your pool if they have your provider url and service account name. That's not what you want.

To limit access to your GitHub org:

```
attribute.repository_owner == "my-org"
```

Or to a specific repo:

```
attribute.repository == "my-org/my-repo"
```

You can also limit by specific branches or tags:

```
attribute.repository == "my-org/my-repo" && attribute.ref == "refs/heads/main"
``` 

> [SCREENSHOT: Attribute condition field with the repository_owner condition filled in]

The condition can reference any attribute you've mapped. If you haven't mapped `attribute.repository_owner`, you can't use it in the condition — so make sure your mappings and conditions are consistent with each other.

Click **Save**. Your pool and provider are created.

> [SCREENSHOT: Completed pool showing the provider listed underneath it]

---

## Creating the service account

Now we need a service account that will actually carry the GCP permissions. The WIF identity (the GitHub Actions run) doesn't get permissions directly — it *impersonates* this service account to do its work.

Go to **IAM & Admin > Service Accounts** and click **Create Service Account**.

> [SCREENSHOT: Service Accounts page with Create Service Account button highlighted]

Give it a name — something like `github-actions-sa`. In the next step, grant it the roles it needs for the job. For pushing Docker images to Artifact Registry, that's **Artifact Registry Writer**.

> [SCREENSHOT: Service account creation, role step, with Artifact Registry Writer role selected]

Finish creating the service account.

---

## Binding the WIF identity to the service account

This is the binding that allows the WIF identity to impersonate the service account. This is configured as an IAM policy on the service account itself.

Open the service account you just created. Go to the **Permissions** tab and click **Grant Access**.

> [SCREENSHOT: Service account detail page, Permissions tab, Grant Access button]

In the principal field, you need to enter the WIF identity. The format is:

```
principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/attribute.repository/my-org/my-repo
```

This reads as: "any identity from this WIF pool whose `attribute.repository` equals `my-org/my-repo`."

You can adjust the attribute used here — `attribute.repository_owner` to allow the whole org, for example. The attribute you reference here must be one you mapped in the provider configuration.

Grant this principal the role **Workload Identity User** (`roles/iam.workloadIdentityUser`). This is what allows the WIF identity to call `generateAccessToken` on the service account — effectively impersonating it.

> [SCREENSHOT: Grant access dialog with the principalSet string in the principal field and Workload Identity User role selected]

There's a shortcut: from the WIF pool page, there's a **Grant Access** button that helps you build the principal string and assign the right role without having to type the whole path manually.

> [SCREENSHOT: Grant Access button on the pool page and the dialog it opens]

---

## The GitHub Actions workflow

With GCP configured, the workflow needs to: request an OIDC token from GitHub, send it to GCP to get short-lived credentials, and then use those to push to Artifact Registry.

The `google-github-actions/auth` action handles the token exchange. Here's what the workflow looks like:

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

permissions:
  contents: read
  id-token: write   # this is required — it lets the workflow request an OIDC token from GitHub

jobs:
  build-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to GCP
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID'
          service_account: 'github-actions-sa@my-project.iam.gserviceaccount.com'

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker REGION-docker.pkg.dev

      - name: Build and push
        run: |
          docker build -t REGION-docker.pkg.dev/my-project/my-repo/my-image:${{ github.sha }} .
          docker push REGION-docker.pkg.dev/my-project/my-repo/my-image:${{ github.sha }}
```

The `id-token: write` permission is easy to miss. Without it, GitHub doesn't include an OIDC token in the workflow environment at all, and the auth step fails with a confusing error.

The `workload_identity_provider` string is the full resource name of your provider. You can find it on the provider detail page in the console.

> [SCREENSHOT: Provider detail page showing the full resource name string to copy]

When the auth action runs, it:
1. Fetches the OIDC token that GitHub made available in the workflow environment
2. Sends it to GCP's Security Token Service (STS) along with the provider resource name
3. STS fetches GitHub's public keys, verifies the token signature, checks the attribute condition
4. If it passes, STS returns a short-lived federated token
5. The action uses that token to call `generateAccessToken` on the service account, getting a short-lived access token with the service account's permissions
6. From this point on, `gcloud` and GCP client libraries in the workflow are authenticated as the service account

The whole exchange is transparent — from the rest of the workflow's perspective, you're just authenticated.

---

## Direct access and WIF without a service account

Earlier we mentioned that when code is running *on* GCP — a Cloud Run service, a Compute Engine VM — it can access GCP APIs without any extra auth setup. This is Application Default Credentials (ADC). The runtime environment has an attached service account, and GCP client libraries automatically detect and use that identity.

```python
# running on Cloud Run — this just works
from google.cloud import storage
client = storage.Client()
```

This is simpler than WIF for code that already lives in GCP. You attach a service account to the compute resource at deploy time, grant it the right roles, and that's all the auth setup you need.

What's less well known: GCP also supports attaching a WIF pool **directly to a resource**, so the resource itself authenticates via a federated identity rather than through a service account. This is useful when you want a workload's GCP credentials to be derived directly from the same external identity it already uses — for example, a workload running on AWS EC2 that you want to authenticate to GCP using its AWS IAM role identity, without mapping it through an intermediate GCP service account.

In this mode, you configure the resource (Cloud Run, Compute Engine, etc.) to use a WIF pool as its identity source. The resource then presents its external token directly to GCP, and GCP grants access based on the principal's attributes — no service account impersonation step in the middle.

This is a more advanced pattern. For most external-to-GCP scenarios like CI/CD pipelines, the standard WIF-to-service-account approach is the right one.

---

## Workforce Identity Federation — how it's different

Workforce Identity Federation is the same mechanism as WIF but designed for human login flows rather than machines.

If your team uses an identity provider — Okta, Azure AD, Google Workspace, Ping, whatever — and you want engineers to sign into GCP Console or use `gcloud` on their laptops with their existing company credentials, that's what Workforce Federation handles. The setup is conceptually similar: a pool, a provider, attribute mapping, conditions. But you're configuring it so that when a person authenticates with your company SSO, their identity flows through to GCP.

Two structural differences from WIF:

Workforce pools live at the **organization level**, not the project level. This makes sense — engineers work across multiple GCP projects, so it wouldn't make sense to configure SSO per-project. You set it up once at the org level and it applies everywhere.

Workforce Federation is specifically designed for interactive sessions. The token exchange goes through an OAuth 2.0 browser flow or a device code flow, not a machine-to-machine API call like WIF does.

---

## When to use what

| Scenario | What to use |
|---|---|
| Code running on GCP (Cloud Run, GCE, GKE, etc.) | Application Default Credentials — attach a service account to the resource |
| External machine or pipeline needs GCP access (CI/CD, another cloud, etc.) | Workload Identity Federation |
| Engineers logging into GCP with company SSO | Workforce Identity Federation |
| Quick internal tool or prototype, risks are understood | Service Account + Key — just rotate it and store it properly |

The line between WIF and service account keys is mostly about operational burden and risk tolerance. WIF is more setup upfront but eliminates the ongoing management of long-lived credentials. For any pipeline or external automated system that'll be running for a while, WIF is worth it.

---

## A few things worth knowing

**`id-token: write` is not on by default in GitHub Actions.** If it's missing from your `permissions` block, GitHub won't issue an OIDC token, and the auth step fails. The error message doesn't always make this obvious.

**The `workload_identity_provider` string needs the project *number*, not the project ID.** The numeric ID (e.g. `123456789`) and the string ID (e.g. `my-project`) are different things. Using the string ID here is a common mistake.

**Pools are per-project.** If you have workloads authenticating across multiple GCP projects, you'll need a pool in each project — or set up cross-project service account impersonation, where the WIF identity in one project impersonates a service account in another.

**Auth failures show up in Cloud Audit Logs.** When the token exchange fails — wrong attribute condition, mismatched audience, malformed principal string — the reason is in the Logs Explorer. Look for `sts.googleapis.com` in the log filter. It will tell you exactly what check failed and why.

**Attribute conditions can be as specific as you need.** You can combine conditions with `&&` — for example, locking to both a specific repo and a specific branch:

```
attribute.repository == "my-org/my-repo" && assertion.ref == "refs/heads/main"
```

This would limit production deployments to only run from the main branch, even if a workflow on a feature branch has the right repo.
