---
layout: post
title: "Keyless Authentication to GCP with Workload Identity Federation"
date: 2026-06-18
---

The old way to authenticate an external system (say, a CI/CD pipeline) to GCP was to create a [service account key](https://docs.cloud.google.com/iam/docs/keys-create-delete): download a JSON file, store it as a secret, inject it into your workflow. But those keys are essentially permanent passwords. They don't expire on their own, they need manual rotation, and a leaked key stays valid until you go revoke it yourself.

[Workload Identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity-federation) is GCP's answer to: *"what if we just didn't use static keys at all?"*

Instead of handing out keys, you configure GCP to trust tokens issued directly by the external system. GCP validates the token and hands back short-lived credentials, good for an hour, then gone.

## How it works, using GitHub Actions as an example

> Here's our scenario: we have a GitHub Actions workflow that builds and pushes Docker images to GCP Artifact Registry. To do that, it needs to authenticate to GCP using Workload Identity Federation.

### The two parts of authentication

Before getting into the setup, it helps to understand that authentication with Workload Identity Federation happens in two distinct stages.

The first is the token exchange: the external system presents its identity token to GCP, which validates it and issues a short-lived GCP federated token. This is where GCP and the external provider establish trust.

The second is actually accessing GCP resources: with the federated token in hand, the workflow needs to do something useful in GCP. There are two ways to handle this part, and which you choose shapes how you configure things on the GCP side. We'll cover both after walking through the token exchange setup.

### 1. The Identity Provider (IdP) side

An [identity provider](https://www.cloudflare.com/learning/access-management/what-is-an-identity-provider/) is any external system that can issue signed identity tokens. GitHub Actions, GitLab, AWS, Azure can all play this role. The first step is figuring out which one fits your use case and [whether GCP supports it](https://docs.cloud.google.com/iam/docs/workload-identity-federation#providers) for Workload Identity Federation.

In our example, the identity provider is [OpenID Connect (OIDC)](https://docs.github.com/en/actions/reference/security/oidc), which GitHub Actions supports natively. When a workflow runs, GitHub can issue an OIDC token on the spot, with no setup required on your end beyond the right permissions declared in your workflow file.

Here's what that workflow looks like:

```yaml
name: Deploy to GCP
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write         # requests the OIDC token from OpenID Connect
    steps:
    - uses: actions/checkout@v4
    - id: auth
      uses: google-github-actions/auth@v2 
      with:
        workload_identity_pool: "<GCP Workload Identity Pool ID>"
        workload_identity_provider: "<GCP Workload Identity Provider ID>"
    - name: Deploy to GCP Resource
      run: echo "Deploying to GCP Resource..."
```

The key line here is `id-token: write`. That's what tells GitHub: *"this workflow is allowed to request an OIDC token."* When it does, GitHub hands back a short-lived [JWT](https://docs.github.com/en/actions/reference/security/oidc) that looks something like this:

```json
{
  "iss": "https://token.actions.githubusercontent.com",
  "sub": "repo:my-org/my-repo:ref:refs/heads/main",
  "aud": "<GCP Workload Identity Pool ID>",
  "repository": "my-org/my-repo",
  "repository_owner": "my-org",
  "ref": "refs/heads/main",
  "workflow": "Deploy",
  "exp": 1700000000
}
```

These fields are called claims: they're assertions the issuer is making about the identity. `iss` is who issued the token. `sub` is who it's issued for. The rest is context about the specific run.

For Workload Identity Federation, these claims are exactly what GCP uses to decide whether to trust the token. Instead of checking a password, GCP checks the claims. You can configure it to only trust tokens from a specific repo, a specific branch, a specific owner.

### 2. The GCP side: setting up the Workload Identity Pool and Provider

Start by creating a Workload Identity Pool. Think of it as a container that holds all the external identity providers you want GCP to trust: GitHub, GitLab, AWS, whatever you need.

Inside the pool, you register Identity Providers. For each provider, you configure three things:

1. Issuer URL: where the tokens come from, so GCP knows who to trust.
2. Attribute mapping: translates the token's fields into something GCP understands (different providers format things differently).
3. Attribute condition: the passing criteria. This is where you lock it down to only this repo, only this branch, only this org. It's critical for preventing [spoofing attacks](https://docs.cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation#multi-tenant-attribute-conditions), especially on shared GitHub runners.

The pool doesn't actually validate the token itself. That work is done by the Security Token Service (STS), a separate GCP service. The pool just supplies the configuration that STS uses to do the validation.

<Diagram id="wif-pool-provider-setup" />

With both sides configured, the two-stage authentication can take place.

### Part 1: The token exchange

Here's what happens when the workflow runs:

<Diagram id="wif-token-exchange" />

1. The GitHub Actions workflow requests an OIDC token from GitHub and sends it to GCP's Security Token Service (STS).
2. STS validates the token using the Workload Identity Pool and Provider config, then exchanges it for a GCP federated token.
3. The workflow receives that GCP federated token back.

At this point, GCP and GitHub have acknowledged each other. But the workflow still can't touch any GCP resources. It doesn't have the right permissions yet. That's what Part 2 is for.

### Part 2: Accessing GCP resources

This is where the two approaches diverge. GCP gives you two options for granting the federated identity actual access to resources.

#### Direct Resource Access

With direct resource access, you grant IAM roles to the external federated identity directly on the GCP resource itself. If the GitHub Actions workflow needs to write to a GCS bucket, you bind the Storage Object Admin role directly to that federated identity on that bucket. No service account is involved at all.

The workflow presents its federated token, and GCP evaluates the IAM binding on the resource by checking the identity's attributes: which repo triggered the run, which branch, which org. This maps naturally to an *ABAC* (attribute-based access control) model, where access is determined by attributes of the identity rather than membership in a role hierarchy.

The tradeoff is flexibility. IAM bindings are role-level, so you can assign a predefined or custom role but you can't mix and match permissions from different roles into a single binding. If your workflow needs a precise set of permissions across multiple GCP services, managing that as direct resource bindings can get unwieldy quickly.

<Diagram id="wif-direct-access" />

#### Service Account Impersonation

The alternative is to have a service account hold all the necessary permissions, and grant the external federated identity the ability to impersonate it. Once that's in place, the workflow exchanges its federated token for a short-lived OAuth 2.0 access token scoped to that service account, then uses that token to access GCP resources.

This is closer to an *RBAC* (role-based access control) model: you define a role (the service account with its attached IAM roles) and control who can assume it. Here's a good breakdown of [RBAC vs ABAC](https://www.okta.com/identity-101/role-based-access-control-vs-attribute-based-access-control/) if you want to go deeper.

To set this up on the GCP side, you create an IAM binding on the service account that grants the external federated identity the Workload Identity User role. This is what authorizes the impersonation.

<Diagram id="wif-sa-setup" />

If you're already using GCP service accounts with static keys, impersonation is a smooth migration path. You keep your existing IAM setup mostly intact and just swap out how authentication works. GCP has an official guide for this: [Migrate from service account keys](https://docs.cloud.google.com/iam/docs/migrate-from-service-account-keys).

Here's the token flow with service account impersonation:

<Diagram id="wif-sa-token-flow" />

1. The workflow takes the GCP federated token and makes a request to GCP's IAM service, asking to impersonate the service account.
2. GCP issues a short-lived OAuth 2.0 access token with the same permissions as the service account.
3. The workflow uses this token to access the actual GCP resource (Artifact Registry, GCS, whatever you need).

### The full picture

Here's how all of that fits together end-to-end:

<Diagram id="wif-full-flow" />

## References

The GCP documentation is genuinely good on this topic. If you want the step-by-step implementation guide, these are great starting points:

- [Workload Identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity)
- [Configure Workload Identity Federation with deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Keyless API authentication: Better cloud security through workload identity federation](https://cloud.google.com/blog/products/identity-security/enable-keyless-access-to-gcp-with-workload-identity-federation)