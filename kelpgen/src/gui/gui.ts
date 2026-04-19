import GUI from "lil-gui";
import { guiParams } from "./guiParams";

// TODO: Using lil-gui for now, switch when have time later
export function createGUI() {
  const gui = new GUI();

  // Species selection
  const speciesFolder = gui.addFolder("Species");
  speciesFolder.add(guiParams, "species", ["giant", "standard", "small"]);

  // Generation parameters
  const generationFolder = gui.addFolder("Generation");
  generationFolder.add(guiParams, "segments", 5, 50, 1);
  generationFolder.add(guiParams, "branchChance", 0, 1, 0.1);

  // Physics parameters
  const physicsFolder = gui.addFolder("Physics");
  physicsFolder.add(guiParams, "stiffness", 0, 1, 0.1);
  physicsFolder.add(guiParams, "damping", 0, 1, 0.1);

  return gui;
}