---
layout: post
title: "Say Goodbye to Service Account Keys: GCP Workload Identity Federation"
date: 2026-06-18
---

## Workload Identity Federation - Why does this even exist?

The classic way to authenticate from an external system to GCP was via service account keys — but they're effectively permanent passwords that require [high maintenance](https://docs.cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys) and a lot of discipline to keep secure. They don't expire on their own, and if one leaks, that key stays valid until you manually go in and rotate or revoke it.

Workload Identity Federation is the answer to **"what if we just didn't use static keys at all?"**

Instead of using credential keys you created, GCP trusts tokens issued directly from the external system. It's GCP saying: **"I'll trust this system as long as it's a recognized Identity Provider and the token meets the criteria I've set."** Once validated, you get back credentials that can be used to access GCP resources.

No keys to download, rotate, or accidentally commit. The credentials GCP hands back are short-lived by design — they expire after an hour, and the next workflow run gets a fresh set.

## How it works with Service Account Impersonation (using Github Actions as example)

> Let's use a concrete example: Assume we are creating a Github Actions workflow that builds and pushes Docker images to GCP Artifact Registry, which requires us to authenticate via Workload Identity Federation  with proper IAM permissions using service account impersonation.

There are two sides to this setup:

### 1. The Identity Provider (IdP) side

