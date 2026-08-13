# Digital UI follow-up v0.4

Owner feedback after the focused retest on 2026-08-13:

- functional retest passed;
- Mute / Skip / Accent / Glide should visibly glow when active;
- changing a step Length should show its numeric value.

Candidate response:

- preserve the accepted sequencer engine unchanged as `src/digital-sequencer-engine.js`;
- load it through the existing `src/digital-sequencer.js` entry point;
- add a separate UI-feedback layer that gives active M/S/A/G buttons a strong visible glow;
- add a live numeric Length output to each visible step, including resynchronisation when Edit Bank changes.

No audio, MIDI, timing, traversal, gate, patch-bus or pattern semantics are changed by this UI follow-up.

Acceptance gate: visually confirm active M/S/A/G buttons glow and the displayed Length number follows the slider value.
