# Digital Sequencer — Stage 2A expressive hands-on test

Status: **NOT YET ACCEPTED**

Candidate scope: Issue #120 — Chance / Rest / dedicated Ratchets only.

## Preconditions

- Use the exact candidate preview for Issue #120.
- Hard-refresh before testing.
- Use Internal clock for the primary acceptance pass.
- Start with Play Range A and Edit Bank A.

## 1. Baseline regression

Confirm before expressive testing:

- Run / Stop / Reset still work.
- Length still changes occupied step time.
- Forward / Reverse / Ping-Pong / Random still work.
- Edit Bank switching does not stop or reset playback.
- M / S / A / G still retain their accepted behaviour and active glow.
- Single / Multi still retain their accepted behaviour when Rat = 1.

Any regression here blocks acceptance.

## 2. Chance = 100%

On Step 01:

1. Set Chance to `100%`.
2. Leave Rest off.
3. Set Rat to `1`.
4. Run repeatedly through Step 01.

Expected:

- Expressive Monitor always reports `PLAY` for Step 01 unless the existing Mute control is active.
- The step does not become a chance-rest.

## 3. Chance = 0%

On Step 01:

1. Set Chance to `0%`.
2. Leave Rest off.
3. Run through Step 01.

Expected:

- Step 01 still occupies its normal Length.
- Expressive Monitor reports `CHANCE REST`.
- Express Triggers remains `0` for the visit.
- It is not skipped from traversal.

## 4. Intermediate Chance

On Step 01:

1. Set Chance to `50%`.
2. Leave Rest off.
3. Let the pattern revisit Step 01 repeatedly.

Expected over repeated visits:

- some visits report `PLAY`;
- some visits report `CHANCE REST`;
- every visit keeps the same step timing.

This test is probabilistic: do not require an exact 50/50 count in a small sample.

## 5. Explicit Rest

On Step 02:

1. Set Chance to `100%`.
2. Turn Rest on.
3. Confirm the Rest button visibly glows.
4. Run through Step 02.

Expected:

- Step 02 retains its normal Length.
- Expressive Monitor reports `REST`.
- Express Triggers remains `0`.
- Rest does not behave like Skip.

Turn Rest off and confirm normal playback returns.

## 6. Dedicated Ratchet = 4

On Step 03:

1. Chance `100%`.
2. Rest off.
3. Mute off.
4. Length `4`.
5. Rat `4`.
6. Run through Step 03.

Expected:

- Expressive Monitor shows Ratchets `4`.
- Express Triggers counts to exactly `4` during that step.
- the four triggers are distributed across the occupied step;
- traversal advances only after the normal Length 4 duration.

Repeat with Rat `2` and Rat `8` as a sanity check.

## 7. Ratchet override boundary

Set Rat back to `1`.

Expected:

- dedicated ratchet override is inactive;
- existing Single / Multi gate behaviour is restored unchanged.

## 8. Mute interaction

On a step with Rat `4`:

1. Turn existing Mute on.
2. Run through it.

Expected:

- no dedicated ratchet triggers are generated;
- existing Mute semantics remain authoritative.

## 9. Bank independence

1. In Edit Bank A, set Step 01 Chance `25%`, Rest off, Rat `3`.
2. Switch to Edit Bank B.
3. Confirm Step 17 still shows Chance `100%`, Rest off, Rat `1`.
4. Set Step 17 to Chance `75%`, Rest on, Rat `5`.
5. Switch A → B → A.

Expected:

- each bank restores its own expressive settings;
- switching edit bank does not affect transport position.

## Acceptance rule

Accept Stage 2A only when:

- the baseline regression section passes;
- Chance 100 and Chance 0 behave deterministically as specified;
- intermediate Chance visibly produces both outcomes over repeated visits;
- Rest is visibly distinct from Skip and Mute;
- dedicated ratchet counts produce the requested trigger count without changing Length;
- Bank A/B expressive state is independent.

Record actual human observations before merge.