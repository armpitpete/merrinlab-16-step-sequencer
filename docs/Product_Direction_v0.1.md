# MerrinLab 16-Step Sequencer — Product Direction v0.1

## Project Summary

MerrinLab 16-Step Sequencer is a software 16-step sequencer with variable step lengths, gate behaviour, clock control, and a performance-led interface.

## Core Idea

Design the instrument from the front panel first.

The interface defines what the player can touch, see, and understand.

The timing engine then follows the agreed control layout.

## Interface-First Rule

This project should start by designing the working interface map before building the engine.

This does not mean building a polished final skin immediately.

It means defining the real controls first:

- 16 pitch/value controls
- 16 step-length controls
- gate on/off controls
- current step indicators
- clock controls
- start/stop/reset controls
- output/status display areas

The first interface can be a wireframe, mock panel, or simple clickable layout.

## First Goal

Create a clear interface map for the 16-step sequencer.

The first version should prove:

1. the player can see all 16 steps
2. pitch/value and step-length are visually paired
3. gate state is visible per step
4. transport controls are obvious
5. clock controls are obvious
6. the current step display has a clear place
7. the layout can guide the timing-engine implementation

## Do Not Build Yet

- Do not build the final polished skin yet.
- Do not add complex audio generation yet.
- Do not add plugin export yet.
- Do not add advanced sequencing features yet.
- Do not overbuild animations or visual effects yet.

## Future Features

- timing engine
- MIDI clock sync
- MIDI note output
- standalone app
- plugin version
- preset saving
- step probability
- ratcheting
- swing
- scale quantizing
- pattern chaining
- performance controls

## Development Rule

Interface map first.

Timing engine follows the agreed controls.

Visual polish follows working behaviour.
