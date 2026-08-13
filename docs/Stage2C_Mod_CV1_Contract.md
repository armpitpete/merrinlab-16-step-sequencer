# Stage 2C — Mod CV 1 contract

Protected base: `5424daab408d6af6d247f9f96da767339d3d9644`

Issue: `#124`

## Purpose

Add the first dedicated non-note control lane to the MerrinLab Sequencer without changing the accepted Stage 2A/2B transport, note, swing, quantize or ratchet engine.

## Lane model

- 32 stored values, one per global step.
- Bank A = steps 01–16; Bank B = steps 17–32.
- Normalized bipolar range: `-1.00 … +1.00`.
- Resolution in the browser editor: `0.01`.
- Default value: `0.00`.
- Lane id: `mod-cv-1`.
- Stable source id: `merrinlab-16-step-sequencer.mod-cv-1`.

## Emission rule

`mod-cv` is emitted once for every `step-index` event, meaning every step that is actually entered by the traversal.

This is intentionally independent of note suppression:

- **Rest**: Mod CV still emits.
- **Chance failure**: Mod CV still emits.
- **Mute**: Mod CV still emits.
- **Skip**: no Mod CV, because a skipped step is never entered and therefore produces no `step-index` event.

Manual/preview step entry also produces Mod CV because it uses the same accepted `step-index` boundary.

## Patch-bus envelope

Channel:

```text
merrinlab-patch-bus
```

Protocol:

```text
merrinlab.patch.v0.1
```

Example output:

```js
{
  protocol: "merrinlab.patch.v0.1",
  source: "merrinlab-16-step-sequencer",
  type: "mod-cv",
  time: 1234.5,
  payload: {
    lane: 1,
    laneId: "mod-cv-1",
    sourceId: "merrinlab-16-step-sequencer.mod-cv-1",
    value: -0.5,
    normalized: -0.5,
    step: 17,
    visibleStep: 1,
    bank: "B",
    playRange: "A+B",
    reason: "step-enter"
  }
}
```

`value` and `normalized` are the same Stage 2C normalized software-control value. They are **not physical voltage claims**.

## Consumer rules

A consumer must:

1. validate protocol, source/type, lane and finite numeric value;
2. clamp the received normalized value to `-1 … +1`;
3. map the generic lane through an explicit destination/depth control;
4. keep no-message/disconnect behaviour neutral and deterministic;
5. never reinterpret this as a note pitch CV or physical-voltage guarantee.

## First Ultimate target

The first cross-repository target is Ultimate VCLPF cutoff modulation, tracked in `armpitpete/merrinlab-ultimate-synth#81`.

Ultimate must add an explicit Mod CV depth/amount and safety clamp. It must not hijack CV-Out, Input, Trig, Glide, or another unrelated visible control.

## Preserved boundary

Stage 2C does not add MIDI CC, more modulation lanes, a destination matrix, modulation recording, per-step slew, plugin packaging, or an Ultimate audio mapping inside this repository.
