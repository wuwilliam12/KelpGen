import { type KelpConfig } from "./kelpSpecies";

export class LSystem {
  private axiom: string;
  private rules: Record<string, string>;
  private iterations: number;

  private generatedString: string = "";

  // Constructor for LSystem, which will hold the rules and axiom for generating the kelp structure
  constructor(config: KelpConfig) {
    this.axiom = config.axiom;
    this.rules = config.rules;
    this.iterations = config.iterations;
  }

  // Generate string from config parameters
  generateString() {
    let current = this.axiom;

    for (let i = 0; i < this.iterations; i += 1) {
      let next = "";

      for (const char of current) {
        next += this.rules[char] ?? char;
      }

      current = next;
    }

    this.generatedString = current;
  }

  // Accessor for the generated string
  getGeneratedString() {
    return this.generatedString;
  }
}
