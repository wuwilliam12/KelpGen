import * as THREE from "three";
import { KelpSpecies, KelpSpeciesConfig, type KelpConfig } from "./kelpSpecies";
import { KelpStructure } from "./kelpStructure";

// Store generation options for a kelp instance
type KelpOptions = {
  species?: KelpSpecies;
  height?: number;
};

// Wrapper class for instances of generated kelp
export class Kelp {
  // Generation parameters
  private species: KelpSpecies;
  private height: number;
  private config: KelpConfig;

  // Structure data
  private structure: KelpStructure;

  // Three.js
  private group: THREE.Group;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, options: KelpOptions = {}) {
    // Giant is default species
    this.species = options.species ?? KelpSpecies.GIANT;

    // TODO: Implement other species
    if (this.species !== KelpSpecies.GIANT) {
      throw new Error("The current demo only supports giant kelp.");
    }

    this.config = KelpSpeciesConfig[this.species];
    this.height = options.height ?? 10;
    this.structure = new KelpStructure(this);
    this.group = new THREE.Group();
    this.scene = scene;
  }

  // Initializes kelp instance for drawing
  init() {
    this.generateStructure();
    this.createMesh();
    this.scene.add(this.group);
  }

  // Generation handler (calls L-system generator)
  generateStructure() {
    this.structure.generate();
  }

  private createSegmentMesh(
    start: THREE.Vector3,
    end: THREE.Vector3,
    radius: number,
    material: THREE.Material,
  ) {
    // Create a cylindrical segment between start and end points with the given radius and material
    const direction = end.clone().sub(start);
    const length = direction.length();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const geometry = new THREE.CylinderGeometry(radius * 0.65, radius, length, 10);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

    return mesh;
  }

  // create mesh for WebGL
  createMesh() {
    this.group.clear();

    // convert material parameters to Three.js materials
    const stipeMaterial = new THREE.MeshStandardMaterial({
      color: this.config.stipeMaterial.color,
      roughness: this.config.stipeMaterial.roughness,
      metalness: 0,
    });
    const bladeMaterial = new THREE.MeshStandardMaterial({
      color: this.config.bladeMaterial.color,
      roughness: this.config.bladeMaterial.roughness,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const bulbMaterial = new THREE.MeshStandardMaterial({
      color: this.config.bulbMaterial.color,
      roughness: this.config.bulbMaterial.roughness,
      metalness: 0,
    });

    // Create holdfast at base of kelp
    const holdfastGeometry = new THREE.SphereGeometry(this.structure.getHoldfastRadius(), 10, 10);
    const holdfast = new THREE.Mesh(holdfastGeometry, stipeMaterial);
    holdfast.position.set(0, 0, 0);
    holdfast.scale.set(1.25, 0.6, 1.25);
    this.group.add(holdfast);

    // Create stipe segments
    for (const segment of this.structure.getStipeSegments()) {
      this.group.add(
        this.createSegmentMesh(segment.start, segment.end, segment.radius, stipeMaterial),
      );
    }

    // Create fronds ( which include stipe, blade, bulb)
    for (const frond of this.structure.getFronds()) {
      const frondDirection = frond.direction.clone().normalize();
      const frondTip = frond.origin.clone().add(frondDirection.clone().multiplyScalar(frond.stipeLength));
      const frondMidpoint = frond.origin.clone().add(frondTip).multiplyScalar(0.5);

      // Stipe segment for frond
      const stipe = this.createSegmentMesh(
        frond.origin,
        frondTip,
        frond.stipeRadius,
        stipeMaterial,
      );
      this.group.add(stipe);

      // Bulb at tip of frond
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(frond.bulbRadius, 10, 10),
        bulbMaterial,
      );
      bulb.position.copy(frondTip);
      bulb.scale.set(1, 1.35, 1);
      this.group.add(bulb);

      // Blade as a plane geometry, oriented along the frond direction
      const blade = new THREE.Mesh(
        new THREE.PlaneGeometry(frond.bladeWidth, frond.bladeLength, 1, 6),
        bladeMaterial,
      );
      blade.position.copy(
        frondMidpoint.add(frondDirection.clone().multiplyScalar(frond.bladeLength * 0.2)),
      );
      blade.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), frondDirection);
      blade.rotateZ(Math.PI / 10);
      this.group.add(blade);
    }

    this.group.position.set(0, -1.5, 0);
  }

  applyForces() {

  }

  // verlet integration
  verletIntegrate() {

  }

  // fix kelp lengths - spring system implementation
  // Posistion-Based Dynamics/Verlet constraint solving
  constrain() {

  }

  // update call for animation
  update() {
  }

  /* GETTER FUNCTIONS */

  getConfig() {
    return this.config;
  }

  getHeight() {
    return this.height;
  }
}
