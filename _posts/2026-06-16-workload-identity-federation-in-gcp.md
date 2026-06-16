---
layout: post
title: "Workload Identity Federation in GCP, without the usual hand-waving"
date: 2026-06-16
---

If you have ever set up auth for a CI job or some external service talking to Google Cloud, you probably saw a few different paths and wondered why there are so many. Service account keys. Workload Identity Federation. Workforce Identity Federation. Direct federation. It gets messy fast.

This is my attempt to write it down in a way that feels closer to how I would explain it to a teammate over coffee.

## What WIF actually is

Workload Identity Federation, or WIF, is basically a way for something outside Google Cloud to prove who it is without carrying a long-lived service account key around.

Instead of downloading a JSON key and stashing it in a secret somewhere, the external system proves its identity to Google through a trusted identity provider. Google then gives it a short-lived token.

That is the core idea. No magic. Just a safer way to let an external workload in.

## Why it exists

The old pattern was simple: create a service account, generate a key, put that key in a secret store, and let your workload use it.

It worked, but it had a few ugly problems:

- The key was long-lived.
- Anyone who got the key could use it until you rotated or revoked it.
- Rotation was easy to forget.
- Keys tended to spread into places you did not really want them.

WIF exists to reduce that risk. The workload does not need a permanent secret. It asks for access, proves who it is, gets a short-lived credential, and moves on.

## Service account key vs WIF

If I had to shrink it down:

- Service account key: "Here is a file that can act as this identity."
- WIF: "Prove who you are right now, and I will give you a short-lived token."

The key approach is simpler to understand at first. WIF is better for security and for systems that already have an external identity source.

In practice, if you can avoid service account keys, you usually should.

## The moving parts in GCP

When people say "set up WIF in GCP", there are usually a few pieces involved:

- A workload identity pool
- A provider inside that pool
- A service account in GCP
- A trust relationship between the external identity and the service account

The pool is like the container for identities coming from outside GCP.

The provider is the thing that tells Google how to trust the outside identity source.

The service account is still the thing that actually has GCP permissions.

So WIF does not really replace service accounts. It replaces the need to carry service account keys around.

## What is a provider

A provider is basically the bridge between Google and the external identity system.

For workloads, the common one you see is OIDC. For humans, SAML is common in enterprise SSO setups.

The right provider depends on where the identity is coming from:

- OIDC works well when the external system can mint an OIDC token, which is why GitHub Actions shows up so often here.
- SAML is more common for browser-based sign-in and corporate identity providers.
- Some services do not use a provider at all because they are not part of this federation setup in the first place.

So the question is not "which provider is best overall". It is "what can the system I already use actually issue?"

That is the part people usually skip, and it causes confusion later.

## Attribute mapping and filters

This is one of those areas that looks more complicated than it really is.

Attribute mapping tells Google how to take fields from the external token and turn them into attributes it can understand.

For GitHub Actions, you might map things like:

- the repo name
- the branch
- the workflow
- the subject

Attribute filters or conditions then narrow things down so only the exact identity you expect can use the provider.

In plain language:

- Mapping says "here is where the useful data lives"
- Filtering says "only accept tokens that match these rules"

If you are not sure what to fill in, look at the claims in the token you receive from the provider. Then map only the fields you actually need for access control.

Do not map everything just because you can.

## Example: GitHub Actions deploying to Artifact Registry

This is the example I want to walk through because it is practical and easy to picture.

The flow looks like this:

1. A GitHub Actions job starts.
2. GitHub issues an OIDC token for that job.
3. Google Cloud trusts that token through the provider.
4. Google exchanges it for a short-lived Google credential.
5. That identity is allowed to impersonate a service account.
6. The workflow pushes a Docker image to Artifact Registry.

That is the mental model I want to keep using throughout the post.

### What the setup looks like

In GCP, you will usually create:

- a workload identity pool
- an OIDC provider for `token.actions.githubusercontent.com`
- a service account with the Artifact Registry permissions it needs
- a binding that lets the GitHub identity impersonate that service account

Then in GitHub Actions, the workflow usually does something like:

- request an OIDC token
- authenticate to Google through the federation flow
- configure Docker auth
- push the image

### Screenshot placeholders

<!-- Screenshot placeholder: Workload Identity Pool in GCP -->
<!-- Screenshot placeholder: OIDC provider configuration -->
<!-- Screenshot placeholder: Attribute mapping and attribute condition -->
<!-- Screenshot placeholder: Service account IAM binding -->
<!-- Screenshot placeholder: GitHub Actions workflow auth step -->
<!-- Screenshot placeholder: Artifact Registry push success -->

## Direct federation

Sometimes you will hear people talk about "direct" access. In this context, that usually means the external identity is used more directly, without the extra step of impersonating a service account first.

That can be useful, but it is not always the simplest path.

If your access model is clearer with a service account in the middle, that is often easier to reason about. The service account gives you a familiar place to attach permissions and audit access.

If you do not need that extra layer, direct federation can be cleaner.

## Workforce Identity Federation

Workforce Identity Federation is the sibling of WIF, but for people rather than workloads.

Think of it like this:

- Workload Identity Federation: apps, scripts, CI jobs, backend services
- Workforce Identity Federation: humans signing in through an external identity system

The setup and intent are different. Workforce is about user access. Workload is about machine access.

When people blur those together, troubleshooting gets annoying fast.

## When to use what

My rough rule of thumb is:

- Use Workload Identity Federation for external workloads that need Google Cloud access.
- Use Workforce Identity Federation for human users signing in through external identity providers.
- Use direct federation when it fits the access pattern and you do not need service account impersonation.
- Use a service account with no key whenever the workload runs inside GCP and you can avoid federation entirely.
- Use service account keys only when you absolutely have to, and treat that as a last resort.

## Wrapping it up

The main thing I want readers to leave with is this:

WIF is not some special Google-only trick. It is just a safer way to trust an external identity without distributing long-lived secrets.

Once you see the pieces as pool, provider, mapping, and service account, the rest becomes much easier to follow.

Next I want to add screenshots and the concrete GitHub Actions YAML so the setup feels real instead of hypothetical.

