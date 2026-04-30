import * as THREE from "three";
import type { KelpMaterialParams } from "../../kelp/kelpSpecies";

export type KelpShaderKind = "blade" | "stipe" | "bulb";

type KelpShaderOptions = {
  side?: THREE.Side;
  transparent?: boolean;
};

export type KelpShaderMaterial = THREE.ShaderMaterial & {
  userData: {
    shaderKind?: KelpShaderKind;
    kelpShader?: boolean;
  } & Record<string, unknown>;
};

const kelpVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const kelpFragmentShader = `
  uniform vec3 uBaseColor;
  uniform float uRoughness;
  uniform float uSpecular;
  uniform float uTranslucency;
  uniform float uThickness;
  uniform float uSubsurfaceStrength;
  uniform float uTime;
  uniform vec3 uWaterFogColor;
  uniform vec3 uKeyLightDirection;
  uniform vec3 uKeyLightColor;
  uniform vec3 uFillLightDirection;
  uniform vec3 uFillLightColor;
  uniform float uDepthFogNear;
  uniform float uDepthFogFar;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 keyLightDirection = normalize(uKeyLightDirection);
    vec3 fillLightDirection = normalize(uFillLightDirection);

    float keyDiffuse = max(dot(normal, keyLightDirection), 0.0);
    float fillDiffuse = max(dot(normal, fillLightDirection), 0.0);

    float backLighting = max(dot(-normal, keyLightDirection), 0.0);
    float subsurface = backLighting * uSubsurfaceStrength * (0.45 + 0.55 * uTranslucency);

    vec3 halfVector = normalize(keyLightDirection + viewDirection);
    float specularPower = mix(14.0, 70.0, 1.0 - clamp(uRoughness, 0.0, 1.0));
    float specular = pow(max(dot(normal, halfVector), 0.0), specularPower) * uSpecular;

    float edgeGlow = pow(1.0 - max(dot(normal, viewDirection), 0.0), 2.0);
    float thicknessGlow = edgeGlow * uThickness * uTranslucency;

    float subtlePulse = 0.985 + sin(uTime * 0.65 + vUv.x * 4.2 + vUv.y * 2.1) * 0.015;
    vec3 diffuseLighting = (
      uKeyLightColor * (0.18 + keyDiffuse) +
      uFillLightColor * (0.08 + fillDiffuse * 0.75)
    );

    vec3 color = uBaseColor * diffuseLighting * subtlePulse;
    color += uBaseColor * (subsurface + thicknessGlow * 0.55);
    color += specular * mix(uKeyLightColor, vec3(1.0), 0.2);

    float fogFactor = smoothstep(uDepthFogNear, uDepthFogFar, length(cameraPosition - vWorldPosition));
    color = mix(color, uWaterFogColor, fogFactor * 0.45);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createKelpShaderMaterial(
  params: KelpMaterialParams,
  kind: KelpShaderKind,
  options: KelpShaderOptions = {},
): KelpShaderMaterial {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: params.color.clone() },
      uRoughness: { value: params.roughness },
      uSpecular: { value: params.specular },
      uTranslucency: { value: params.translucency },
      uThickness: { value: params.thickness },
      uSubsurfaceStrength: { value: params.subsurfaceStrength },
      uTime: { value: 0 },
      uWaterFogColor: { value: new THREE.Color(0x03141e) },
      uKeyLightDirection: { value: new THREE.Vector3(0.45, 0.75, 0.35).normalize() },
      uKeyLightColor: { value: new THREE.Color(0xb9efff) },
      uFillLightDirection: { value: new THREE.Vector3(-0.7, 0.35, -0.45).normalize() },
      uFillLightColor: { value: new THREE.Color(0x7bcf8d) },
      uDepthFogNear: { value: 8 },
      uDepthFogFar: { value: 36 },
    },
    vertexShader: kelpVertexShader,
    fragmentShader: kelpFragmentShader,
    side: options.side ?? THREE.FrontSide,
    transparent: options.transparent ?? false,
  }) as KelpShaderMaterial;

  material.userData.kelpShader = true;
  material.userData.shaderKind = kind;

  return material;
}

export function updateKelpShaderMaterial(
  material: THREE.Material,
  simulationTime: number,
) {
  const shaderMaterial = material as KelpShaderMaterial;
  const timeUniform = shaderMaterial.uniforms?.uTime;

  if (shaderMaterial.userData?.kelpShader && timeUniform) {
    timeUniform.value = simulationTime;
  }
}
