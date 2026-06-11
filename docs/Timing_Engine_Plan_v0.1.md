# MerrinLab 16-Step Sequencer — Timing Engine Plan v0.1

## Purpose

This document defines the first real behaviour for the sequencer timing engine.

The first build should prove the sequencer can run a clock, move through 16 steps, give each step its own length, show the current step, and keep timing predictable.

## First Behaviour Target

The first timing engine does not need sound, MIDI, plugin export, or a full interface.

It only needs to show that the sequencer logic works.

## Core Engine Rules

### 1. Clock

The engine must have an internal clock.

The clock should use beats or pulses as its base unit.

For the first version, use a simple fixed tempo.

Suggested default:

- tempo: 120 BPM
- base pulse: 16th note

The clock should produce regular ticks that the sequencer can count.

### 2. Step Advance

The sequencer has 16 steps.

The current step starts at Step 1.

When the required number of clock pulses has passed, the engine advances to the next step.

After Step 16, the engine loops back to Step 1.

### 3. Per-Step Length

Each step has its own length value.

For the first version, each length should be an integer number of clock pulses.

Suggested range:

- minimum: 1 pulse
- maximum: 16 pulses

Example:

- Step 1 length = 4 pulses
- Step 2 length = 2 pulses
- Step 3 length = 1 pulse
- Step 4 length = 8 pulses

This means steps can last different amounts of time while staying locked to the clock grid.

### 4. Current Step Display

The first version must show the current step clearly.

This can be simple text output before a proper interface exists.

Acceptable early display:

```text
Current step: 1
Current step: 2
Current step: 3
```

Better early display:

```text
Step 01 | length 4 | pulse 1/4
Step 01 | length 4 | pulse 2/4
Step 01 | length 4 | pulse 3/4
Step 01 | length 4 | pulse 4/4
Step 02 | length 2 | pulse 1/2
```

### 5. Predictable Timing

The engine should not drift randomly.

For the first test, timing is good enough if:

- clock ticks happen at regular intervals
- the sequencer advances only when the current step length is complete
- step order is stable
- Step 16 loops back to Step 1
- changing one step length does not break the rest of the pattern

## Minimal Data Model

Each step should be represented as a small object or structure.

Suggested fields:

```text
stepNumber
pitchValue
gateOn
lengthPulses
```

For the first timing test, only these fields are required:

```text
stepNumber
lengthPulses
```

## Suggested First Pattern

Use a deliberately uneven pattern so the timing behaviour is obvious.

```text
Step 01 = 4 pulses
Step 02 = 2 pulses
Step 03 = 1 pulse
Step 04 = 1 pulse
Step 05 = 8 pulses
Step 06 = 2 pulses
Step 07 = 2 pulses
Step 08 = 4 pulses
Step 09 = 1 pulse
Step 10 = 1 pulse
Step 11 = 2 pulses
Step 12 = 2 pulses
Step 13 = 4 pulses
Step 14 = 4 pulses
Step 15 = 8 pulses
Step 16 = 1 pulse
```

## First Test Output

The first working engine should be able to print a running trace like this:

```text
Clock tick 001 | Step 01 | pulse 1/4
Clock tick 002 | Step 01 | pulse 2/4
Clock tick 003 | Step 01 | pulse 3/4
Clock tick 004 | Step 01 | pulse 4/4
Clock tick 005 | Step 02 | pulse 1/2
Clock tick 006 | Step 02 | pulse 2/2
Clock tick 007 | Step 03 | pulse 1/1
Clock tick 008 | Step 04 | pulse 1/1
```

This proves that variable step length is working before any interface is built.

## Good Enough for v0.1

The timing engine v0.1 is good enough when:

- it runs without crashing
- it has 16 steps
- each step has a length value
- it advances through the steps in order
- it loops back after Step 16
- it prints or displays the current step
- it prints or displays the current pulse inside the step
- changing step lengths changes the rhythm of step advance

## Not Required Yet

Do not add these in the first timing engine:

- audio output
- MIDI input
- MIDI output
- plugin export
- graphical controls
- preset saving
- probability
- ratcheting
- swing
- pattern chaining
- scale quantizing

These come after the timing engine proves the core behaviour.

## Next Implementation Target

Create a minimal program that runs the timing engine and prints the step trace.

Suggested issue title:

```text
Issue #1 — Build minimal timing engine trace
```
