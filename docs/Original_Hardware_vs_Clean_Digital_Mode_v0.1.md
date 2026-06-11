# MerrinLab 16-Step Sequencer — Original Hardware vs Clean Digital Mode v0.1

## Locked Decision

Hardware Trim Mode is for the exact original hardware behaviour.

Clean Digital Mode is for the additions we make.

This keeps the original MFOS-style behaviour protected while allowing the software version to grow into a clearer, expanded instrument.

## Mode Names

Use these two mode names:

```text
Original Hardware / Trim Mode
Clean Digital / Extended Mode
```

Short interface labels can be:

```text
ORIGINAL
CLEAN
```

## Original Hardware / Trim Mode

This mode should stay close to the original hardware concept.

Use it for:

- original 16-step behaviour
- original duration range of 1–16 clock pulses
- 4-bit duration code display
- duration value shown as stored value 0–15 plus 1
- hardware-style trim or sweet-spot behaviour later
- original clock and gate concepts

Do not add expanded features into this mode.

Original Hardware / Trim Mode should feel like a faithful instrument model.

## Clean Digital / Extended Mode

This mode is where our additions belong.

Use it for:

- 32-step mode using Bank A and Bank B
- Edit Bank A/B
- Play Range A/B/A+B
- per-step mute
- per-step skip
- accent output
- glide or tie
- cleaner snapped length values
- visible software connection points
- future modern workflow improvements

Clean Digital / Extended Mode should be stable, clear, and easy to use.

Do not force hardware tuning problems into this mode.

## Length Value Rule

Both modes can use the same basic duration idea:

```text
storedLength = 0–15
visibleLength = storedLength + 1
```

But the user experience is different.

Original Hardware / Trim Mode may show trim behaviour and binary stability.

Clean Digital / Extended Mode should snap cleanly to visible lengths 1–16.

## Interface Rule

The interface should make the mode clear.

Suggested control:

```text
MODE
[Original] [Clean]
```

Original mode should visually prioritise:

- 16-step layout
- 4-bit duration LEDs
- clock mode
- gate mode
- trim/sweet-spot indication later

Clean mode should visually allow:

- Bank A/B
- Play Range A/B/A+B
- extra per-step controls
- expanded connection system

## Good Enough for v0.1

The first interface mockup should include a visible mode area.

It does not need to implement the mode logic yet.

It only needs to show that the product has two intended behaviours:

- Original Hardware / Trim Mode
- Clean Digital / Extended Mode
