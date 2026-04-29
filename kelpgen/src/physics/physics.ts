import * as THREE from "three";
import { type KelpConfig } from "../kelp/kelpSpecies";
import { type KelpSegment } from "../kelp/kelpStructure";

// Tracks physic states
type PhysicsNode = {
  current: THREE.Vector3;
  previous: THREE.Vector3;
  rest: THREE.Vector3;
};

// Simple Verlet integration physics + PBD constraints
export class KelpPhysics {
  private config: KelpConfig;
  private nodes: PhysicsNode[] = [];
  private restLengths: number[] = [];
  private bladeChains: PhysicsNode[][] = [];
  private bladeRestLengths: number[][] = [];
  private bladeCollisionRadii: number[] = [];
  private bladePhases: number[] = [];
  private bladeAmplitudes: number[] = [];
  private bladeSpeeds: number[] = [];
  private simulationTime = 0;

  constructor(config: KelpConfig) {
    this.config = config;
  }

  // Initialize physics nodes based on stipe segments
  initialize(stipeSegments: KelpSegment[]) {
    if (stipeSegments.length === 0) {
      this.nodes = [];
      this.restLengths = [];
      return;
    }

    this.nodes = [
      {
        current: stipeSegments[0].start.clone(),
        previous: stipeSegments[0].start.clone(),
        rest: stipeSegments[0].start.clone(),
      },
    ];
    this.restLengths = [];
    this.simulationTime = 0;

    for (const segment of stipeSegments) {
      this.nodes.push({
        current: segment.end.clone(),
        previous: segment.end.clone(),
        rest: segment.end.clone(),
      });
      this.restLengths.push(segment.end.distanceTo(segment.start));
    }
  }

  // Update physics simulation by applying forces and constraints
  update(deltaTime = 1 / 60) {
    if (this.nodes.length === 0) {
      return;
    }

    this.simulationTime += deltaTime;
    this.applyForces(deltaTime);
    this.constrain();
  }

  // Get current physics node states for mesh updates
  getNodes() {
    return this.nodes;
  }

