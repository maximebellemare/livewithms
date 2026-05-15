# LiveWithMS Architecture Foundation

This document is the lightweight operating guide for long-term iteration.

## Core principles

- Keep product logic local and modular by feature.
- Keep shared concerns centralized:
  - config
  - feature flags
  - analytics
  - error normalization
  - storage helpers
- Prefer small, readable abstractions over enterprise-style frameworks.

## Shared systems

### App config

- File: `lib/app-config.ts`
- Centralizes stable product settings for:
  - premium defaults
  - reminder defaults
  - onboarding step structure
  - lifecycle thresholds
  - lightweight AI tuning hints

### Feature flags

- File: `lib/feature-flags.ts`
- Separates:
  - development flags
  - rollout flags
  - experiment variants
  - premium feature flags

### Analytics

- File: `lib/events.ts`
- Rules:
  - keep names event-style and product-readable
  - prefer one reusable helper over repeated raw string calls
  - sanitize metadata and keep payloads small
  - analytics must never block UI

### AI runtime

- Files:
  - `features/ai/modules.ts`
  - `features/ai/invoke.ts`
- Responsibilities:
  - module definitions
  - shared function invocation
  - logging and transport-level error handling
- Keep prompt assembly and context assembly inside each AI feature unless a real shared need appears.

## Feature boundaries

- `features/onboarding/*`: onboarding state, personalization, completion
- `features/coach*/*`: AI Coach chat, plans, reflection logic
- `features/insights/*`: pattern summaries, AI summary fetches, dashboard logic
- `features/programs/*`: catalog, progress, continuation
- `features/premium/*`: RevenueCat, entitlements, usage limits, premium config
- `features/reminders/*`: reminder state, plans, notifications
- `features/personalization-memory/*`: lightweight long-term memory snapshot
- `features/lifecycle/*`: lifecycle classification for retention-aware behavior

## Experimentation guidance

- Keep experiments config-driven first.
- Start with variants in `lib/feature-flags.ts`.
- Only add experiment-specific runtime plumbing when a real experiment needs it.
- Avoid shipping hidden complexity before rollout needs are concrete.

## Developer guidance

- Prefer adding feature logic inside the existing feature folder before creating new global abstractions.
- If multiple features need the same behavior more than once, extract the smallest shared helper.
- Keep storage payloads trimmed and stable.
- Keep production logging sparse and structured.
