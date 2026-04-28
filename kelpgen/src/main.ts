import "./style.css";
import * as THREE from "three";
import { createGUI } from "./gui/gui";
import { guiParams } from "./gui/guiParams";
import { Kelp } from "./kelp/kelp";
import { KelpSpecies } from "./kelp/kelpSpecies";

import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';

// Initialize GUI
createGUI();

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

// Seafloor
const seafloor = new THREE.Mesh(
  new THREE.CircleGeometry(14, 48),
  new THREE.MeshStandardMaterial({
    color: 0x102c24,
    roughness: 1,
    metalness: 0,
  }),
);
seafloor.rotation.x = -Math.PI / 2;
seafloor.position.y = -1.55;
scene.add(seafloor);

// PLACEHOLDER: Kelp Initialization for DEMO
const kelp = new Kelp(scene, {
  species: guiParams.species as KelpSpecies,
  height: 12,
});
kelp.init();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//temp for demo
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  controls.update(delta);

  kelp.update(delta);

  renderer.render(scene, camera);
}

animate();
