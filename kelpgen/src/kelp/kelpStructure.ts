import * as THREE from "three";
import { Kelp } from "./kelp";
import { LSystem } from "./LSystem";

/// Interface for individual stipe segments
export interface KelpSegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
}

// Interface for frond data
export interface KelpFrond {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
  stipeLength: number;
  stipeRadius: number;
  bladeLength: number;
  bladeWidth: number;
  bulbRadius: number;
}

// For tracking turtle state in L-system interpretation
type TurtleState = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
};

// Stores the structural data of the kelp (stipe segments, fronds, holdfast)
// and generates it based on the L-system string
export class KelpStructure {
  private lSystem: LSystem; // Reference to LSystem for generating the structure based on the config
  private kelp: Kelp;       // Reference to parent Kelp instance

  private stipeSegments: KelpSegment[] = [];
  private fronds: KelpFrond[] = [];
  private holdfastRadius = 0.35;

  constructor(kelp: Kelp) {
    this.kelp = kelp;
    this.lSystem = new LSystem(this.kelp.getConfig());
  }

  // Generates the holdfast structure at the base of the kelp
  private createHoldfast() {
    this.holdfastRadius = Math.max(0.25, this.kelp.getHeight() * 0.03);
  }

  // Generates the stipe structure (stem/branch)
  private createStipe(start: THREE.Vector3, end: THREE.Vector3, radius: number) {
    this.stipeSegments.push({
      start: start.clone(),
      end: end.clone(),
      radius,
    });
  }

  // Generates the frond structures (leaf-like extensions)
  private createFrond(origin: THREE.Vector3, direction: THREE.Vector3, canopyFactor: number) {
    const normalizedDirection = direction.clone().normalize();
    const frondLength = THREE.MathUtils.lerp(0.7, 1.8, canopyFactor);
    const bladeLength = THREE.MathUtils.lerp(1.2, 2.5, canopyFactor);

    this.fronds.push({
      origin: origin.clone(),
      direction: normalizedDirection,
      stipeLength: frondLength,
      stipeRadius: THREE.MathUtils.lerp(0.02, 0.035, canopyFactor),
      bladeLength,
      bladeWidth: THREE.MathUtils.lerp(0.16, 0.35, canopyFactor),
      bulbRadius: THREE.MathUtils.lerp(0.06, 0.11, canopyFactor),
    });
  }

  private rotateDirection(direction: THREE.Vector3, angle: number) {
    return direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), angle).normalize();
  }

  private interpretLSystemString() {
    const config = this.kelp.getConfig();
    const segmentLength = this.kelp.getHeight() / config.segmentCount;
    const turnAngle = Math.PI / 8;
    const stack: TurtleState[] = [];

    // Initial turtle state at base of kelp
    let state: TurtleState = {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
    };

    // Interpret characters in L-system generated string
    // TODO: EDIT, giant kelp generation not correct right now
    for (const char of this.lSystem.getGeneratedString()) {
      switch (char) {
        // F - create segment in current direction and move forward
        case "F": {
          const start = state.position.clone();
          const end = start.clone().add(state.direction.clone().multiplyScalar(segmentLength));
          const canopyFactor = THREE.MathUtils.clamp(end.y / this.kelp.getHeight(), 0, 1);

          if (stack.length === 0) {
            const radius = THREE.MathUtils.lerp(0.09, 0.025, canopyFactor);
            this.createStipe(start, end, radius);
          } else {
            this.createFrond(start, state.direction, canopyFactor);
          }

          state = {
            position: end,
            direction: state.direction,
          };
          break;
        }
        // + turn right
        case "+":
          state = {
            position: state.position,
            direction: this.rotateDirection(state.direction, turnAngle),
          };
          break;
        // - turn left
        case "-":
          state = {
            position: state.position,
            direction: this.rotateDirection(state.direction, -turnAngle),
          };
          break;
        // [ push state
        case "[":
          stack.push({
            position: state.position.clone(),
            direction: state.direction.clone(),
          });
          break;
        // ] pop state
        case "]": {
          const previous = stack.pop();
          if (previous) {
            state = previous;
          }
          break;
        }
        default:
          break;
      }
    }
  }

  // Generates the entire kelp structure by combining holdfast, stipe, and fronds
  generate() {
    // Run L-system to generate string/symbol sequence
    this.stipeSegments = [];
    this.fronds = [];
    this.createHoldfast();
    this.lSystem.generateString();

    // Create the structures for symbols
    this.interpretLSystemString();
  }

  /* GETTER FUNCTIONS */

  getStipeSegments() {
    return this.stipeSegments;
  }

  getFronds() {
    return this.fronds;
  }

  getHoldfastRadius() {
    return this.holdfastRadius;
  }
}
