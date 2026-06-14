# 0003. Use Polar for billing, subscriptions, and credit metering

Date: 2026-05-06
Status: Accepted

## Context

The boilerplate needs a billing provider that handles subscriptions, one-time purchases, and metered credit usage. Stripe is the industry default and the path of least resistance. Choosing otherwise needs to clear a high bar.

Polar is a younger product purpose-built for software companies (digital products, license keys, customer portal, usage-based billing) with a first-party BetterAuth plugin that handles customer creation, webhook verification, and the customer portal end-to-end.

## Decision

Use Polar via the `@polar-sh/better-auth` plugin. Customer is created on signup. Subscription state is synced via webhooks (`onCustomerStateChanged`) and on the post-checkout success page. Subscription state, generated products/meters, and credit metering live under the consolidated `src/features/billing/` feature and use `PolarGateway` through `src/lib/polar/`.

## Consequences

Easier:
- Customer lifecycle is wired into auth (signup creates a Polar customer; user delete cascades to Polar).
- Webhook signature verification and product/meter generation are handled by the plugin and the eniem CLI.
- Credit metering, customer portal, and licence keys come for free.

Harder:
- Smaller ecosystem than Stripe. Fewer integrations (analytics, tax, fraud) compared to Stripe's.
- Polar API surface is younger and changes faster — pinning SDK versions and watching changelogs matters more.
- Migrating to Stripe later means rewriting the customer linkage, webhook handlers, products generator, and the credit-metering service.

## Alternatives considered

- **Stripe** — most mature, largest ecosystem, best tax/fraud tooling. Rejected because the SaaS-shaped feature set (licence keys, customer portal, software-flavoured products, metered usage) needs significant custom code on Stripe, and the BetterAuth Polar plugin removes the bulk of the integration work.
- **Lemon Squeezy / Paddle** — merchant-of-record options. Rejected: less flexible API, less aligned with the credit-metering use case.
