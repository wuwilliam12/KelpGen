import GUI from "lil-gui";
import { guiParams } from "./guiParams";

export function createGUI() {
  const gui = new GUI();

  // Species selection (disabled for now since only have one species partially implemented)
  const demoFolder = gui.addFolder("Demo");
  const speciesController = demoFolder.add(guiParams, "species").name("species").options({
    giant: "giant",
    bull: "bull",
    golden: "golden",
  });

  // Generation parameters
  const generationFolder = gui.addFolder("Generation");
  generationFolder.add(guiParams, "segments", 5, 50, 1);
  generationFolder.add(guiParams, "waveStrength", 0, 2, 0.1).name("ambient sway");

  // Physics parameters
  const physicsFolder = gui.addFolder("Physics");
  physicsFolder.add(guiParams, "stiffness", 0, 1, 0.1);
  physicsFolder.add(guiParams, "damping", 0, 1, 0.1);

  return { gui, speciesController };
}
