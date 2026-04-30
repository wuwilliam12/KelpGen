import GUI, { Controller } from "lil-gui";
import { guiParams } from "./guiParams";

export function createGUI() {
  const gui = new GUI();
  const controllers: Controller[] = [];

  // Species selection
  const demoFolder = gui.addFolder("Demo");
  const speciesController = demoFolder.add(guiParams, "species").name("species").options({
    giant: "giant",
    bull: "bull",
    golden: "golden",
  });
  controllers.push(speciesController);

  // Generation parameters
  const generationFolder = gui.addFolder("Generation");
  controllers.push(
    generationFolder.add(guiParams, "height", 4, 30, 0.5).name("height"),
    generationFolder.add(guiParams, "segments", 5, 50, 1),
    generationFolder.add(guiParams, "waveStrength", 0, 2, 0.1).name("ambient sway"),
  );

  // Physics parameters
  const physicsFolder = gui.addFolder("Physics");
  controllers.push(
    physicsFolder.add(guiParams, "stiffness", 0, 1, 0.1),
    physicsFolder.add(guiParams, "damping", 0, 1, 0.1),
    physicsFolder.add(guiParams, "buoyancy", 0, 2, 0.1),
  );

  return { gui, speciesController, controllers };
}
