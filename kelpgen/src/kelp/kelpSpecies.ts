import * as THREE from "three";

// Kelp species types for different growth patterns and appearances
export const KelpSpecies = {
  /*
    Basic structure:
    Many stipe that connect to main stipe stem with long blades
    and pnemotocysts (one for each blade).
    Like a tall thin tree with denser canopy at very top.

    Generation:
    Use multibranch L-system with denser canopy at top (more iterations, more branches)

    - Splits into main branches near the base/holdfast, like antlers
    - Main branches are lined with smaller branches with blades and pneumatocysts at the end
    - Smaller branches off the main branches do not branch at all
    - smaller branches can alternate left and right or stays on one side
   */
  GIANT: "giant",

  /*
    Basic structure:
    One major stipe that end in a pnematocyst with many blades coming off of it
    Built like a fan, brush, etc.

    Generation:
    Use single chain with terminal node for blades and pneumatocyst

    - Main stipe grows straight up with no branching
    - At the top, there is a fan of blades with pneumatocyst in the middle
  */
  BULL: "bull",

  /*
    Basic structure:
    Similar to giant kelp but with more stipes and denser canopy, and thicker blades

    Generation:
    Use multibranch L-system with more iterations for denser canopy
   */
  GOLDEN: "golden",
} as const;

// Material parameters for the kelp shader
export type KelpMaterialParams = {
  color: THREE.Color;
  subsurfaceStrength: number;
  translucency: number;
  roughness: number;
  specular: number;
  thickness: number;
};

type Range = {
  min: number;
  max: number;
};

type KelpGrowthConfig = {
  segmentCount: number;
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
};

type KelpStructureConfig = {
  turnAngle: number;
  symbols: {
    stipe: string[];
    frond: string[];
    bulb: string[];
    terminal?: Record<
      string,
      {
        bladeCount: number;
        sharedBulb?: boolean;
      }
    >;
  };
  holdfast: {
    minRadius: number;
    heightFactor: number;
  };
  stipe: {
    baseRadius: number;
    tipRadius: number;
  };
  frond: {
    bladeLength: Range;
    bladeWidth: Range;
    stipeLength: Range;
    stipeRadius: Range;
    bulbRadius: Range;
    directionOffsetAngle?: number;
    alternateDirection?: boolean;
  };
};

// Type for KelpSpecies values
export type KelpSpecies =
  (typeof KelpSpecies)[keyof typeof KelpSpecies];

// Interface for species-specific parameters
export interface KelpConfig {
  // Physical properties of the kelp
  stiffness: number;
  damping: number;
  buoyancy: number;
  waveStrength: number;

  growth: KelpGrowthConfig;
  structure: KelpStructureConfig;

  // Material parameters for the shader
  bladeMaterial: KelpMaterialParams;
  stipeMaterial: KelpMaterialParams;
  bulbMaterial: KelpMaterialParams;
}

