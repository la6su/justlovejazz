// Fragment shader for text reveal effect
export default `
uniform float uProgress;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
    // Bottom-to-top reveal: y=0 is bottom, y=1 is top
    // Calculate how far we are from the bottom (inverted because UV y goes bottom→top)
    float reveal = 1.0 - vUv.y;

    // Discard fragments above the reveal line
    if (reveal > uProgress) discard;

    // Apply color to visible text
    gl_FragColor = vec4(uColor, 1.0);
}
`
