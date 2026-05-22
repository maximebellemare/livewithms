# LiveWithMS Architecture Foundation

This document describes the product freeze architecture for LiveWithMS. The goal is no longer rapid feature invention. The goal is controlled ecosystem evolution that preserves calmness, emotional safety, and long-term maintainability.

## Platform shape

The stable top-level façade is:

- `lib/platform-core`

Long-term growth and expansion policy sits one layer above that:

- `lib/future-platform-strategy`

Use `platform-core` when new work needs platform policy, safety validation, or orchestration across multiple systems.

`platform-core` composes:

- `lib/platform-governance`
- `lib/adaptive-intelligence`
- `lib/calm-life-support`
- `lib/emotional-support-engine`
- `lib/programs-ecosystem`
- `lib/continuity-intelligence`
- `lib/calm-environment`

`future-platform-strategy` uses `platform-core` to govern:

- growth patterns
- retention quality
- community expansion
- content expansion
- future AI boundaries
- monetization ethics
- platform and partnership expansion

## What `platform-core` governs

- Emotional safety
- Adaptive-boundary limits
- Calmness constraints
- Support-density limits
- Premium integrity
- Accessibility rules
- Operational resilience
- Content safety
- Future expansion policy
- Platform quality audits

## Product philosophy invariants

Every future change must preserve:

- emotional safety
- calmness
- realism
- dignity
- uncertainty safety
- autonomy
- human-centeredness

Every future change must avoid:

- therapy simulation
- AI companion dynamics
- emotional dependency
- manipulative retention
- self-help culture
- productivity recovery culture
- overstimulation

## Adaptive-boundary rules

Adaptive systems must stay:

- subtle
- predictable
- low-pressure
- non-invasive
- uncertainty-safe

Adaptive systems must not:

- claim the app detected an emotional state with certainty
- aggressively personalize users psychologically
- increase recommendation density during harder periods
- use adaptation to raise engagement pressure

## Premium philosophy

Premium is positioned as:

- calmer support
- deeper steadiness
- lower-friction difficult days
- adaptive simplification
- long-term continuity

Premium is not:

- a power-user AI tier
- a pressure-based upgrade funnel
- a bundle of manipulative feature locks

## AI governance

AI outputs must remain:

- emotionally restrained
- non-clinical
- non-companion-like
- bounded in interpretation
- free of dependency cues

AI outputs must not:

- simulate therapy
- imply authority over the user
- promise safety or certainty
- encourage over-reliance
- intensify vulnerability for engagement

## Accessibility principles

The platform defaults toward:

- low cognitive load
- low sensory load
- fatigue readability
- interruption-safe flows
- reduced motion support
- emotionally spacious layouts

## Future expansion rules

Before shipping Android, web, partnerships, localization, or new content systems:

1. Validate emotional safety.
2. Validate adaptive boundaries.
3. Validate calmness and density.
4. Validate accessibility and interruption safety.
5. Validate category identity and anti-drift rules.

Future additions must compose with existing ecosystems instead of introducing parallel orchestration layers.

## Growth and scaling rules

Future growth must come from:

- usefulness
- trust
- steadiness
- reduced overwhelm
- continuity
- lower friction

Future growth must not come from:

- urgency
- streaks
- dopamine loops
- emotional dependency
- manipulative reminders
- fear-based upgrades

## Community and monetization rules

Community features must not introduce:

- doom scrolling
- social comparison loops
- emotional contagion
- performative coping culture

Monetization must remain:

- transparent
- calm
- low-pressure
- respectful

Monetization must not drift into:

- urgency pricing
- emotional conversion tactics
- addiction-based retention
- fear-based upsells

## Recommended extension path

1. Start in the relevant feature or subsystem façade.
2. If cross-system policy is involved, add or update `platform-core`.
3. If the change affects long-term growth, monetization, or future platform expansion, add or update `future-platform-strategy`.
4. If the change affects identity or safety, extend the governance tests.
5. Update docs when the rule of the system changes.

## Key helpers

- `derivePlatformCoreState()`
- `validatePlatformSafety()`
- `deriveAdaptiveBoundaries()`
- `derivePlatformCalmnessConstraints()`
- `deriveSupportDensityLimits()`
- `deriveSafeExpansionRules()`
- `deriveFutureGovernancePolicies()`
- `derivePlatformQualityAudits()`
- `deriveFuturePlatformStrategy()`
- `validateFutureExpansion()`
