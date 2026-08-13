# Digital Functional Boundary v0.2

Status: candidate implementation boundary for Issue #118.

This document separates controls that have real behaviour from controls that remain visual/reserved.

## Active surface

`digital.html`

The Digital page is the current product direction. Classic and Hybrid are references only.

## Working transport and pattern behaviour

### Pattern model

- 32 internal steps.
- 16 visible step cards.
- Bank A edits steps 01–16.
- Bank B edits steps 17–32.
- Bank state is preserved when switching the visible edit bank.
- Play Range is independent of Edit Bank.
- Play Range A plays 01–16.
- Play Range B plays 17–32.
- Play Range A+B plays 01–32.

### Internal clock

- Tempo range: 40–240 BPM.
- Base pulse: 1/16 note.
- A step remains active for its `Length` value in base pulses.
- Length range: 1–16 pulses.
- The status display reports the current pulse as `pulse/length`.

### External clock

`External` arms the Sequencer for targeted `merrinlab.patch.v0.1` clock input.

External clock messages are consumed but are not echoed back as clock output. This prevents simple patch-bus feedback loops.

### Traversal

Working traversal modes:

- Forward
- Reverse
- Ping-Pong
- Random

Skipped steps are removed from traversal. If every step in the active Play Range is skipped, the Sequencer reports `All steps skipped` and emits no pitch/gate event.

### Gate modes

**Single**

One gate/trigger is emitted at the start of the step. The gate is held for 85% of the complete step duration.

**Multi**

A gate/trigger is emitted on every base clock pulse while the step is active. Each pulse gate is held for 60% of one base pulse.

### Per-step state

Each of the 32 steps stores:

- `pitch`
- `length`
- `mute`
- `skip`
- `accent`
- `glide`

Semantics:

- Mute: consumes time; pitch/step state still updates; gate/trigger is suppressed.
- Skip: does not become the active playback step.
- Accent: emits an accent state message.
- Glide: travels with pitch-CV output as a downstream interpretation hint.

### Manual controls

Working:

- Run
- Stop
- Reset
- Manual Step
- per-step Gate/Preview button
- Edit Bank
- Play Range
- Clock Rate
- Internal / External
- Gate Mode
- Direction
- M/S/A/G

## Patch outputs

Working message types:

- `clock` — internal clock only;
- `step-index`;
- `pitch-cv`;
- `gate`;
- `trigger`;
- `reset`;
- `accent`.

See `MerrinLab_Patch_Protocol_v0.1.md`.

## Patch inputs

Targeted input types:

- `clock`;
- `reset`;
- `transport`;
- `transpose`.

## Reserved / visual-only controls

These are visible but do not yet change engine behaviour:

- Original / Clean mode switch as an actual engine mode;
- Normal / Quantized clock selector;
- visible jack objects as clickable patch sockets.

The current engine uses Digital/Clean behaviour regardless of the retained Original/Clean reference selector.

## Not implemented

- audio generation;
- MIDI;
- probability;
- dedicated ratchet count;
- swing;
- scale quantising;
- modulation lanes;
- pattern save/load;
- pattern chaining;
- standalone packaging;
- plugin packaging;
- direct visual patch cables.

## Safety behaviour

- Stop clears active clock timers.
- Stop forces any open gate closed.
- Reset forces any open gate closed.
- Direction, Play Range, Gate Mode, and Clock Source changes force open gates closed before changing traversal state.
- Incoming patch-bus messages must be explicitly addressed to this Sequencer (or `*`).
- The Sequencer ignores its own patch-bus messages.
