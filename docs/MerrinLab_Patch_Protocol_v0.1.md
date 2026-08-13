# MerrinLab Patch Protocol v0.1 — Sequencer contract

This is the browser-prototype control contract used by the Digital MerrinLab Sequencer.

It is not a MIDI, OSC, VST, audio, or hardware-CV specification.

## Transport

Browser channel:

```text
merrinlab-patch-bus
```

Protocol identifier:

```text
merrinlab.patch.v0.1
```

Messages are published through `BroadcastChannel` when available and also dispatched as a window `CustomEvent` for same-page experiments.

## Envelope

Output messages use:

```js
{
  protocol: "merrinlab.patch.v0.1",
  source: "merrinlab-16-step-sequencer",
  type: "pitch-cv",
  time: 1234.5,
  payload: { ... }
}
```

`time` is browser `performance.now()` time.

## Addressing inputs

Input messages must contain either:

```js
target: "merrinlab-16-step-sequencer"
```

or:

```js
payload: {
  target: "merrinlab-16-step-sequencer"
}
```

`target: "*"` is also accepted.

The Sequencer ignores unaddressed messages and messages whose `source` is itself.

This is deliberate: the browser bus is shared, so unrelated clock traffic must not accidentally start driving the Sequencer.

# Outputs

## `clock`

Emitted for **internal clock pulses only**.

Example payload:

```js
{
  step: 1,
  visibleStep: 1,
  bank: "A",
  playRange: "A",
  pulse: 1,
  stepLength: 4,
  bpm: 120,
  subdivision: "1/16"
}
```

When External clock is selected, received clock messages are not echoed as `clock` output.

## `step-index`

Emitted once when a new playback step begins.

```js
{
  step: 17,
  visibleStep: 1,
  bank: "B",
  playRange: "A+B"
}
```

## `pitch-cv`

Emitted once when a new step begins, including muted steps.

```js
{
  step: 1,
  visibleStep: 1,
  bank: "A",
  playRange: "A",
  value: 0,
  pitch: 60,
  sourcePitch: 60,
  transposeSemitones: 0,
  glide: false
}
```

`value` uses a software 1V/oct-style normalisation:

- MIDI 60 / C4 = `0`
- MIDI 72 / C5 = `1`
- MIDI 48 / C3 = `-1`

This is a software control value, not a claim of physical voltage output.

## `gate`

Gate-open example:

```js
{
  open: true,
  step: 1,
  visibleStep: 1,
  bank: "A",
  playRange: "A",
  accent: false,
  glide: false,
  reason: "single-step"
}
```

Gate-close uses the same step identity with:

```js
open: false
```

Reasons currently include:

- `single-step`
- `multi-pulse`
- `manual-multi`
- `preview-multi`
- `retrigger`
- `transport-stop`
- `traversal-reset`
- `gate-mode-change`
- `clock-source-change`

Muted steps do not emit gate-open or trigger messages.

Gate width follows the active clock timing reference:

- Internal: the local 1/16-note pulse interval derived from the Rate control.
- External: the measured interval between valid incoming clock messages once two pulses have been seen.
- First External pulse: local Rate is used as a safe fallback because no external interval exists yet.

Only measured external intervals from 20 to 5000 ms are accepted for gate-width timing.

## `trigger`

Emitted with each gate-open event.

Single mode: once at step start.

Multi mode: once per base pulse while the step is active.

## `accent`

Emitted once at step start:

```js
{
  step: 1,
  visibleStep: 1,
  bank: "A",
  playRange: "A",
  active: true
}
```

Sending `active: false` on non-accented steps lets a downstream consumer clear accent state explicitly.

## `reset`

Emitted for local Reset:

```js
{
  step: 1,
  visibleStep: 1,
  bank: "A",
  playRange: "A",
  direction: "forward"
}
```

A received reset is not re-emitted.

# Inputs

All inputs below must be explicitly targeted.

## External `clock`

```js
{
  protocol: "merrinlab.patch.v0.1",
  source: "external-clock",
  target: "merrinlab-16-step-sequencer",
  type: "clock",
  time: 0,
  payload: {}
}
```

Effect:

- only acts while the Sequencer is Running;
- only acts while External clock is selected;
- one received message = one base pulse;
- received external clocks are not echoed as `clock` output;
- the interval between accepted pulses is measured for gate-width timing;
- changing clock source clears the previous external timing estimate.

## `transport`

```js
{
  protocol: "merrinlab.patch.v0.1",
  source: "controller",
  target: "merrinlab-16-step-sequencer",
  type: "transport",
  time: 0,
  payload: {
    action: "run"
  }
}
```

Supported actions:

- `run`
- `stop`
- `reset`

## `reset`

A targeted `type: "reset"` performs a reset without echoing another reset message.

## `transpose`

```js
{
  protocol: "merrinlab.patch.v0.1",
  source: "controller",
  target: "merrinlab-16-step-sequencer",
  type: "transpose",
  time: 0,
  payload: {
    semitones: 12
  }
}
```

Transpose is clamped to -48…+48 semitones and applied to future `pitch-cv` output.

# Ultimate Synth relationship

The intended future mapping is conceptually:

```text
Sequencer pitch-cv -> Ultimate oscillator pitch
Sequencer gate     -> Ultimate AR/ADSR gate
Sequencer trigger  -> Ultimate trigger inputs
Sequencer clock    -> Ultimate clock/S&H destinations
Sequencer accent   -> user-selected emphasis destination
future mod-cv lane -> Ultimate filter/PWM/VCA/etc.
```

Those destination bindings are **not** implemented by this repository yet.