  // Find the closest physics node index to a given target position
  getClosestNodeIndex(target: THREE.Vector3) {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < this.nodes.length; i += 1) {
      const distance = this.nodes[i].rest.distanceToSquared(target);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  // Get the current stem direction at a given node index
  getStemDirectionAt(index: number, useRest = false) {
    const positions = useRest
      ? this.nodes.map((node) => node.rest)
      : this.nodes.map((node) => node.current);

    if (positions.length < 2) {
      return new THREE.Vector3(0, 1, 0);
    }

    const clampedIndex = THREE.MathUtils.clamp(index, 0, positions.length - 1);
    const start = clampedIndex === positions.length - 1 ? positions[clampedIndex - 1] : positions[clampedIndex];
    const end = clampedIndex === positions.length - 1 ? positions[clampedIndex] : positions[clampedIndex + 1];

    return end.clone().sub(start).normalize();
  }

  // Add a blade physics chain starting from a position along a direction
  addBladeChain(startPosition: THREE.Vector3, direction: THREE.Vector3, length: number, segments: number, collisionRadius = 0.1) {
    const chain: PhysicsNode[] = [];
    const restLengths: number[] = [];
    const segmentLength = length / segments;

    for (let i = 0; i <= segments; i++) {
      const position = startPosition.clone().add(direction.clone().multiplyScalar(i * segmentLength));
      chain.push({
        current: position.clone(),
        previous: position.clone(),
        rest: position.clone(),
      });
      if (i > 0) {
        restLengths.push(segmentLength);
      }
    }

    this.bladeChains.push(chain);
    this.bladeRestLengths.push(restLengths);
    this.bladeCollisionRadii.push(collisionRadius);
    this.bladePhases.push(Math.random() * Math.PI * 2);
    this.bladeAmplitudes.push(0.75 + Math.random() * 0.5);
    this.bladeSpeeds.push(0.9 + Math.random() * 0.4);
    return chain;
  }

  // Get all blade chains for mesh updates
  getBladeChains() {
    return this.bladeChains;
  }

  // Apply collision constraints between blade chain nodes so blades do not pass through each other
  private applyBladeCollisions() {
    const clampDistance = 1e-4;

    for (let chainAIndex = 0; chainAIndex < this.bladeChains.length; chainAIndex += 1) {
      const chainA = this.bladeChains[chainAIndex];
      const radiusA = this.bladeCollisionRadii[chainAIndex] ?? 0.1;

      // Self-collision within the same chain
      for (let i = 0; i < chainA.length; i += 1) {
        for (let j = i + 2; j < chainA.length; j += 1) {
          const nodeA = chainA[i];
          const nodeB = chainA[j];
          const delta = nodeB.current.clone().sub(nodeA.current);
          const distance = delta.length();
          const minDistance = radiusA * 2;

          if (distance < minDistance) {
            const correction = delta.clone().normalize().multiplyScalar((minDistance - Math.max(distance, clampDistance)) * 0.5);
            nodeA.current.add(correction.clone().negate());
            nodeB.current.add(correction);
          }
        }
      }

      // Collision against other blade chains
      for (let chainBIndex = chainAIndex + 1; chainBIndex < this.bladeChains.length; chainBIndex += 1) {
        const chainB = this.bladeChains[chainBIndex];
        const radiusB = this.bladeCollisionRadii[chainBIndex] ?? 0.1;

        for (const nodeA of chainA) {
          for (const nodeB of chainB) {
            const delta = nodeB.current.clone().sub(nodeA.current);
            const distance = delta.length();
            const minDistance = radiusA + radiusB;

            if (distance < minDistance) {
              const correction = delta.clone().normalize().multiplyScalar((minDistance - Math.max(distance, clampDistance)) * 0.5);
              nodeA.current.add(correction.clone().negate());
              nodeB.current.add(correction);
            }
          }
        }
      }
    }
  }

  // Apply forces to the physics nodes
  private applyForces(deltaTime: number) {
    const dt = Math.min(deltaTime, 1 / 30);
    const dampingFactor = THREE.MathUtils.clamp(1 - this.config.damping * dt * 6, 0.82, 0.999);

    for (let i = 1; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const velocity = node.current.clone().sub(node.previous).multiplyScalar(dampingFactor);
      const heightFactor = i / Math.max(this.nodes.length - 1, 1);

      const sway = new THREE.Vector3(
        Math.sin(this.simulationTime * 1.2 + heightFactor * 2.4) * 0.05,
        0,
        Math.cos(this.simulationTime * 0.9 + heightFactor * 1.7) * 0.035,
      ).multiplyScalar((0.25 + heightFactor * 0.25) * this.config.waveStrength);

      node.previous.copy(node.current);
      node.current.add(velocity).add(sway.multiplyScalar(dt));
    }

    // Apply forces to blade chains
    for (let chainIndex = 0; chainIndex < this.bladeChains.length; chainIndex += 1) {
      const chain = this.bladeChains[chainIndex];
      const phaseOffset = this.bladePhases[chainIndex] ?? 0;
      const amplitude = this.bladeAmplitudes[chainIndex] ?? 1;
      const speed = this.bladeSpeeds[chainIndex] ?? 1;

      for (let i = 1; i < chain.length; i += 1) {
        const node = chain[i];
        const velocity = node.current.clone().sub(node.previous).multiplyScalar(dampingFactor);
        const chainFactor = i / Math.max(chain.length - 1, 1);
        const branchBias = 1 + (chainIndex % 3) * 0.12;

        // Each blade gets its own phase, amplitude, and speed so motion is less uniform
        const sway = new THREE.Vector3(
          Math.sin(this.simulationTime * 1.4 * speed + chainFactor * 3.2 + phaseOffset) * 0.08,
          Math.sin(this.simulationTime * 0.7 * speed + chainFactor * 1.7 + phaseOffset * 0.4) * 0.025,
          Math.cos(this.simulationTime * 1.05 * speed + chainFactor * 2.8 + phaseOffset * 0.9) * 0.065,
        ).multiplyScalar((0.28 + chainFactor * 0.42) * amplitude * branchBias * this.config.waveStrength);

        node.previous.copy(node.current);
        node.current.add(velocity).add(sway.multiplyScalar(dt));
      }
    }
  }

  // Return the current simulation time for external animation offsets
  getSimulationTime() {
    return this.simulationTime;
  }

  // Constrain nodes based on rest lengths using a simple PBD approach
  private constrain(iterations = 6) {
    if (this.nodes.length === 0) {
      return;
    }

    const root = this.nodes[0];
    root.current.copy(root.rest);
    root.previous.copy(root.rest);

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      this.nodes[0].current.copy(this.nodes[0].rest);

      for (let i = 0; i < this.restLengths.length; i += 1) {
        const parent = this.nodes[i];
        const child = this.nodes[i + 1];
        const delta = child.current.clone().sub(parent.current);
        const distance = Math.max(delta.length(), 1e-5);
        const difference = (distance - this.restLengths[i]) / distance;
        const correction = delta.multiplyScalar(difference * this.config.stiffness);

        if (i === 0) {
          child.current.sub(correction);
        } else {
          parent.current.add(correction.clone().multiplyScalar(0.5));
          child.current.sub(correction.multiplyScalar(0.5));
        }
      }
    }

    // Constrain blade chains
    for (let chainIndex = 0; chainIndex < this.bladeChains.length; chainIndex += 1) {
      const chain = this.bladeChains[chainIndex];
      const restLengths = this.bladeRestLengths[chainIndex];

      for (let iteration = 0; iteration < iterations; iteration += 1) {
        for (let i = 0; i < restLengths.length; i += 1) {
          const parent = chain[i];
          const child = chain[i + 1];
          const delta = child.current.clone().sub(parent.current);
          const distance = Math.max(delta.length(), 1e-5);
          const difference = (distance - restLengths[i]) / distance;
          const correction = delta.multiplyScalar(difference * this.config.stiffness * 0.8); // Slightly less stiff for blades

          parent.current.add(correction.clone().multiplyScalar(0.5));
          child.current.sub(correction.multiplyScalar(0.5));
        }
      }
    }

    this.applyBladeCollisions();
  }
}
