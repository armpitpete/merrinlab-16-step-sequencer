# Classic Faceplate Spec v0.1

## Purpose

The Classic faceplate is the faithful original-style version.

It should follow the Ray-style 16-step quantized sequencer panel structure as closely as possible.

The Classic version is not the expanded MerrinLab digital version.

## Core Rule

Classic / Original = faithful Ray-style 16-step sequencer panel.

Classic is 16-step only.

Classic must preserve the original panel logic, layout hierarchy, and control families.

## Included Controls and Sections

The Classic faceplate must include these original-style sections:

- Active Step row
- Gate At Step Selection row
- Coarse Voltage Adjustment row
- Fine Voltage Adjustment row
- Step Duration Adjustment row
- Step Duration LED matrix section
- 8 / 4 / 2 / 1 duration labelling
- Master Clock Rate
- Clock Source
- Clock Out
- External Clock In
- Sequencer Mode
- Action At Step
- Action Step
- Trigger Out
- Gate Out
- Multi-Gate / Trigger control
- Control Voltage Out
- Portamento

## Per-Step Classic Layout

Each of the 16 steps should use the original-style step structure:

```text
Step number
Active Step indicator
Gate At Step Selection control
Coarse Voltage Adjustment
Fine Voltage Adjustment
Step Duration Adjustment
```

Do not replace this with the Digital version's simplified Pitch / Length / Gate / M-S-A-G layout.

## Step Duration LED Matrix

The Classic faceplate must include the original Step Duration LED matrix section.

Do not replace the Classic Step Duration section with only a simple 4-LED display.

The 4-bit labels and the LED matrix are part of the Classic panel identity:

```text
8 4 2 1
+ original-style LED matrix block
```

The LED matrix should be treated as a required visual and behavioural concept for the Classic panel.

## Excluded Controls

The Classic version must not include:

- Bank A / Bank B
- Edit Bank A / B
- Play Range A / B / A+B
- 32-step mode
- Mute / Skip / Accent / Glide additions
- modern digital-only workflow controls
- expanded software connection system beyond the original-style panel concept

## Layout Rules

The Classic faceplate should look like a dense analogue sequencer panel.

The main 16-step area should remain the dominant visual structure.

The lower utility/control area should follow the original-style grouping, not the modern Digital layout.

The Classic panel may be redrawn cleanly, but it should not be modernised into a different instrument.

## Do Not Change Without a New Issue

Do not remove the Step Duration LED matrix.

Do not add 32-step banking.

Do not add Digital Clean-mode controls.

Do not replace Coarse/Fine Voltage rows with a single Pitch row.

Do not replace the original Step Duration section with only four LEDs.

Do not make this panel behave like the Digital version.
