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
   */
  GIANT: "giant",

  /*
    Basic structure:
    One major stipe that end in a pnematocyst with many blades coming off of it
    Built like a fan, brush, etc.

    Generation:
    Use single chain with terminal node for blades and pneumatocyst
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
type KelpMaterialParams = {
  color: THREE.Color;
  subsurfaceStrength: number;
  translucency: number;
  roughness: number;
  specular: number;
  thickness: number;
};

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

  // Material parameters for the shader
  bladeMaterial: KelpMaterialParams;
  stipeMaterial: KelpMaterialParams;
  bulbMaterial: KelpMaterialParams;
}

// Species-specific configurations
export const KelpSpeciesConfig: Record<KelpSpecies, KelpConfig> = {
  // TODO: PLACEHOLDER - adjust to needs later
  [KelpSpecies.GIANT]: {
    segmentCount: 20,
    stiffness: 0.8,
    damping: 0.2,
    buoyancy: 1.0,

    // Multibranch L-system generation
    // TODO: EDIT, placeholder for demo
    axiom: "F",
    rules: {
      "F": "F[+F]F[-F]F"
    },
    iterations: 4,

    // Deep green, thin blades, translucent, small specular highlights
    bladeMaterial: {
      color: new THREE.Color(0x228B22),
      subsurfaceStrength: 0.5,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    },
    stipeMaterial: {
      color: new THREE.Color(0x228B22),
      subsurfaceStrength: 0.5,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    },
    bulbMaterial: {
      color: new THREE.Color(0x228B22),
      subsurfaceStrength: 0.5,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    }

  },
  [KelpSpecies.BULL]: {
    segmentCount: 15,
    stiffness: 0.6,
    damping: 0.3,
    buoyancy: 0.8,

    // Single chain with terminal nodes for blades and pneumatocysts
    axiom: "F",
    rules: {
      "F": "F[+F]F[-F]F"
    },
    iterations: 3,

    // Olive/brown, smooth rubbery, glossy blub, translucent blades
    bladeMaterial: {
      color: new THREE.Color(0x228B22),
      subsurfaceStrength: 0.5,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    },
    stipeMaterial: {
      color: new THREE.Color(0x8B4513),
      subsurfaceStrength: 0.2,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    },
    bulbMaterial: {
      color: new THREE.Color(0x228B22),
      subsurfaceStrength: 0.5,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    }
  },
  [KelpSpecies.GOLDEN]: {
    segmentCount: 25,
    stiffness: 0.9,
    damping: 0.1,
    buoyancy: 1.2,

    // TODO: PLACEHOLDER - adjust to needs later
    // Multibranch L-system generation with more iterations for denser canopy
    axiom: "F",
    rules: {
      "F": "F[+F]F[-F]F"
    },
    iterations: 5,

    // Golden/yellow, waxy, glossy blades with strong subsurface scattering
    bladeMaterial: {
      color: new THREE.Color(0xFFD700),
      subsurfaceStrength: 0.8,
      translucency: 0.6,
      roughness: 0.2,
      specular: 0.5,
      thickness: 0.2
    },
    stipeMaterial: {
      color: new THREE.Color(0x8B4513),
      subsurfaceStrength: 0.2,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    },
    bulbMaterial: {
      color: new THREE.Color(0x228B22),
      subsurfaceStrength: 0.5,
      translucency: 0.8,
      roughness: 0.3,
      specular: 0.5,
      thickness: 0.1
    }
  },
};

