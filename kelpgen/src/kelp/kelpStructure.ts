import * as THREE from 'three';
import { KelpSpecies, KelpSpeciesConfig, type KelpConfig } from "./kelpSpecies";
import { Kelp } from './kelp';
import { LSystem } from "./LSystem";

export class KelpStructure {
  private lSystem: LSystem; // L-system instance for generating the structure
  private kelp: Kelp; // Reference to the main Kelp class for accessing scene and other properties

  // Constructor for KelpStructure, which will hold the generated structure of the kelp
  constructor(kelp: Kelp) {
    this.kelp = kelp;
    this.lSystem = new LSystem(this.kelp.getConfig());
  }

  // Generates the holdfast structure at the base of the kelp
  createHoldfast() {

  }

  // Generates the stipe structure (main vertical stem)
  createStipe() {

  }

  // createFrond helper function
  // Generates the stipe of fronds (secondary stems)
  createFrondStipe() {

  }

  // createFrond helper function
  // Generates the pneumatocysts (gas-filled bladders for buoyancy)
  createFrondPneumatocysts() {

  }

  // createFrond helper function
  // Generates the blades (flat leaf-like structures)
  createFrondBlades() {

  }

  // Generates the frond structures (leaf-like extensions)
  createFronds() {
    this.createFrondStipe();
    this.createFrondPneumatocysts();
    this.createFrondBlades();
  }

  // Interprets the generated L-system string to create the 3D structure of the kelp
  private interpretLSystemString() {
    const stack: THREE.Object3D[] = [];
    let currentObject: THREE.Object3D | null = null;

    for (const char of this.lSystem.getGeneratedString()) {
      switch (char) {
        case 'F':
          break;

        
      }
    }
  }

  // Generates the entire kelp structure by combining holdfast, stipe, and fronds
  generate() {
    // Run L-system to generate string/symbol sequence
    this.lSystem.generateString();

    // Create the structures for symbols
    this.interpretLSystemString();
  }
}