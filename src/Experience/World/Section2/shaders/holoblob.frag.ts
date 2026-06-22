// Holographic blob fragment shader — iridescent liquid effect
export default `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;

uniform float time;
uniform float uOpacity;

// Hash for pseudo-random UV noise (simulates liquid blob tex)
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
          dot(p, vec3(269.5, 183.3, 246.1)),
          dot(p, vec3(10.4, 234.3, 321.5)));
  return -1.0 + 2.0 * fract(sin(p) * vec3(1.0, 1.0, 1.0) * 43758.5453);
}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vViewDir);

  // Fresnel
  float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0);

  // Iridescent shift based on view angle + time
  float theta = atan(v.x, v.z);
  float h = fract(fresnel + theta * 0.15 + time * 0.05);

  // RGB spectrum
  vec3 iri = vec3(
    0.5 + 0.5 * cos(6.2832 * (h + 0.0)),
    0.5 + 0.5 * cos(6.2832 * (h + 0.333)),
    0.5 + 0.5 * cos(6.2832 * (h + 0.667))
  );

  // Light specular
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
  vec3 halfDir = normalize(lightDir + v);
  float spec = pow(max(dot(n, halfDir), 0.0), 128.0);

  // Base = mostly white/translucid with iridescence
  vec3 col = mix(vec3(0.95), iri, 0.5 + fresnel * 0.5);
  col += vec3(1.0) * spec * 0.6;

  // Rim glow
  col = mix(col, iri, fresnel * 0.6);

  gl_FragColor = vec4(col, uOpacity * (0.5 + fresnel * 0.5));
}
`;
