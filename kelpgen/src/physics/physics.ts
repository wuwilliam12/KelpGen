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

  // Apply forces to the physics nodes
  private applyForces(deltaTime: number) {
    const dt = Math.min(deltaTime, 1 / 30);
    const dampingFactor = THREE.MathUtils.clamp(1 - this.config.damping * dt * 6, 0.82, 0.999);

    for (let i = 1; i < this.nodes.length; i += 1) {
      const node = this.nodes[i];
      const velocity = node.current.clone().sub(node.previous).multiplyScalar(dampingFactor);
      const heightFactor = i / Math.max(this.nodes.length - 1, 1);

      const sway = new THREE.Vector3(
        Math.sin(this.simulationTime * 1.2 + heightFactor * 2.4) * 0.12,
        0,
        Math.cos(this.simulationTime * 0.9 + heightFactor * 1.7) * 0.08,
      ).multiplyScalar(this.config.buoyancy * (0.35 + heightFactor * 0.65));

      const buoyancy = new THREE.Vector3(0, this.config.buoyancy * 0.015, 0);

      node.previous.copy(node.current);
      node.current.add(velocity).add(sway.multiplyScalar(dt)).add(buoyancy.multiplyScalar(dt));
    }
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
  }
}
