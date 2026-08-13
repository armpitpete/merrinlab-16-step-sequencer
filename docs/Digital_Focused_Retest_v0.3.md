# Digital focused retest v0.3

Use the browser candidate after the hands-on repair. Only retest the behaviours that were unresolved or failed in the first pass.

## A. Direction while running

1. Run Forward until the sequence is several steps in.
2. Press Reverse.
3. Confirm the next movement continues from the current position instead of jumping to the beginning/end.
4. Repeat with Ping-Pong and Random.

Pass condition: changing Direction does not reset transport position. Reset remains the explicit control that chooses a direction-specific start.

## B. Edit Bank while running

1. Run Play Range A+B.
2. While transport is moving, switch Edit Bank A to B and back.

Pass condition: playback continues. Edit Bank only changes the 16 visible editable cards. The Current Bank readout continues to show the bank that is actually playing.

## C. M / S / A / G without sound

Use the new Control Monitor.

- Mute: the step shows `MUTED`; Gate does not open and trigger count stays 0.
- Skip: the step is omitted from traversal; toggling S is reported by the monitor.
- Accent: Accent shows ON for that step.
- Glide: Glide shows ON for that step.

## D. Single versus Multi

Set one step to Length 4.

- Single: Control Monitor trigger count reaches 1 for the step.
- Multi: trigger count advances once per pulse and reaches 4.

Pass condition: the difference is visible without requiring audio.

Previously reported OK: Run/Stop/Reset and basic Step Length. Repeat those only if a regression appears.
