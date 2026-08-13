# MerrinLab 16-Step Sequencer

Browser-based 16/32-step control sequencer for the MerrinLab software-instrument family.

## Product role

The Sequencer is a separate MerrinLab instrument.

- **MerrinLab Ultimate Synth** — synthesis laboratory.
- **MerrinLab 16-Step Sequencer** — pattern / control laboratory.
- **SpectraSynth** — timbral-melody instrument.

The Sequencer should connect to Ultimate and other MerrinLab instruments; it should not be merged into Ultimate as one giant interface.

## Current direction

The active implementation is the **Digital 16/32-Step Sequencer** in `digital.html`.

Classic and Hybrid remain reference surfaces only:

- `classic.html` — hardware-style visual reference;
- `hybrid.html` — earlier hybrid experiment.

## What works now

The Digital sequencer has a real 32-step pattern model with 16 visible cards at a time.

Working behaviour includes:

- Edit Bank A = steps 01–16;
- Edit Bank B = steps 17–32;
- Play Range A, B, or A+B;
- internal 1/16-note clock at 40–240 BPM;
- per-step pitch;
- per-step length of 1–16 clock pulses;
- Forward, Reverse, Ping-Pong, and Random traversal;
- Single and Multi gate modes;
- per-step Mute, Skip, Accent, and Glide state;
- Run, Stop, Reset, and Manual Step;
- software 1V/oct-style pitch-CV messages;
- clock, step-index, pitch-CV, gate, trigger, reset, and accent output messages;
- targeted external clock, transport, reset, and transpose input through the MerrinLab patch bus.

The exact functional boundary is documented in:

`docs/Digital_Functional_Boundary_v0.2.md`

The patch-bus contract is documented in:

`docs/MerrinLab_Patch_Protocol_v0.1.md`

## Important limits

The current Digital build does **not** yet provide:

- audio generation;
- physical/visual patch-cable routing;
- probability;
- dedicated ratchet-count controls beyond Multi gate;
- swing;
- scale quantising;
- modulation/CV lanes;
- pattern save/load or pattern chaining;
- MIDI input/output or MIDI clock;
- standalone application packaging;
- VST/AU plugin builds.

`Normal / Quantized` remains a reserved visual control.

The Original/Clean mode selector is retained as a design reference; the current working engine is the Digital/Clean behaviour.

## Timing rule

Step `Length` means **clock pulses occupied by the step**, not merely gate length.

At 120 BPM the internal base pulse is a 1/16 note. A step with `Length = 4` occupies four of those pulses before traversal moves to the next playable step.

## M/S/A/G semantics

- **Mute** — the step consumes its normal time and still outputs pitch/step state, but gate/trigger output is suppressed.
- **Skip** — the step is omitted from playback traversal.
- **Accent** — the step emits `accent: true`.
- **Glide** — the step emits `glide: true` with pitch-CV output for downstream instruments to interpret.

## MerrinLab patch bus

Browser prototypes communicate on:

`merrinlab-patch-bus`

Messages use:

`merrinlab.patch.v0.1`

External input messages must be explicitly targeted to `merrinlab-16-step-sequencer` (or `*`) so unrelated bus traffic cannot accidentally drive the Sequencer.

The current browser bus is an interoperability proof, not the final standalone/plugin routing system.

## Manual acceptance

Use:

`docs/Digital_Manual_Test_Checklist_v0.2.md`

Do not record a new accepted checkpoint until the Digital build has passed the hands-on checklist.

## Product roadmap

The next product stages are recorded in:

`docs/Product_Direction_v0.2.md`

Priority after this core lane:

1. probability / rests and dedicated ratchets;
2. swing and scale quantising;
3. one or more per-step modulation/CV lanes;
4. pattern save/load and chaining;
5. MIDI note/clock/transport;
6. standalone and plugin packaging;
7. direct MerrinLab host routing to Ultimate and other instruments.

## Development rule

Keep the Sequencer focused on controlling musical events through time.

Do not turn it into an audio synth.

Do not hide its timing/control role inside Ultimate.

Do not claim roadmap features as working until they have their own implementation and acceptance evidence.

## Deployment boundary

GitHub Pages deploys only from `main`.

Feature branches and pull requests do not authorise merge or public deployment.
