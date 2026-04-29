# Kelp Forest Project Report

**Author:** William Wu
**Date:** 4/30/2026

## Background

- This project focuses on procedurally generating and animating kelp in an underwater environment.
- Kelp forests are a good graphics subject because they combine:
  procedural plant structure, continuous motion, buoyancy, and visual material effects.
- The main generation method is an L-system style approach:
  a simple starting string is expanded with rewrite rules, then interpreted as kelp structure.
- This makes it possible to define different species through different:
  growth rules, branching patterns, segment counts, and frond dimensions.
- Motion is important because kelp behaves differently from trees:
  it is shaped by water movement, buoyancy, and drag rather than gravity alone.
- To model that behavior, the project uses:
  Verlet integration and position-based constraints for spring-like motion.
- Visual appearance also matters because kelp blades are thin and somewhat translucent, while stipes and bulbs are thicker.
- Because of that, the project includes species-specific material settings and basic underwater scene lighting.

## What I Accomplished

- Built an interactive WebGL kelp demo in TypeScript using Three.js.
- Created an underwater scene with:
  lighting, fog, a seafloor, and first-person camera controls.
- Implemented a procedural kelp generation pipeline using:
  an L-system string generator plus a structure interpreter.
- Generated kelp structure into:
  stipe segments, fronds, bulbs, and a holdfast.
- Added support for multiple species:
  Giant Kelp, Bull Kelp, and Golden Kelp.
- Defined species-specific parameters for:
  growth rules, turn angles, segment counts, frond dimensions, materials, stiffness, damping, buoyancy, and wave strength.
- Implemented physics-inspired motion using:
  Verlet integration and position-based constraints.
- Simulated moving blade chains separately from the main stem so fronds feel more flexible.
- Added wave-driven sway over time while preserving overall structure.
- Implemented blade collision constraints for:
  self-collision within a blade chain and collisions between blade chains.
- Built geometry and materials for:
  stipes, blades, bulbs, and the holdfast.
- Added a live GUI for changing:
  species, segment count, ambient sway, stiffness, and damping.
- Current progress already achieves:
  procedural generation, animated motion, multiple species support, and interactive parameter control.
- Still incomplete from the original proposal:
  mouse dragging and collision interaction, plus more advanced underwater shader effects.

## Artifacts Produced

- Runnable WebGL application built with TypeScript and Three.js
- Source code for:
  procedural generation, L-system logic, structure interpretation, physics simulation, and GUI controls
- Species configuration data for:
  Giant Kelp, Bull Kelp, and Golden Kelp

Main implementation files:
- `kelpgen/src/kelp/LSystem.ts` - rule-based procedural string generation
- `kelpgen/src/kelp/kelpStructure.ts` - interprets the generated string into kelp structure data
- `kelpgen/src/kelp/kelpSpecies.ts` - species-specific growth, material, and physics parameters
- `kelpgen/src/physics/physics.ts` - Verlet-style motion, constraints, and blade collisions
- `kelpgen/src/gui/gui.ts` - interactive parameter controls
- `kelpgen/src/main.ts` - scene setup, rendering, lighting, and app integration

## References

- Position Based Dynamics: https://matthias-research.github.io/pages/publications/posBasedDyn.pdf
- Advanced Character Physics: https://www.cs.cmu.edu/afs/cs/academic/class/15462-s13/www/lec_slides/Jakobsen.pdf
- Interactive Modeling of Plants: https://graphics.uni-konstanz.de/publikationen/Lintermann1999InteractiveModelingPlants/Lintermann1999InteractiveModelingPlants.pdf
- The Algorithmic Beauty of Plants: https://algorithmicbotany.org/papers/abop/abop.pdf
