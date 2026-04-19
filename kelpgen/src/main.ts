import * as THREE from 'three';
import { createGUI } from "./gui/gui";
import { guiParams } from './gui/guiParams';

// Initialize GUI
createGUI();

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Object (placeholder)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x2e8b57 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Camera position
camera.position.z = 5;

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += guiParams.stiffness * 0.01; // Example usage of GUI parameter
  cube.rotation.y += guiParams.damping * 0.01; // Example usage of GUI parameter

  renderer.render(scene, camera);
}

animate();