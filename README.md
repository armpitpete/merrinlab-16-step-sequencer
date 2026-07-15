# MerrinLab 16-Step Sequencer

Browser-based sequencer mockup and patch-control experiment for the MerrinLab software-instrument family.

## Current direction

The active design direction is the **Digital 16/32-Step Sequencer**.

The repository also keeps two non-current references:

- **Classic** — a Ray-style 16-step panel reference for visual and possible hardware study;
- **Hybrid** — an earlier experiment retained for comparison.

These references are not the active implementation target.

## Current surfaces

- `index.html` — view selector and project entry point;
- `digital.html` — current digital 16/32-step direction;
- `classic.html` — classic reference;
- `hybrid.html` — experimental reference.

The digital direction includes interface concepts such as:

- Bank A/B;
- selectable play range;
- 16/32-step operation;
- software-oriented Clean-mode controls.

## Current status

**Design and browser-mockup stage.**

Do not assume a visible control is functional merely because it appears on a panel. Functional timing, transport, step data, patch-bus output and external instrument control must each be proved and documented separately.

## Family relationship

Shared MerrinLab/MFOS rules and patch-bus authority belong in:

`armpitpete/merrinlab-mfos-docs`

Related instrument repositories include:

- `armpitpete/merrinlab-alien-screamer`;
- `armpitpete/mfos-echo-rockit`;
- `armpitpete/merrinlab-ultimate-synth`;
- `armpitpete/merrinlab-vcv`.

## Immediate gate

Before expanding the interface:

1. inventory which digital-view controls currently have real behaviour;
2. mark all visual-only controls explicitly;
3. define one bounded transport proof;
4. define the exact `merrinlab.patch.v0.1` messages, if any, that this sequencer sends;
5. add a repeatable manual test checklist;
6. record an accepted version checkpoint.

## Stop rule

Do not add more panel controls, banks, modes or patch destinations until the current digital view has a documented functional boundary and one tested transport path.
