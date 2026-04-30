import * as THREE from "three";

type OceanShaderMaterial = THREE.ShaderMaterial & {
  userData: {
    oceanShader?: boolean;
  } & Record<string, unknown>;
};

const sharedEnvironmentVertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;


const flatColorFragmentShader = `
  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

function createOceanMaterial(
  fragmentShader: string,
  uniforms: Record<string, { value: unknown }>,
  side: THREE.Side = THREE.FrontSide,
  depthWrite = true,
) {
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: sharedEnvironmentVertexShader,
    fragmentShader,
    side,
    depthWrite,
  }) as OceanShaderMaterial;

  material.userData.oceanShader = true;
  return material;
}

export function createSeafloorMesh() {
  const material = createOceanMaterial(
    flatColorFragmentShader,
    {
      uColor: { value: new THREE.Color(0x1a4338) },
    },
  );

  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(14, 48),
    material,
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -1.55;

  return mesh;
}

export function createOceanBackdrop() {
  const material = createOceanMaterial(
    flatColorFragmentShader,
    {
      uColor: { value: new THREE.Color(0x12465d) },
    },
    THREE.BackSide,
    false,
  );

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(42, 32, 24),
    material,
  );

  return mesh;
}

export function updateOceanShader(object: THREE.Object3D, elapsedTime: number) {
  void object;
  void elapsedTime;
}
