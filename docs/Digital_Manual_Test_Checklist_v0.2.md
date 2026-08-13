# Digital Manual Test Checklist v0.2

Issue: #118

Purpose: hands-on acceptance of the Digital 16/32-step control engine.

Do not mark the candidate accepted from code inspection alone.

## Test setup

Open `digital.html` from the candidate branch/build.

Start with:

- Edit Bank A
- Play Range A
- Clock Internal
- Gate Mode Single
- Direction Forward
- all M/S/A/G buttons off
- 120 BPM

## 1. Basic transport

- [ ] Run starts playback.
- [ ] Stop stops playback.
- [ ] Stop does not leave a gate open in a connected/monitored consumer.
- [ ] Reset returns the traversal display to Step 01 in Forward mode.
- [ ] Manual Step advances one playable step while stopped.

## 2. Real step length

Set:

```text
Step 01 Length = 4
Step 02 Length = 1
```

- [ ] Run.
- [ ] Status shows Step 01 pulse 1/4, 2/4, 3/4, 4/4.
- [ ] Step 02 then occupies one pulse.
- [ ] Changing Length changes how long the step occupies, not merely its gate time.
- [ ] Length code display follows `length - 1` as the 4-bit hardware-style code.

## 3. 32-step banking

- [ ] Edit Bank A shows 01–16.
- [ ] Change at least one pitch and length in Bank A.
- [ ] Edit Bank B shows 17–32.
- [ ] Change at least one pitch and length in Bank B.
- [ ] Return to Bank A and confirm its values persisted.
- [ ] Return to Bank B and confirm its values persisted.

## 4. Play ranges

While stopped:

- [ ] Play Range A starts/resets at the A range.
- [ ] Play Range B starts/resets at the B range.
- [ ] Play Range A+B crosses from 16 to 17 and loops from 32 to 01 in Forward mode.

## 5. Direction

Use a short range with Length = 1 for easy checking.

- [ ] Forward increases step numbers and wraps.
- [ ] Reverse decreases step numbers and wraps.
- [ ] Ping-Pong reaches an end, reverses, and does not duplicate the end step on the turn.
- [ ] Random selects only steps inside the active Play Range.

## 6. Mute / Skip / Accent / Glide persistence

Pick four different steps.

- [ ] Toggle M on one step.
- [ ] Toggle S on one step.
- [ ] Toggle A on one step.
- [ ] Toggle G on one step.
- [ ] Switch Edit Bank away and back.
- [ ] All four states persist on their original steps.

Behaviour:

- [ ] Muted step still consumes its Length.
- [ ] Muted step does not emit gate-open/trigger.
- [ ] Skipped step is omitted from traversal.
- [ ] Accent step emits `accent.active = true`.
- [ ] Glide step emits `pitch-cv.glide = true`.
- [ ] If every step in the Play Range is skipped, status says `All steps skipped`.

## 7. Gate mode

Use one unmuted step with Length = 4.

Single:

- [ ] One gate/trigger occurs at step start.
- [ ] It is not retriggered on pulses 2–4.

Multi:

- [ ] A gate/trigger occurs on each of the four pulses.
- [ ] Switching gate mode does not leave an old gate open.

## 8. Patch-bus monitor

A simple same-page monitor can be installed in browser DevTools:

```js
window.addEventListener("merrinlab-patch-bus", (event) => {
  if (event.detail?.source === "merrinlab-16-step-sequencer") {
    console.log(event.detail);
  }
});
```

- [ ] Internal playback emits `clock`.
- [ ] New steps emit `step-index`.
- [ ] New steps emit `pitch-cv`.
- [ ] Gate openings emit `gate` and `trigger`.
- [ ] Reset emits `reset`.
- [ ] Each step start emits `accent` true or false.

## 9. External clock

Select External and press Run. Status should show `External · armed`.

In DevTools, send a targeted pulse:

```js
window.dispatchEvent(new CustomEvent("merrinlab-patch-bus", {
  detail: {
    protocol: "merrinlab.patch.v0.1",
    source: "manual-test-clock",
    target: "merrinlab-16-step-sequencer",
    type: "clock",
    time: performance.now(),
    payload: {}
  }
}));
```

- [ ] Each targeted clock message advances exactly one base pulse.
- [ ] Untargeted clock messages are ignored.
- [ ] The Sequencer's own output messages do not drive its external input.
- [ ] Received external clocks are not echoed as clock output.

## 10. External transport and transpose

- [ ] Targeted `transport: run` starts/arms.
- [ ] Targeted `transport: stop` stops.
- [ ] Targeted `reset` resets without an output-reset echo loop.
- [ ] Targeted `transpose` changes future pitch output.
- [ ] Transpose clamps at -48…+48 semitones.

## 11. Regression boundary

- [ ] Classic page still loads.
- [ ] Hybrid page still loads.
- [ ] Digital page still shows all 16 visible step cards.
- [ ] No audio generation was added.
- [ ] No MIDI claim appears.
- [ ] No standalone/plugin claim appears.
- [ ] Feature branch has not deployed Pages.

## Acceptance record

Leave this section unchanged until a human performs the checklist.

```text
Candidate SHA:
Tester:
Date:
Result: NOT YET ACCEPTED
Notes:
```
