# Stage 2B — Swing + Quantising manual acceptance

Protected base: `3f7ac8074a461f080fbe8ab4ba4779719bce4ca9`

Candidate branch: `issue-122-stage2b-candidate`

## Purpose

Verify only the new Stage 2B musical-expressiveness surface plus the one Stage 2A interaction that timing changes could affect.

## Browser checks

1. **Straight timing** — set Swing to 50%. Pulse monitor should remain STRAIGHT and pulse duration should be even.
2. **Swing** — set Swing around 66%. Pulse monitor should alternate LONG / SHORT and the values should alternate correspondingly without transport jumping.
3. **Live Swing / Rate edits** — while Running, move Swing and Rate. The current traversal must continue; changing either control must not inject an immediate extra step/pulse.
4. **Normal pitch** — Normal mode must preserve the raw post-transpose pitch as output pitch.
5. **Quantized C Major** — choose C + Major + Quantized. Raw chromatic pitches outside C major must snap to a C-major note. The Groove / Pitch monitor must show Raw Pitch and Output Pitch clearly.
6. **Root / Scale live edits** — changing Root or Scale while Running must affect future note starts without restarting transport.
7. **External clock boundary** — External clock remains authoritative; local Swing must not re-time incoming clock pulses.
8. **Stage 2A ratchet interaction** — with a longer step and Ratchet 4, enable Swing around 66%. Four expressive triggers must still occur and remain distributed across the complete swung step rather than bunching according to only the last long/short pulse.
9. **Stage 2A smoke check** — one Chance value, Rest, and Bank A/B expressive setting should still behave as previously accepted.

## Acceptance record

Result: **NOT YET ACCEPTED**

Do not merge until hands-on browser proof passes on the exact candidate head. Any runtime mutation after acceptance requires a new exact-head acceptance.
