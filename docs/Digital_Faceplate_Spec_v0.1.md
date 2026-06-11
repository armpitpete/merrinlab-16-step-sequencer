# Digital Faceplate Spec v0.1

## Purpose

The Digital faceplate is the expanded MerrinLab version.

It should look related to the Classic faceplate, but it is not a strict copy of the Ray-style original panel.

The Digital version exists to support clean software use, 32-step mode, banking, and modern workflow controls.

## Core Rule

Digital / Clean = expanded MerrinLab sequencer with modern additions.

Digital should feel related to the Classic panel, but it may use clearer software-first controls.

## Included Controls and Sections

The Digital faceplate keeps these locked controls:

- 32-step mode
- Bank A / Bank B
- Edit Bank A / B
- Play Range A / B / A+B
- Original / Clean mode awareness if needed
- Current Step display
- Current Bank display
- Status display
- Length Code display
- 16 visible step slots
- Pitch / value per visible step
- Length per visible step
- Gate per visible step
- compact M / S / A / G controls
- Clock controls
- Transport controls
- Gate Mode: Single / Multi
- Direction: Forward / Reverse
- expanded software connection system
- inputs and outputs for connecting MerrinLab synth modules

## Bank and Step Rules

Digital mode uses two 16-step banks:

```text
Bank A = steps 1-16
Bank B = steps 17-32
```

The faceplate shows one bank at a time.

Edit Bank chooses what the user is editing.

Play Range chooses what plays.

```text
Edit Bank: A / B
Play Range: A / B / A+B
```

## Per-Step Digital Layout

Each visible step should show:

```text
Step number
Pitch / value control
Length control
Gate control
M / S / A / G compact controls
Active Step indicator
```

Where:

- M = Mute
- S = Skip
- A = Accent
- G = Glide

Pitch and Length are the main per-step controls.

Gate is secondary.

M / S / A / G are small status controls.

The active step LED is an indicator, not a main control.

## Connection System

The Digital faceplate must keep the software connection system visible.

Inputs:

- Clock In
- Reset In
- Run/Stop In
- Transpose In

Outputs:

- Pitch Out
- Gate Out
- Trigger Out
- Clock Out
- Reset Out
- Step Index Out
- Accent Out

Later versions may add Glide Out or Mute Out only through a new issue.

## Duration Display

Digital can use a cleaner duration display than the Classic panel.

It may show the 4-bit length code:

```text
8 4 2 1
```

Digital does not need to reproduce the full Classic Step Duration LED matrix unless a future issue explicitly asks for it.

## Excluded Controls

The Digital version should not pretend to be the exact original panel.

Do not force it to include:

- Coarse Voltage Adjustment row
- Fine Voltage Adjustment row
- original Step Duration LED matrix
- original lower control layout
- exact Ray-style panel grouping

Those belong to the Classic version.

## Layout Rules

The Digital faceplate should remain readable and usable as software.

The 16 visible step slots should remain central.

The panel should preserve the hardware-inspired look, but not become too crowded.

The expanded controls should not dominate the main Pitch and Length controls.

## Do Not Change Without a New Issue

Do not remove 32-step banking.

Do not merge Edit Bank and Play Range into one control.

Do not remove the visible input/output connection area.

Do not expand to all 32 steps visible at once by default.

Do not add audio, MIDI, plugin export, or timing behaviour as part of faceplate-only work.
