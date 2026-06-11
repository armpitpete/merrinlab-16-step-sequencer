# MerrinLab 16-Step Sequencer — 32-Step Banking Mode v0.1

## Locked Decision

32-step mode uses two 16-step banks.

Bank A contains steps 1–16.

Bank B contains steps 17–32.

The interface shows one bank at a time.

Edit Bank chooses what the user is editing.

Play Range chooses what the sequencer plays.

This keeps the sequencer readable while still allowing 32-step patterns.

## Bank Structure

```text
Bank A = Steps 01–16
Bank B = Steps 17–32
```

The main panel should keep the classic 16-step layout.

The selected bank changes which 16 steps are visible.

## Edit Bank Control

The interface should include an Edit Bank control:

```text
EDIT BANK: A / B
```

This chooses which bank is shown for editing.

When Bank A is selected, the visible step labels are:

```text
01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16
```

When Bank B is selected, the visible step labels are:

```text
17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32
```

## Play Range Control

The interface should include a separate Play Range control:

```text
PLAY RANGE: A / B / A+B
```

This chooses what the sequencer plays.

- A = play steps 1–16
- B = play steps 17–32
- A+B = play steps 1–32 as one chained sequence

## Why Edit Bank and Play Range Are Separate

The user may want to play A+B while editing Bank B.

This allows the full 32-step pattern to keep running while the second half is adjusted.

## Interface Rule

Do not show all 32 steps at once in the default view.

The default view should remain readable and hands-on.

The 32-step feature should feel like an extension of the 16-step panel, not a crowded new instrument.

## Good Enough for v0.1

The first interface mockup is good enough if it shows:

- 16 visible step slots
- Edit Bank A/B control
- Play Range A/B/A+B control
- clear step labels that can represent Bank A or Bank B
- no crowded 32-step all-at-once panel
