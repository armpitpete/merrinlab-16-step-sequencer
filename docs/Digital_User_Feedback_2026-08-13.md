# Digital hands-on feedback — 13 August 2026

Candidate tested before repair: `80f4123f2a7f6221a7167eb1cafd60307e182236`.

Results reported by the owner:

- Run / Stop / Reset: OK.
- Step Length: OK.
- Direction modes worked, but pressing a direction control reset playback position. Treat as defect.
- Mute / Skip / Accent / Glide were difficult to evaluate without a connected consumer.
- Edit Bank switching stopped playback and restarted from the beginning. Treat as defect because Edit Bank should be independent of Play Range.
- Single / Multi Gate had no obvious visible effect, so it was not meaningfully testable.

Repair target:

- direction changes preserve current position;
- Edit Bank switching does not stop/reset transport;
- Current Bank reflects playback bank, not edit bank;
- add a visible Control Monitor for Mute, Skip, Accent, Glide, Gate, trigger count, Pitch CV and Gate Mode.

Focused retest only: direction switching, Edit Bank switching, M/S/A/G visibility, and Single versus Multi trigger count. Previously passed transport and basic Length checks need only be repeated if a regression appears.
