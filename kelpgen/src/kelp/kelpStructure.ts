import * as THREE from "three";
import { Kelp } from "./kelp";
import { LSystem } from "./LSystem";
import { type KelpConfig } from "./kelpSpecies";

// Interface for individual stipe segments
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

type FrondShape = KelpFrond;

// For tracking turtle state in L-system interpretation
// Turtle = current frame of ref
type TurtleState = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  lastFrondDirection?: THREE.Vector3;
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

  private getConfig() {
    return this.kelp.getConfig();
  }

  private getCanopyFactor(position: THREE.Vector3) {
    return THREE.MathUtils.clamp(position.y / this.kelp.getHeight(), 0, 1);
  }

  private getRangeValue(
    range: KelpConfig["structure"]["frond"]["bladeLength"],
    factor: number,
  ) {
    return THREE.MathUtils.lerp(range.min, range.max, factor);
  }

  // Generates the holdfast structure at the base of the kelp
  private createHoldfast() {
    const { holdfast } = this.getConfig().structure;
    this.holdfastRadius = Math.max(holdfast.minRadius, this.kelp.getHeight() * holdfast.heightFactor);
  }

  // Generates the stipe structure (stem/branch)
  private createStipe(start: THREE.Vector3, end: THREE.Vector3, radius: number) {
    this.stipeSegments.push({
      start: start.clone(),
      end: end.clone(),
      radius,
    });
  }

  private createFrondShape(origin: THREE.Vector3, direction: THREE.Vector3, shape: FrondShape) {
    this.fronds.push({
      origin: origin.clone(),
      direction: direction.clone().normalize(),
      stipeLength: shape.stipeLength,
      stipeRadius: shape.stipeRadius,
      bladeLength: shape.bladeLength,
      bladeWidth: shape.bladeWidth,
      bulbRadius: shape.bulbRadius,
    });
  }

  private tryAttachBulbToExistingFrond(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    bulbRadius: number,
  ) {
    const normalizedDirection = direction.clone().normalize();

    for (let i = this.fronds.length - 1; i >= 0; i -= 1) {
      const frond = this.fronds[i];
      const sameOrigin = frond.origin.distanceToSquared(origin) < 1e-6;
      const sameDirection = frond.direction.dot(normalizedDirection) > 0.999;

      if (sameOrigin && sameDirection && frond.bladeLength > 0) {
        frond.bulbRadius = Math.max(frond.bulbRadius, bulbRadius);
        return true;
      }

      if (sameOrigin) {
        break;
      }
    }

    return false;
  }

  private getFrondShape(canopyFactor: number, includeBlade = true, includeBulb = true): FrondShape {
    const { frond } = this.getConfig().structure;
    return {
      origin: new THREE.Vector3(),
      direction: new THREE.Vector3(0, 1, 0),
      stipeLength: this.getRangeValue(frond.stipeLength, canopyFactor),
      stipeRadius: this.getRangeValue(frond.stipeRadius, canopyFactor),
      bladeLength: includeBlade ? this.getRangeValue(frond.bladeLength, canopyFactor) : 0,
      bladeWidth: includeBlade ? this.getRangeValue(frond.bladeWidth, canopyFactor) : 0,
      bulbRadius: includeBulb ? this.getRangeValue(frond.bulbRadius, canopyFactor) : 0,
    };
  }

  private rotateDirection(direction: THREE.Vector3, angle: number) {
    return direction.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), angle).normalize();
  }

  private interpretLSystemString() {
    const config = this.getConfig();
    const segmentLength = this.kelp.getHeight() / config.growth.segmentCount;
    const { turnAngle, stipe, symbols } = config.structure;
    const stack: TurtleState[] = [];
    const stipeSymbols = new Set(symbols.stipe);
    const frondSymbols = new Set(symbols.frond);
    const bulbSymbols = new Set(symbols.bulb);
    let frondDirectionSign = 1;

    // Initial turtle state at base of kelp
    let state: TurtleState = {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      lastFrondDirection: undefined,
    };

    for (const char of this.lSystem.getGeneratedString()) {
      if (stipeSymbols.has(char)) {
        const start = state.position.clone();
        const end = start.clone().add(state.direction.clone().multiplyScalar(segmentLength));
        const canopyFactor = this.getCanopyFactor(end);
        const radius = THREE.MathUtils.lerp(stipe.baseRadius, stipe.tipRadius, canopyFactor);
        this.createStipe(start, end, radius);
        state = {
          position: end,
          direction: state.direction,
          lastFrondDirection: undefined,
        };
        continue;
      }

      if (frondSymbols.has(char)) {
        const canopyFactor = this.getCanopyFactor(state.position);
        const directionOffsetAngle = config.structure.frond.directionOffsetAngle ?? 0;
        const useAlternateDirection = config.structure.frond.alternateDirection ?? false;
        const frondDirection = this.rotateDirection(
          state.direction,
          directionOffsetAngle * (useAlternateDirection ? frondDirectionSign : 1),
        );

        this.createFrondShape(state.position, frondDirection, this.getFrondShape(canopyFactor));
        frondDirectionSign *= -1;
        state = {
          ...state,
          lastFrondDirection: frondDirection,
        };
        continue;
      }

      if (bulbSymbols.has(char)) {
        const canopyFactor = this.getCanopyFactor(state.position);
        const bulbShape = this.getFrondShape(canopyFactor, false, true);
        const bulbDirection = state.lastFrondDirection ?? state.direction;
        const attached = this.tryAttachBulbToExistingFrond(
          state.position,
          bulbDirection,
          bulbShape.bulbRadius,
        );

        if (!attached) {
          this.createFrondShape(state.position, bulbDirection, bulbShape);
        }
        continue;
      }

      // Check for terminal symbol to create canopy fronds (for bull kelp mostly)
      const terminal = symbols.terminal?.[char];
      if (terminal) {
        const canopyFactor = this.getCanopyFactor(state.position);
        const frondShape = this.getFrondShape(canopyFactor);
        const angleStep = (Math.PI * 2) / terminal.bladeCount;

        for (let i = 0; i < terminal.bladeCount; i += 1) {
          const angle = i * angleStep;
          const bladeDirection = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
          this.createFrondShape(state.position, bladeDirection, frondShape);
        }
        continue;
      }

      switch (char) {
        case "+": // Rotate direction by turnAngle
          state = {
            position: state.position,
            direction: this.rotateDirection(state.direction, turnAngle),
            lastFrondDirection: state.lastFrondDirection,
          };
          break;
        case "-": // Rotate direction by -turnAngle
          state = {
            position: state.position,
            direction: this.rotateDirection(state.direction, -turnAngle),
            lastFrondDirection: state.lastFrondDirection,
          };
          break;
        case "[": // Push current state to stack
          stack.push({
            position: state.position.clone(),
            direction: state.direction.clone(),
            lastFrondDirection: state.lastFrondDirection?.clone(),
          });
          break;
        case "]": { // Pop state from stack
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
    this.stipeSegments = [];
    this.fronds = [];
    this.createHoldfast();
    this.lSystem.generateString();

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
