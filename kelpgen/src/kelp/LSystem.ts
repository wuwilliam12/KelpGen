import { type KelpConfig } from "./kelpSpecies";

export class LSystem {
  private axiom: string;
  private rules: Record<string, string>
  private iterations: number;

  private generatedString: string = "";

  // Constructor for LSystem, which will hold the rules and axiom for generating the kelp structure
  constructor(config: KelpConfig) {
    this.axiom = config.axiom;
    this.rules = config.rules;
    this.iterations = config.iterations;
  }

  // Generate string
  generateString() {
    // TODO: implement l-system generation
    this.generatedString = this.axiom;
    
  }

  // Accessor for the generated string
  getGeneratedString() {
    return this.generatedString;
  }
}