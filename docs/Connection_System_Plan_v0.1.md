# MerrinLab 16-Step Sequencer — Connection System Plan v0.1

## Purpose

This project should be able to connect with other MerrinLab / MFOS-inspired software instruments.

The sequencer should not be designed as an isolated app.

It should behave like part of a small modular software synth system.

## Core Rule

Every instrument should have clear inputs and outputs.

The interface should show these connection points from the beginning.

Do not hide the connection system until later.

## First Connection Targets

The 16-step sequencer should eventually connect to:

- MerrinLab Ultimate Synth
- future MFOS-inspired instruments
- standalone software tools
- plugin-host routing later

## Sequencer Outputs

The sequencer should expose these output concepts:

- pitch out
- gate out
- trigger out
- clock out
- reset out
- step index out
- status or activity output

## Sequencer Inputs

The sequencer should accept these input concepts:

- clock in
- reset in
- run or stop input
- transpose input
- pattern select input later
- external sync input later

## Shared Signal Types

Use a small set of common signal types across projects.

Suggested types:

- pitch
- gate
- trigger
- clock
- reset
- modulation
- audio
- status

## Interface Requirement

The first interface mockup should include a visible connection area.

This area should show:

- inputs
- outputs
- labels
- signal type groupings

The connection area can be simple at first.

It does not need working patch cables yet.

## Software Connection Options

Possible connection methods:

### 1. Internal Patch System

Best long-term option if several MerrinLab instruments live inside one app.

This would allow patching the sequencer directly into a synth voice.

Example:

```text
Sequencer pitch out -> Synth pitch in
Sequencer gate out -> Synth gate in
Sequencer clock out -> Delay clock in
```

### 2. MIDI Routing

Useful for standalone apps and plugin hosts.

The sequencer can send MIDI notes, clock, and transport later.

### 3. Plugin Host Routing

Useful if the tools become VST/AU plugins.

The DAW or host handles routing between instruments.

### 4. OSC or Local Message Bus

Useful later for standalone tools talking to each other outside a DAW.

Do not build this first.

## First Build Boundary

For the first interface task, only show the planned connection points.

Do not implement real patching yet.

Do not implement MIDI yet.

Do not implement audio routing yet.

## Good Enough for v0.1

This plan is good enough when future interface work knows that the sequencer needs visible input and output sections.

The interface should make it obvious that this instrument belongs to a connected system.
