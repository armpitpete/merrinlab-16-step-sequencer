# MerrinLab 16-Step Sequencer — Product Direction v0.1

## Project Summary

MerrinLab 16-Step Sequencer is a software step sequencer with 16 steps and variable step lengths.

## Core Idea

Each step can have:

- pitch value
- gate on/off
- step length

The main feature is that steps do not all need to last the same amount of time.

## First Goal

Build the timing engine before building the full interface.

The first version should prove:

1. the clock runs
2. the sequencer advances through 16 steps
3. each step can have its own length
4. the current step can be displayed
5. the timing remains predictable

## Do Not Build Yet

- Do not build the full visual interface yet.
- Do not add plugin export yet.
- Do not add complex sound generation yet.
- Do not add skins, themes, animations, or faceplate design yet.

## Future Features

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

Build the engine first.

Interface follows behaviour.

Visual design follows the working interface.
