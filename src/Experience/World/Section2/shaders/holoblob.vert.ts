// Holographic blob vertex shader — metaball-like displacement
export default `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;

uniform float time;

void main() {
  vec3 pos = position;

  // Subtle blob wobble via sine displacement
  float wobble = sin(pos.x * 2.0 + time * 0.5) *
                 cos(pos.y * 1.5 + time * 0.3) * 0.05;
  pos += normal * wobble;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  vViewDir = cameraPosition - worldPos.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;
