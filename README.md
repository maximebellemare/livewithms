# LiveWithMS

LiveWithMS is a calm-support product for people living with MS. The platform is designed to reduce overwhelm, support steadiness, and make difficult periods feel lighter and more manageable without drifting into therapy simulation, AI-companion dynamics, productivity pressure, or manipulative retention.

## Product identity

- Calm, emotionally safe support during difficult days
- Low-energy accessibility and adaptive simplification
- Nervous-system-friendly pacing, density, and tone
- Long-term continuity without streaks, urgency, or emotional dependency

## Stable architecture

The codebase now has a stable platform entry point:

- `lib/platform-core`

`platform-core` is the long-term façade for:

- governance
- emotional safety
- adaptive boundaries
- support-density limits
- calmness constraints
- Premium integrity
- future expansion rules
- accessibility
- operational resilience

Underneath that, the platform composes the established subsystem layers:

- `lib/platform-governance`
- `lib/adaptive-intelligence`
- `lib/calm-life-support`
- `lib/emotional-support-engine`
- `lib/programs-ecosystem`
- `lib/continuity-intelligence`
- `lib/calm-environment`

Long-horizon scaling policy lives in:

- `lib/future-platform-strategy`

Use it when work touches growth, monetization, community, platform expansion, partnerships, or future AI capabilities.

## Core rules

- Do not add new conceptual support categories unless an existing layer cannot responsibly absorb the need.
- Prefer reuse through `platform-core` and the subsystem façades before creating new orchestration logic.
- Keep AI bounded, non-clinical, non-companion-like, and uncertainty-safe.
- Keep Premium calm, low-pressure, and outcome-oriented instead of feature-heavy or manipulative.
- Preserve interruption safety, fatigue readability, and low sensory load.

## Development

```sh
npm install
npm run dev
```

## Verification

Common checks:

```sh
npm run typecheck:native
npm run test:unit
```

Focused architecture suites often used during platform work:

```sh
npm run test:unit -- src/test/platform-core/unified-platform-core.test.ts
npm run test:unit -- src/test/future-platform-strategy/unified-future-platform-strategy.test.ts
npm run test:unit -- src/test/platform-governance/unified-platform-governance.test.ts
npm run test:unit -- src/test/platform-stewardship/launch-readiness-audit.test.ts
```

## Further reading

- `docs/architecture-foundation.md`
- `docs/ux-writing-guidelines.md`
