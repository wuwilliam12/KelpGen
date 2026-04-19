import * as THREE from 'three';
import { KelpSpecies, KelpSpeciesConfig, type KelpConfig } from "./kelpSpecies";
import { KelpStructure } from "./kelpStructure";

// TODO: Settings for kelp species

// Wrapper class for instances of generated kelp
export class Kelp {
  // Generation parameters
  private species: KelpSpecies; // kelp species (for different growth patterns)
  private height: number; // height of the kelp
  private config: KelpConfig; // species-specific configuration

  // Structure data
  private structure: KelpStructure; // holds the generated structure of the kelp

  // Three.js
  private geometry: THREE.BufferGeometry;
  private mesh: THREE.Mesh;
  private scene: THREE.Scene;

  // Set up initial parameters and references
  constructor(scene: THREE.Scene, options = { species: KelpSpecies.GIANT, height: 10 }) {
    this.species = options.species || KelpSpecies.GIANT;
    this.config = KelpSpeciesConfig[this.species];
    this.height = options.height || 10;

    this.structure = new KelpStructure(this);

    this.geometry = null as any; // placeholder, generated in createMesh
    this.mesh = null as any;     // placeholder, created in createMesh
    this.scene = scene;
  }

  // Initialize the kelp
  init() {
    this.generateStructure();
    this.createMesh();
    this.scene.add(this.mesh);
  }

  // Generation handler (L-system generation implementation)
  generateStructure() {
    // call the generate function of KelpStructure
    this.structure.generate();
  }

  // create mesh to for WebGL
  createMesh() {

  }

  // apply forces
  applyForces() {

  }

  // verlet integratation
  verletIntegrate() {

  }

  // fix kelp lengths - spring system implementation
  // Posistion-Based Dynamics/Verlet constraint solving
  constrain() {

  }

  // update call for animation
  update() {

  }

  // Getter for kelp config
  getConfig() {
    return this.config;
  }
}