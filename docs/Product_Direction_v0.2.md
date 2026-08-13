# MerrinLab 16-Step Sequencer — Product Direction v0.2

## Product identity

The Sequencer is the **pattern / control laboratory** in the MerrinLab instrument family.

It stays separate from MerrinLab Ultimate Synth.

The two products should interoperate closely, but a player should be able to understand and use either one without opening the other.

## Core proposition

A visible 16/32-step sequencer that can control pitch, gates, rhythm, and eventually arbitrary modulation destinations.

The instrument should feel like a playable control surface rather than a hidden DAW piano roll.

## Current foundation

The Digital direction already provides:

- 32 internal steps in Bank A/B;
- 16 visible step cards;
- independent Edit Bank and Play Range;
- variable step lengths;
- transport;
- four traversal modes;
- Single/Multi gate behaviour;
- Mute/Skip/Accent/Glide;
- internal and external browser clock control;
- MerrinLab patch-bus control messages.

## Product rule

Do not make the Sequencer an audio synth.

Its job is:

```text
events + timing + control -> other instruments
```

Ultimate's job is sound generation and processing.

SpectraSynth's job is timbral/melodic sound behaviour.

## Development stages

### Stage 1 — control-engine integrity

Current Issue #118 lane.

Required before adding more advanced features:

- exact functional boundary;
- real pulse-based step length;
- direction;
- M/S/A/G;
- gate modes;
- internal/external clock;
- explicit patch protocol;
- repeatable human acceptance checklist.

### Stage 2 — expressive step sequencing

Add in bounded features, one at a time:

- probability/rest chance;
- dedicated ratchet count per step;
- swing;
- scale/root quantising;
- transpose controls;
- gate-length control independent of step length;
- copy/paste/clear step and bank actions.

Do not let these turn the 16-step surface into an unreadable spreadsheet.

### Stage 3 — modulation lanes

This is the feature that most directly strengthens Ultimate integration.

Add one tested lane first:

```text
Step -> Mod CV 1 -> chosen MerrinLab destination
```

Then consider additional lanes only if the first is musically useful.

Example destinations in Ultimate:

- filter cutoff;
- PWM;
- VCA amount;
- oscillator linear/log pitch modulation;
- state-variable filter parameters;
- effect mix.

The Sequencer should emit generic modulation values. Ultimate should decide how a destination interprets them.

### Stage 4 — pattern memory and chaining

Add:

- pattern save/load;
- several named slots;
- copy/clear;
- A/B pattern chaining;
- longer song/performance chains only after the small pattern system is solid.

Browser local persistence can prove the model before native/plugin persistence exists.

### Stage 5 — MIDI interoperability

Add:

- MIDI note output;
- MIDI clock;
- start/stop/continue;
- external MIDI clock sync;
- MIDI channel selection.

MIDI should complement the MerrinLab patch system, not replace it.

### Stage 6 — application/plugin product

After the sequencing model is stable:

- standalone desktop application;
- plugin build suitable for host routing;
- preset/pattern storage;
- resizable production UI;
- versioned migration of saved patterns;
- host tempo/transport integration where supported.

## Ultimate integration

The target relationship is:

```text
MerrinLab 16-Step Sequencer
        |
        | pitch / gate / trigger / clock / modulation
        v
MerrinLab Ultimate Synth
        |
        v
sound
```

Do not merge the two interfaces.

Instead, make the connection obvious and low-friction.

## SpectraSynth relationship

SpectraSynth remains separate.

Its note-to-filter/timbral movement system can later accept Sequencer clock, notes, or modulation, but SpectraSynth's defining movement engine should not be copied wholesale into this Sequencer.

## Things not to prioritise

Do not prioritise:

- built-in oscillators;
- built-in subtractive synth voice;
- giant sample engine;
- a DAW-style piano-roll editor;
- hundreds of pattern slots before save/load basics work;
- decorative complexity that hides timing state.

## Success criterion

A useful test is:

> Can a player make Ultimate behave in a musically interesting new way by connecting the Sequencer, without needing to understand an internal modulation matrix?

If yes, the Sequencer is doing its job.
