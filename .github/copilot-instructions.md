# Copilot Instructions — MerrinLab 16-Step Sequencer

## Project Rule

Work in small, contained edits.

This project is currently engine-first. Do not build the full visual interface before the timing engine works.

## Current Project Focus

The first working behaviour is a minimal timing engine trace.

The engine should prove:

- 16 steps exist
- the clock runs
- the current step advances in order
- each step can have its own length in clock pulses
- the trace shows the current clock tick, current step, and pulse position
- Step 16 loops back to Step 1

## Do Not Add Unless the Issue Explicitly Requests It

Do not add:

- full graphical interface
- audio engine
- MIDI input
- MIDI output
- plugin export
- skins or themes
- animation
- preset system
- probability
- ratcheting
- swing
- scale quantizing
- pattern chaining

These can be added later after the timing engine is proven.

## Development Style

Prefer simple, readable code.

Prefer obvious names over clever names.

Keep the first implementation easy to inspect in a terminal or console.

Avoid large rewrites unless the issue asks for them.

Do not change unrelated files.

## Documentation Rules

Keep docs clear and practical.

Use plain language.

Explain what the code does and how to run it.

Do not write long theory notes unless requested.

## Report Format After Each Change

After completing a task, report:

- files changed
- what changed
- how to run or inspect it
- tests or checks run
- any risks or limits

## Good Enough Rule

A change is good enough when it satisfies the issue without adding extra features.

Do not polish early.

Do not expand the scope.
