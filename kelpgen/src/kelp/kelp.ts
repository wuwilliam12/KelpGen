import * as THREE from "three";
import { KelpSpecies, KelpSpeciesConfig, type KelpConfig } from "./kelpSpecies";
import { KelpStructure } from "./kelpStructure";
import { KelpPhysics } from "../physics/physics";

// Store generation options for a kelp instance
type KelpOptions = {
  species?: KelpSpecies;
  height?: number;
};

type FrondBinding = {
  anchorIndex: number;
  restDirection: THREE.Vector3;
  restStemDirection: THREE.Vector3;

  stipeLength: number;
  stipeRadius: number;
  bladeLength: number;
  bladeWidth: number;
  bulbRadius: number;

  stipeMesh?: THREE.Mesh;
  bulbMesh?: THREE.Mesh;
  bladeMesh?: THREE.Mesh;
  bladeNodes?: any[]; // Physics nodes for blade chain
};

// Wrapper class for instances of generated kelp
export class Kelp {
  // Generation parameters
  private species: KelpSpecies;
  private height: number;
  private config: KelpConfig;

  // Structure data
  private structure: KelpStructure;

  // Three.js data
  private group: THREE.Group;
  private scene: THREE.Scene;
  private stipeMeshes: THREE.Mesh[] = [];

  // Physics data
  private frondBindings: FrondBinding[] = [];
  private physics: KelpPhysics;

  constructor(scene: THREE.Scene, options: KelpOptions = {}) {
    // Giant is default species
    this.species = options.species ?? KelpSpecies.GIANT;

    this.config = KelpSpeciesConfig[this.species];
    this.height = options.height ?? 10;
    this.structure = new KelpStructure(this);
    this.physics = new KelpPhysics(this.config);
    this.group = new THREE.Group();
    this.scene = scene;
  }

  // Initializes kelp instance for drawing
  init() {
    this.generateStructure();
    this.initializePhysics();
    this.createMesh();
    this.scene.add(this.group);
  }

  // Regenerates kelp with new parameters
  regenerate(options: Partial<KelpOptions & { config?: Partial<KelpConfig> }> = {}) {
    // Update species if provided
    if (options.species) {
      this.species = options.species;
    }

    // Update height if provided
    if (options.height !== undefined) {
      this.height = options.height;
    }

    // Update config with provided overrides
    if (options.config) {
      const baseConfig = KelpSpeciesConfig[this.species];
      this.config = {
        ...baseConfig,
        ...options.config,
        growth: { ...baseConfig.growth, ...options.config.growth },
        structure: { ...baseConfig.structure, ...options.config.structure },
      };
    } else {
      this.config = KelpSpeciesConfig[this.species];
    }

    // Clear existing meshes and data
    this.group.clear();
    this.stipeMeshes = [];
    this.frondBindings = [];

    // Regenerate with new parameters
    this.structure = new KelpStructure(this);
    this.physics = new KelpPhysics(this.config);

    this.generateStructure();
    this.initializePhysics();
    this.createMesh();
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

  // Updates the position and orientation of a segment mesh based on new start and end points
  private updateSegmentMesh(mesh: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3) {
    const direction = end.clone().sub(start);
    const length = direction.length();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);

    mesh.position.copy(midpoint);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.scale.set(1, Math.max(length, 0.001) / (mesh.geometry as THREE.CylinderGeometry).parameters.height, 1);
  }

  // init phyics engine with stipe segments as constraints
  private initializePhysics() {
    this.physics.initialize(this.structure.getStipeSegments());
  }

  // Create a leaf-shaped geometry that's tapered at both ends
  private createLeafGeometry(length: number, maxWidth: number, segments: number = 12) {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    // Create vertices along the length, with width tapering at ends
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * length;
      // Use a sine wave for tapering: wider in middle, narrow at ends
      const widthFactor = Math.sin(t * Math.PI);
      const y = maxWidth * widthFactor * 0.5;

      // Bottom vertex
      positions.push(x, -y, 0);
      uvs.push(t, 0);

      // Top vertex
      positions.push(x, y, 0);
      uvs.push(t, 1);
    }

