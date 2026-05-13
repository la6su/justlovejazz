// Vertex shader for text reveal effect (bottom-to-top displacement)
export default `
uniform float uProgress;
uniform float uHeight;

varying vec2 vUv;

void main() {
    vUv = uv;

    vec3 transformedPosition = position;

    // Displace Y position based on reveal progress
    transformedPosition.y -= uHeight * (1.0 - uProgress);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformedPosition, 1.0);
}
`
