import "./style.css";
import * as THREE from "three";
import { createGUI } from "./gui/gui";
import { guiParams } from "./gui/guiParams";
import { Kelp } from "./kelp/kelp";
import { KelpSpecies, KelpSpeciesConfig } from "./kelp/kelpSpecies";
import {
  createOceanBackdrop,
  createSeafloorMesh,
  updateOceanShader,
} from "./rendering/shaders/oceanShader";

// TEMP REMOVE LATER
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

// Initialize GUI
const { speciesController, controllers } = createGUI();

// Scene + Camera Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03141e);
scene.fog = new THREE.Fog(0x03141e, 14, 42);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(4.8, 6.5, 12);
camera.lookAt(0, 6, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// PLACEHOLDER: Camera controls for now for demo
const controls = new FirstPersonControls(camera, renderer.domElement);

controls.movementSpeed = 5;
controls.lookSpeed = 0.1;

controls.lookVertical = true;

// Lighting
const ambientLight = new THREE.HemisphereLight(0x8bd3ff, 0x03141e, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xb9efff, 1.8);
directionalLight.position.set(6, 10, 8);
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0x7bcf8d, 0.7);
fillLight.position.set(-5, 4, -3);
scene.add(fillLight);

const oceanBackdrop = createOceanBackdrop();
scene.add(oceanBackdrop);

// Seafloor
const seafloor = createSeafloorMesh();
scene.add(seafloor);

// PLACEHOLDER: Kelp Initialization for DEMO
const kelp = new Kelp(scene, {
  species: guiParams.species as KelpSpecies,
  height: guiParams.height,
});
kelp.init();

// Syncs default species values to GUI on load
function syncGUIParamsToSpecies(species: KelpSpecies) {
  const config = KelpSpeciesConfig[species];
  guiParams.stiffness = config.stiffness;
  guiParams.damping = config.damping;
  guiParams.buoyancy = config.buoyancy;
  guiParams.waveStrength = config.waveStrength;
  guiParams.segments = config.growth.segmentCount;
}

syncGUIParamsToSpecies(guiParams.species as KelpSpecies);

// Connect GUI parameters to kelp regeneration
function updateKelpFromGUI() {
  const baseConfig = KelpSpeciesConfig[guiParams.species as KelpSpecies];
  kelp.regenerate({
    species: guiParams.species as KelpSpecies,
    height: guiParams.height,
    config: {
      stiffness: guiParams.stiffness,
      damping: guiParams.damping,
      buoyancy: guiParams.buoyancy,
      waveStrength: guiParams.waveStrength,
      growth: {
        ...baseConfig.growth,
        segmentCount: guiParams.segments,
      }
    }
  });
}

// Set up GUI change listeners
controllers.forEach((controller) => {
  controller.onChange(() => {
    updateKelpFromGUI();
  });
});

// Also specifically listen to species changes
speciesController.onChange(() => {
  syncGUIParamsToSpecies(guiParams.species as KelpSpecies);

  // Update GUI controllers to reflect new values
  controllers.forEach((controller) => {
    controller.updateDisplay();
  });

  updateKelpFromGUI();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//temp for demo
const clock = new THREE.Clock();

// Main animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls with delta time for smooth movement
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();
  controls.update(delta);

  // updates scene
  kelp.update(delta);
  updateOceanShader(oceanBackdrop, elapsedTime);
  updateOceanShader(seafloor, elapsedTime);

  renderer.render(scene, camera);
}

animate();
