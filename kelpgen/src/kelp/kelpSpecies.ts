// Kelp species types for different growth patterns and appearances
export const KelpSpecies = {
  GIANT: "giant",
  BULL: "bull",
  GOLDEN: "golden",
} as const;

// Type for KelpSpecies values
export type KelpSpecies =
  (typeof KelpSpecies)[keyof typeof KelpSpecies];

// Interface for species-specific parameters
export interface KelpConfig {
  // TODO: PLACEHOLDER - adjust to needs later
  // Generation parameters for the L-system and physical properties of the kelp
  segmentCount: number;
  stiffness: number;
  damping: number;
  buoyancy: number;

  // L-system data/rules
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
}

// Species-specific configurations
export const KelpSpeciesConfig: Record<KelpSpecies, KelpConfig> = {
  // TODO: PLACEHOLDER - adjust to needs later
  [KelpSpecies.GIANT]: {
    segmentCount: 20,
    stiffness: 0.8,
    damping: 0.2,
    buoyancy: 1.0,

    // TODO: PLACEHOLDER - adjust to needs later
    axiom: "F",
    rules: {
      "F": "F[+F]F[-F]F"
    },
    iterations: 4
  },
  [KelpSpecies.BULL]: {
    segmentCount: 15,
    stiffness: 0.6,
    damping: 0.3,
    buoyancy: 0.8,

    // TODO: PLACEHOLDER - adjust to needs later
    axiom: "F",
    rules: {
      "F": "F[+F]F[-F]F"
    },
    iterations: 3

  },
  [KelpSpecies.GOLDEN]: {
    segmentCount: 25,
    stiffness: 0.9,
    damping: 0.1,
    buoyancy: 1.2,

    // TODO: PLACEHOLDER - adjust to needs later

    axiom: "F",
    rules: {
      "F": "F[+F]F[-F]F"
    },
    iterations: 5
  },
};