// Species-specific configurations
export const KelpSpeciesConfig: Record<KelpSpecies, KelpConfig> = {
  [KelpSpecies.GIANT]: {
    stiffness: 0.8,
    damping: 0.2,
    buoyancy: 1.0,
    waveStrength: 1.0,

    growth: {
      // Single main stipe with lateral branches for more realistic giant kelp structure
      segmentCount: 25,
      axiom: "F",
      rules: {
        "F": "F[+B][-B]F",
        "B": "PB",
      },
      iterations: 6,
    },
    structure: {
      turnAngle: Math.PI / 6, // Smaller angle for more horizontal lateral branches
      symbols: {
        stipe: ["F"],
        frond: ["B"],
        bulb: ["P"],
      },
      holdfast: {
        minRadius: 0.25,
        heightFactor: 0.03,
      },
      stipe: {
        baseRadius: 0.09,
        tipRadius: 0.025,
      },
      frond: {
        bladeLength: { min: 0.8, max: 1.25 },
        bladeWidth: { min: 0.1, max: 0.2 },
        stipeLength: { min: 0.08, max: 0.2 },
        stipeRadius: { min: 0.008, max: 0.014 },
        bulbRadius: { min: 0.03, max: 0.055 },
        directionOffsetAngle: Math.PI / 10,
        alternateDirection: true,
      },
    },

    // Deep green, thin blades, translucent, small specular highlights
    bladeMaterial: {
      color: new THREE.Color(0x1B5E20),
      subsurfaceStrength: 0.6,
      translucency: 0.9,
      roughness: 0.2,
      specular: 0.3,
      thickness: 0.05
    },
    stipeMaterial: {
      color: new THREE.Color(0x0D3B1C),
      subsurfaceStrength: 0.3,
      translucency: 0.6,
      roughness: 0.4,
      specular: 0.2,
      thickness: 0.15
    },
    bulbMaterial: {
      color: new THREE.Color(0x1B5E20),
      subsurfaceStrength: 0.4,
      translucency: 0.7,
      roughness: 0.3,
      specular: 0.2,
      thickness: 0.1
    }

  },
  [KelpSpecies.BULL]: {
    stiffness: 0.6,
    damping: 0.3,
    buoyancy: 0.8,
    waveStrength: 1.0,

    growth: {
      // Single chain with terminal nodes for blades and pneumatocysts
      // One major stipe ending in pneumatocyst with many blades coming off
      // Built like a fan, brush, etc.
      segmentCount: 15,
      axiom: "F[T]",
      rules: {
        "F": "FF",
      },
      iterations: 3,
    },
    structure: {
      turnAngle: Math.PI / 8,
      symbols: {
        stipe: ["F"],
        frond: ["B"],
        bulb: ["P"],
        terminal: {
          T: {
            bladeCount: 40,
            sharedBulb: true,
          },
        },
      },
      holdfast: {
        minRadius: 0.25,
        heightFactor: 0.03,
      },
      stipe: {
        baseRadius: 0.085,
        tipRadius: 0.03,
      },
      frond: {
        bladeLength: { min: 3.0, max: 4.0 },
        bladeWidth: { min: 0.13, max: 0.17 },
        stipeLength: { min: 0.02, max: 0.06 },
        stipeRadius: { min: 0.015, max: 0.03 },
        bulbRadius: { min: 0.05, max: 0.075 },
      },
    },

    // Olive/brown, smooth rubbery, glossy bulb, translucent blades
    bladeMaterial: {
      color: new THREE.Color(0x6B5D4F),
      subsurfaceStrength: 0.4,
      translucency: 0.85,
      roughness: 0.25,
      specular: 0.3,
      thickness: 0.14
    },
    stipeMaterial: {
      color: new THREE.Color(0x5A4A3A),
      subsurfaceStrength: 0.2,
      translucency: 0.5,
      roughness: 0.35,
      specular: 0.2,
      thickness: 0.2
    },
    bulbMaterial: {
      color: new THREE.Color(0x4A4030),
      subsurfaceStrength: 0.3,
      translucency: 0.4,
      roughness: 0.15,
      specular: 0.6,
      thickness: 0.15
    }
  },
  [KelpSpecies.GOLDEN]: {
    stiffness: 0.9,
    damping: 0.1,
    buoyancy: 1.2,
    waveStrength: 1.0,

    growth: {
      // Multibranch L-system generation with more iterations for denser canopy
      // Similar to giant kelp but with more stipes and denser canopy, thicker blades
      segmentCount: 25,
      axiom: "F",
      rules: {
        "F": "F[+B]F[-B]F",
        "B": "B[+B][-B]",
      },
      iterations: 5,
    },
    structure: {
      turnAngle: Math.PI / 7,
      symbols: {
        stipe: ["F"],
        frond: ["B"],
        bulb: [],
      },
      holdfast: {
        minRadius: 0.3,
        heightFactor: 0.035,
      },
      stipe: {
        baseRadius: 0.1,
        tipRadius: 0.03,
      },
      frond: {
        bladeLength: { min: 0.45, max: 0.95 },
        bladeWidth: { min: 0.08, max: 0.2 },
        stipeLength: { min: 0.14, max: 0.34 },
        stipeRadius: { min: 0.015, max: 0.03 },
        bulbRadius: { min: 0, max: 0 },
      },
    },

    // Golden/yellow, waxy, glossy blades with strong subsurface scattering
    bladeMaterial: {
      color: new THREE.Color(0xDAA520),
      subsurfaceStrength: 0.8,
      translucency: 0.7,
      roughness: 0.15,
      specular: 0.6,
      thickness: 0.12
    },
    stipeMaterial: {
      color: new THREE.Color(0xB8860B),
      subsurfaceStrength: 0.5,
      translucency: 0.6,
      roughness: 0.2,
      specular: 0.5,
      thickness: 0.2
    },
    bulbMaterial: {
      color: new THREE.Color(0xCD853F),
      subsurfaceStrength: 0.6,
      translucency: 0.5,
      roughness: 0.12,
      specular: 0.7,
      thickness: 0.15
    }
  },
};