An Identity provider (Idp) is simply an external system that can issue signed identity tokens.  There are many different types of identity providers in the market, so the first step is to identify which one of them is right for your use case, and [if they are recognized and supported by GCP](https://docs.cloud.google.com/iam/docs/workload-identity-federation#providers) for Workload Identity Federation. 

In our sample use case, the Identity Provider will be [OpenID Connect (OIDC)](https://docs.github.com/en/actions/concepts/security/openid-connect#how-oidc-integrates-with-github-actions) which is natively supported in Github Actions. We would request for the OIDC token directly from Github when the Github Actions workflow is triggered.

A Github Actions workflow that triggers a deployment would look like this:

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

The `id-token: write` make requests for a temporary JWT that looks something like this:

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

These fields inside the JWT are called **claims**. They're assertions the issuer is making about the identity. The `iss` claim is the issuer. The `sub` (subject) is who's being identified. The rest are context about the run. 

For Workload Identity Federation, these metadata fields serve as important pieces of information that can be used to verify the legitimacy of the token. We can configure GCP to recognize those claims instead of relying on static keys. 


### 2. The GCP side
You configure GCP to:
1. trust tokens from a specific external system. 
2. allow that external system to impersonate your service account to access GCP resources.

#### Configuring the Workload Identity Pool and Providers

First we need to create a **Workload Identity Pool** — it's a grouping container to organize your list of trusted 3rd party identity providers in GCP. Within the pool you can then register multiple different **Identity Providers**. For each provider, you would configure its own authentication methods and passing criteria (e.g., by using the JWT claims from OIDC tokens). You're teaching GCP how to trust tokens from that external system: where the tokens should come from, and what's the correct way to verify their legitimacy. In this setup you're saying "this pool has the list of specific identities I want to trust". Note that the actual token validation is not done by the pool itself — rather, it is done by the [Security Token Service (STS)](https://cloud.google.com/blog/products/identity-security/enable-keyless-access-to-gcp-with-workload-identity-federation) in a separate step, so the pool is only in charge of supplying the necessary info for STS to validate the token. One pool can hold providers for GitHub, GitLab, AWS, and more - as long as they support exchanging identity tokens. 

The authentication config is dictated by the following components:
1. **Issuer URL**: The provider URL that issues the tokens, to prove their identity as the 3rd party system.
2. **Attribute mapping**: Mapping of information between the provider's token and GCP (as the format could be different across providers).
3. **Attribute condition**: The passing criteria. Offers a unique way to define exactly which identities are allowed to access GCP. (e.g., only allowing specific GitHub repositories, branches, or users to access GCP). This is important to avoid [spoofing attacks](https://docs.cloud.google.com/iam/docs/best-practices-for-using-workload-identity-federation#multi-tenant-attribute-conditions) especially in Github

**The Workload Identity Pool and Provider Setup:**
![Workload Identity Pool and Provider Setup](../assets/static_diagrams/2026-06-18-workload-identity-federation-in-gcp/workload_identity_pool_and_provider_setup.svg)


#### Configuring Service Account Impersonation for the Workload Identity Pool
Setting up the pool and provider is not enough to grant permissions for the external system to access GCP resources, as the necessary permissions are still granted through your **Service Accounts**. Now instead of using keys to authenticate, you simply create an IAM binding on the service account to allow the external system and identity to impersonate it. 

This means after the GCP and Github acknowledge each other and establish trust through Workload Identity Federation token exchange, your workflow will have the permission to act as your service account to access GCP resources. 

**The Service Account and IAM Binding Setup:**
![Service Account Impersonation Setup](../assets/static_diagrams/2026-06-18-workload-identity-federation-in-gcp/service_account_impersonation_setup.svg)


### Under the Hood: The Workload Identity Federation Token Exchange Process

Here's to breakdown what happened behind the scenes during the authentication:
![Workload Identity Federation Token Exchange](../assets/static_diagrams/2026-06-18-workload-identity-federation-in-gcp/workload_identity_federation_token_exchange.svg)

1. The Github Actions workflow requests the OIDC token from Github and presents it to the Security Token Service (STS) in GCP
2. The STS verifies the OIDC token using the Workload Identity Pool and Provider configuration and exchanges it for a GCP token
3. The GCP token is sent back to the workflow to complete the authentication. 

Now both GCP and Github acknowledged each other but this is just the first step. The workflow is yet to have access to the actual GCP resources. Hence the next authentication step is needed to obtain the token from the impersonation service and act as the service account. 

![Workload Identity Federation Service Account Impersonation Token Generation](../assets/static_diagrams/2026-06-18-workload-identity-federation-in-gcp/workload_identity_federation_service_account_impersonation_token_generation.svg)

1. The Github Action workflow clients takes the GCP federated token from the previous step to make a request to GCP's IAM service for a short-lived, Oauth 2.0 access token in order for the workflow to impersonate the service account
2. The new token has the same permissions as the service account and can be used to access GCP resources


### The Overall Workflow

An overview of the entire authentication flow:
![Workload Identity Federation with Service Account Impersonation Architecture Flow](../assets/static_diagrams/2026-06-18-workload-identity-federation-in-gcp/workload_identity_federation_architecture_flow.svg)

## Deciding an Authentication Method: Direct Resource Access VS Service Account Impersonation

As discussed, the complete authentication flow involves two parts:

1. GCP exchanging tokens with the [Identity Provider (IdP)](https://www.cloudflare.com/learning/access-management/what-is-an-identity-provider/) to acknowledge each other
2. Obtaining credentials (OAuth 2.0 tokens) from GCP to access the actual GCP resources

For the second part, GCP actually offers two authentication methods:

- **Direct Resource Access**: Permissions are granted to the external identity on the GCP resources directly. For example, if you want a github action to be able to create GCS buckets, you would grant the [federated identity](https://cloud.google.com/iam/docs/workload-identity-federation#overview) with respective IAM roles on the GCS bucket resources directly.

- **Service Account Impersonation**: A single service account in GCP can be created with all the necessary permissions. External identities can then impersonate this service account to access GCP resources.

The choice of authentication method depends on the following:
1. Whether you practice Role-Based Access Control (RBAC) or Attribute-based Access Control (ABAC) - here's their [differences](https://www.okta.com/identity-101/role-based-access-control-vs-attribute-based-access-control/). Direct resource access is more in line with ABAC, while service account impersonation is more in line with RBAC.
2. How fine-grained your IAM permissions need to be: GCP resources only allow granting roles (which includes a predefined set of permissions) as the lowest possible level. If you practice least privilege access control, you might still need to create a service account to group the fine-grained permissions needed and then attach this service account to your GCP resources.
3. If you are already a GCP user with existing service accounts and using service account keys in your day-to-day operations, then using service account impersonation with Workload Identity Federation could be a good starting point for you to move away from using static keys without making major changes to your existing IAM policies. Read GCP's official guide on [Migrate from service account keys](https://docs.cloud.google.com/iam/docs/migrate-from-service-account-keys) for the best practices.


## References

I would highly recommend going through GCP's documentation if you would like a step-by-step guide on how to implement Workload Identity Federation. The following resources are great places to start:

- [Workload identity Federation](https://docs.cloud.google.com/iam/docs/workload-identity)
- [Configure Workload Identity Federation with deployment pipelines](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Keyless API authentication—Better cloud security through workload identity federation, no service account keys necessary](https://cloud.google.com/blog/products/identity-security/enable-keyless-access-to-gcp-with-workload-identity-federation)