    // Create triangular faces
    for (let i = 0; i < segments; i++) {
      const bottomLeft = i * 2;
      const topLeft = i * 2 + 1;
      const bottomRight = (i + 1) * 2;
      const topRight = (i + 1) * 2 + 1;

      // Two triangles per segment
      indices.push(bottomLeft, topLeft, bottomRight);
      indices.push(topLeft, topRight, bottomRight);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  // create mesh for WebGL
  createMesh() {
    this.group.clear();
    this.stipeMeshes = [];
    this.frondBindings = [];

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
      const mesh = this.createSegmentMesh(segment.start, segment.end, segment.radius, stipeMaterial);
      this.stipeMeshes.push(mesh);
      this.group.add(mesh);
    }

    // Create fronds ( which include stipe, blade, bulb)
    for (const frond of this.structure.getFronds()) {
      const frondDirection = frond.direction.clone().normalize();
      const anchorIndex = this.physics.getNodes().length > 0
        ? this.physics.getClosestNodeIndex(frond.origin)
        : 0;
      const binding: FrondBinding = {
        anchorIndex,
        restDirection: frondDirection.clone(),
        restStemDirection: this.physics.getStemDirectionAt(anchorIndex, true),
        stipeLength: frond.stipeLength,
        stipeRadius: frond.stipeRadius,
        bladeLength: frond.bladeLength,
        bladeWidth: frond.bladeWidth,
        bulbRadius: frond.bulbRadius,
      };

      if (frond.stipeLength > 0 && frond.stipeRadius > 0) {
        binding.stipeMesh = this.createSegmentMesh(
          frond.origin,
          frond.origin.clone().add(frondDirection.clone().multiplyScalar(frond.stipeLength)),
          frond.stipeRadius,
          stipeMaterial,
        );
        this.group.add(binding.stipeMesh);
      }

      if (frond.bulbRadius > 0) {
        binding.bulbMesh = new THREE.Mesh(
          new THREE.SphereGeometry(frond.bulbRadius, 10, 10),
          bulbMaterial,
        );
        this.group.add(binding.bulbMesh);
      }

      if (frond.bladeLength > 0 && frond.bladeWidth > 0) {
        binding.bladeMesh = new THREE.Mesh(
          this.createLeafGeometry(frond.bladeLength * 1.5, frond.bladeWidth),
          bladeMaterial,
        );
        this.group.add(binding.bladeMesh);

        // Create physics chain for the blade with a collision radius based on blade width
        const frondTip = frond.origin.clone().add(frondDirection.clone().multiplyScalar(frond.stipeLength));
        binding.bladeNodes = this.physics.addBladeChain(
          frondTip,
          frondDirection,
          frond.bladeLength * 1.5,
          12,
          Math.max(0.02, frond.bladeWidth * 0.3),
        );
      }

      this.frondBindings.push(binding);
    }

    this.group.position.set(0, -1.5, 0);
    this.refreshFrondMeshes();
  }

  // Update frond meshes based on current physics state
  private refreshFrondMeshes() {
    for (const binding of this.frondBindings) {
      const anchorPosition = this.physics.getNodes()[binding.anchorIndex]?.current ?? new THREE.Vector3();
      const currentStemDirection = this.physics.getStemDirectionAt(binding.anchorIndex);
      const restStemDirection = binding.restStemDirection.lengthSq() > 0
        ? binding.restStemDirection
        : new THREE.Vector3(0, 1, 0);
      const frondDirection = binding.restDirection.clone().applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(restStemDirection, currentStemDirection),
      ).normalize();
      const frondTip = anchorPosition.clone().add(
        frondDirection.clone().multiplyScalar(binding.stipeLength),
      );

      // Anchor blade chain to current frond tip
      if (binding.bladeNodes) {
        binding.bladeNodes[0].current.copy(frondTip);
        binding.bladeNodes[0].previous.copy(frondTip);
      }

      if (binding.stipeMesh) {
        this.updateSegmentMesh(binding.stipeMesh, anchorPosition, frondTip);
      }

      if (binding.bulbMesh) {
        binding.bulbMesh.position.copy(frondTip);
        binding.bulbMesh.scale.set(1, 1.35, 1);
      }

      if (binding.bladeMesh) {
        if (binding.bladeNodes) {
          // Deform blade geometry to follow physics chain
          const geometry = binding.bladeMesh.geometry as THREE.BufferGeometry;
          const positions = geometry.attributes.position.array as Float32Array;
          const segments = 12;
          const maxWidth = binding.bladeWidth;

          for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const chainPos = binding.bladeNodes[i].current;
            const width = maxWidth * Math.sin(t * Math.PI);

            // Positions relative to mesh position (which will be set to first node)
            const relativePos = chainPos.clone().sub(binding.bladeNodes[0].current);

            // Bottom vertex
            positions[i * 6] = relativePos.x;
            positions[i * 6 + 1] = -width * 0.5;
            positions[i * 6 + 2] = relativePos.z;

            // Top vertex
            positions[i * 6 + 3] = relativePos.x;
            positions[i * 6 + 4] = width * 0.5;
            positions[i * 6 + 5] = relativePos.z;
          }

          geometry.attributes.position.needsUpdate = true;
          geometry.computeVertexNormals();

          // Position mesh at first node and orient along chain direction
          binding.bladeMesh.position.copy(binding.bladeNodes[0].current);
          const chainDirection = binding.bladeNodes[binding.bladeNodes.length - 1].current.clone()
            .sub(binding.bladeNodes[0].current).normalize();
          binding.bladeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), chainDirection);
        } else {
          // Fallback to rigid blade
          const bladeMidpoint = frondTip.clone().add(
            frondDirection.clone().multiplyScalar(binding.bladeLength * 0.75),
          );
          binding.bladeMesh.position.copy(bladeMidpoint);
          binding.bladeMesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            frondDirection,
          );
          binding.bladeMesh.rotateZ(Math.PI / 10);
        }
      }
    }
  }

  // update call for animation
  update(deltaTime = 1 / 60) {
    const nodes = this.physics.getNodes();
    if (nodes.length === 0) {
      return;
    }

    this.physics.update(deltaTime);

    for (let i = 0; i < this.stipeMeshes.length; i += 1) {
      this.updateSegmentMesh(
        this.stipeMeshes[i],
        nodes[i].current,
        nodes[i + 1].current,
      );
    }

    this.refreshFrondMeshes();
  }

  /* GETTER FUNCTIONS */

  getConfig() {
    return this.config;
  }

  getHeight() {
    return this.height;
  }
}
