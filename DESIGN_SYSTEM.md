# DESIGN SYSTEM — Tohu

## Intent

The Tohu interface must make behavioral intelligence feel calm, trustworthy and operational. The core visual moment is "Qui est dans la room": participants, cognitive scores, interaction modes, evidence levels and sources.

## Tokens

Primary tokens live in `src/styles/theme.css`.

- Background: `--color-lavender-50`
- Surface: `--color-card`
- Primary: `--color-violet-primary`
- Text: `--color-text-primary`, `--color-text-secondary`
- Semantic: sage, amber, coral, blue
- Radius: default `14px`, compact cards use `8px`
- Fonts: Epilogue for UI/display, JetBrains Mono for scores/data

## Components

Design primitives live in `src/app/components/design-system`.

- `Button`: primary, secondary, ghost, danger; supports icons and loading.
- `Card`: base surface with optional hover/motion.
- `Badge`: semantic status pills.
- `Input`: labeled field with optional icon.
- `ScoreDisplay`: numeric score with optional confidence bar.
- `ProgressBar`: axis and score visualization.
- `DataSourcePill`: shows source plus inference level/status.
- `EmptyState`, `ErrorState`, `LoadingState`: standard non-happy states.
- `Modal`, `Drawer`: lightweight primitives for future interactions.

Compatibility wrappers remain in `src/app/components/knowr` so existing screens can migrate gradually.

## Inference Visual Language

Use both text and color. Never encode confidence only through color.

- Observable: sage / "Observable"
- Inferred: blue / "Inféré"
- Hypothetical: amber / "Hypothétique"
- Unavailable: muted / "Non disponible"

Every behavioral insight should expose:

- source label,
- inference level,
- confidence score when available,
- short operational implication.

## Page Patterns

### Brief

`MeetingAnalysis.tsx` centers the brief around "Qui est dans la room". Participant cards come before secondary deal context. The selected participant drives the interaction profile, axes, behavioral signals and recommended strategy.

### Relations

`Relations.tsx` is a relationship memory index, not a CRM table. It prioritizes confidence, engagement, phase, interaction mode and next move.

### Relation Detail

`RelationDetail.tsx` is the cognitive/behavioral file for a person. It surfaces identity, sources, scores, axes, signals, strategy and relationship history.

## Accessibility Rules

- All icon-only buttons require `aria-label`.
- Focus states use visible primary rings.
- Inputs use visible labels, not placeholders only.
- Badges include text labels for status.
- Interactive card rows must preserve keyboard focus.

## Implementation Rules

- Prefer design-system primitives for new UI.
- Keep business logic out of design primitives.
- Do not introduce inline arbitrary styling unless it is unavoidable for dynamic values.
- If a component needs new visual states, extend the primitive rather than duplicating local class sets.

