uniform sampler2D backbuffer;
uniform vec2 resolution;

uniform sampler2D uSceneTex;
uniform sampler2D uBloomTex;

uniform float time;
uniform float uBloomRenderCount;
uniform vec2 uBloomMipmapResolution;

uniform float uVignet;
uniform float uBrightness;

uniform sampler2D uNoiseTex;
uniform sampler2D uLensDirtTex;

#pragma glslify: random = require( './random.glsl' );

vec2 spriteUVSelector( vec2 uv, vec2 tile, float frames, float time ) {

	float t = floor(frames * mod( time, 1.0 ) );

	uv.x += mod(t, tile.x);
	uv.y -= floor(t / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

vec2 getMipmapUV( vec2 uv, float level ) {

	vec2 ruv = uv;

	float scale = 1.0 / pow( 2.0, level + 1.0 );

	ruv *= scale;
	ruv.y += scale;

	if( level > 0.0 ) {

		ruv.x += 1.0 - ( scale * 2.0 );

	}

	return ruv;

}

vec4 cubic(float v) {
	vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
	vec4 s = n * n * n;
	float x = s.x;
	float y = s.y - 4.0 * s.x;
	float z = s.z - 4.0 * s.y + 6.0 * s.x;
	float w = 6.0 - x - y - z;
	return vec4(x, y, z, w);
}

// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
vec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {
	vec2 invTexSize = 1.0 / textureSize;
	texCoords = texCoords * textureSize - 0.5;
	vec2 fxy = fract(texCoords);
	texCoords -= fxy;
	vec4 xcubic = cubic(fxy.x);
	vec4 ycubic = cubic(fxy.y);
	vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;
	vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
	vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
	offset *= invTexSize.xxyy;
	vec4 sample0 = texture2D(t, offset.xz);
	vec4 sample1 = texture2D(t, offset.yz);
	vec4 sample2 = texture2D(t, offset.xw);
	vec4 sample3 = texture2D(t, offset.yw);
	float sx = s.x / (s.x + s.y);
	float sy = s.z / (s.z + s.w);
	return mix(
	mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

void main(){

	vec2 uv = vUv;
	vec2 cuv = vUv * 2.0 - 1.0;
	float w = max( .0, length( cuv ) ) * 0.02;

	vec3 color = texture2D( uSceneTex, uv ).xyz;

	vec4 lensDirt = texture2D( uLensDirtTex, vUv );

	vec2 mipUV;
	vec3 bloom;
	float bloomWeight;

	#pragma unroll_loop_start
	for ( int i = 0; i < RENDER_COUNT; i ++ ) {

		mipUV = getMipmapUV( uv, float( UNROLLED_LOOP_INDEX ) );
		bloomWeight = float( UNROLLED_LOOP_INDEX ) / float( RENDER_COUNT );

		bloom = textureBicubic( uBloomTex, mipUV, uBloomMipmapResolution ).xyz * uBrightness * bloomWeight;
		color += bloom;
		color += bloom * lensDirt.xyz * bloomWeight;

	}

uniform vec4 SMAA_RT_METRICS;

uniform sampler2D backbuffer;
uniform sampler2D areaTex;
uniform sampler2D searchTex;

vec4 texture2DOffset(sampler2D tex, vec2 uv, vec2 offset) {
    return texture2D(tex, uv + offset * SMAA_RT_METRICS.xy);
}

float SMAASearchLength(sampler2D searchTex, vec2 e, float bias, float scale) {

    e.r = mad(scale, e.r, bias);
    return SMAA_SEARCHTEX_SELECT(texture2D(searchTex, e, 0.0));
}

float SMAASearchXLeft(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    /**
     * @PSEUDO_GATHER4
     * This texcoord has been offset by (-0.25, -0.125) in the vertex shader to
     * sample between edge, thus fetching four edges in a row.
     * Sampling with different offsets in each direction allows to disambiguate
     * which edges are active from the four fetched ones.
     */
    vec2 e = vec2(0.0, 1.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i++) {

        e        = texture2D(edgesTex, texcoord, 0.0).rg;
        texcoord = mad(-vec2(2.0, 0.0), SMAA_RT_METRICS.xy, texcoord);

        if (!(texcoord.x > end && e.g > 0.8281 && e.r == 0.0))
            break;
    }

    float offset = mad(-255.0, SMAASearchLength(searchTex, e, 0.0, 0.5), 3.25);
    return mad(SMAA_RT_METRICS.x, offset, texcoord.x);
}

float SMAASearchXRight(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(0.0, 1.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i++) {

        e        = texture2D(edgesTex, texcoord, 0.0).rg;
        texcoord = mad(vec2(2.0, 0.0), SMAA_RT_METRICS.xy, texcoord);

        if (!(texcoord.x < end && e.g > 0.8281 && e.r == 0.0))
            break;
    }

    float offset = mad(-255.0, SMAASearchLength(searchTex, e, 0.5, 0.5), 3.25);
    return mad(-SMAA_RT_METRICS.x, offset, texcoord.x);
}

float SMAASearchYUp(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(1.0, 0.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i++) {

        e        = texture2D(edgesTex, texcoord, 0.0).rg;
        texcoord = mad(-vec2(0.0, 2.0), SMAA_RT_METRICS.xy, texcoord);

        if (!(texcoord.y > end && e.r > 0.8281 && e.g == 0.0))
            break;
    }

    float offset = mad(-255.0, SMAASearchLength(searchTex, e.gr, 0.0, 0.5), 3.25);
    return mad(SMAA_RT_METRICS.y, offset, texcoord.y);
}

float SMAASearchYDown(sampler2D edgesTex, sampler2D searchTex, vec2 texcoord, float end) {
    vec2 e = vec2(1.0, 0.0);

    for (int i = 0; i < SMAA_MAX_SEARCH_STEPS; i++) {
        e        = texture2D(edgesTex, texcoord, 0.0).rg;
        texcoord = mad(vec2(0.0, 2.0), SMAA_RT_METRICS.xy, texcoord);

        if (!(texcoord.y < end && e.r > 0.8281 && e.g == 0.0))
            break;
    }

    float offset = mad(-255.0, SMAASearchLength(searchTex, e.gr, 0.5, 0.5), 3.25);
    return mad(-SMAA_RT_METRICS.y, offset, texcoord.y);
}

vec2 SMAAArea(sampler2D areaTex, vec2 dist, float e1, float e2, float offset) {
    // Rounding prevents precision errors of bilinear filtering:
    vec2 texcoord = mad(vec2(SMAA_AREATEX_MAX_DISTANCE, SMAA_AREATEX_MAX_DISTANCE), round(4.0 * vec2(e1, e2)), dist);

    // We do a scale and bias for mapping to texel space:
    texcoord = mad(SMAA_AREATEX_PIXEL_SIZE, texcoord, 0.5 * SMAA_AREATEX_PIXEL_SIZE);

    // Move to proper place, according to the subpixel offset:
    texcoord.y = mad(SMAA_AREATEX_SUBTEX_SIZE, offset, texcoord.y);

    // Do it!
    return SMAA_AREATEX_SELECT(texture2D(areaTex, texcoord));
}

vec4 SMAABlendingWeightCalculationPS(vec2 texcoord, vec2 pixcoord, vec4 offset[3], sampler2D edgesTex, sampler2D areaTex, sampler2D searchTex, ivec4 subsampleIndices) { // Just pass zero for SMAA 1x, see @SUBSAMPLE_INDICES.
    vec4 weights = vec4(0.0, 0.0, 0.0, 0.0);
    vec2 e       = texture2D(edgesTex, texcoord).rg;

    if (e.g > 0.0) { // Edge at north

        vec2 d;

        // Find the distance to the left:
        vec3 coords;
        coords.x = SMAASearchXLeft(edgesTex, searchTex, offset[0].xy, offset[2].x);
        coords.y = offset[1].y; // offset[1].y = texcoord.y - 0.25 * SMAA_RT_METRICS.y (@CROSSING_OFFSET)
        d.x      = coords.x;

        // Now fetch the left crossing edges, two at a time using bilinear
        // filtering. Sampling at -0.25 (see @CROSSING_OFFSET) enables to
        // discern what value each edge has:
        float e1 = texture2D(edgesTex, coords.xy, 0.0).r;

        // Find the distance to the right:
        coords.z = SMAASearchXRight(edgesTex, searchTex, offset[0].zw, offset[2].y);
        d.y      = coords.z;

        // We want the distances to be in pixel units (doing this here allow to
        // better interleave arithmetic and memory accesses):
        d = abs(round(mad(SMAA_RT_METRICS.zz, d, -pixcoord.xx)));

        // SMAAArea below needs a sqrt, as the areas texture is compressed
        // quadratically:
        vec2 sqrt_d = sqrt(d);

        // Fetch the right crossing edges:
        float e2 = texture2DOffset(edgesTex, coords.zy, vec2(1, 0)).r;

        // Ok, we know how this pattern looks like, now it is time for getting
        // the actual area:
        weights.rg = SMAAArea(areaTex, sqrt_d, e1, e2, float(subsampleIndices.y));

        // Fix corners:
        // coords.y = texcoord.y;
        // SMAADetectHorizontalCornerPattern(edgesTex, weights.rg, coords.xyzy, d);
    }

    if (e.r > 0.0) { // Edge at west
        vec2 d;

        // Find the distance to the top:
        vec3 coords;
        coords.y = SMAASearchYUp(edgesTex, searchTex, offset[1].xy, offset[2].z);
        coords.x = offset[0].x; // offset[1].x = texcoord.x - 0.25 * SMAA_RT_METRICS.x;
        d.x      = coords.y;

        // Fetch the top crossing edges:
        float e1 = texture2D(edgesTex, coords.xy).g;

        // Find the distance to the bottom:
        coords.z = SMAASearchYDown(edgesTex, searchTex, offset[1].zw, offset[2].w);
        d.y      = coords.z;

        // We want the distances to be in pixel units:
        d = abs(round(mad(SMAA_RT_METRICS.ww, d, -pixcoord.yy)));

        // SMAAArea below needs a sqrt, as the areas texture is compressed
        // quadratically:
        vec2 sqrt_d = sqrt(d);

        // Fetch the bottom crossing edges:
        float e2 = texture2DOffset(edgesTex, coords.xz, vec2(0, 1)).g;

        // Get the area for this direction:
        weights.ba = SMAAArea(areaTex, sqrt_d, e1, e2, float(subsampleIndices.x));
    }

    return weights;
}

void main(void) {
    gl_FragColor = SMAABlendingWeightCalculationPS(vUv, vPixcoord, vOffset, backbuffer, areaTex, searchTex, ivec4(0.0));
}
</document_content>
</document>
<document index="47">
<source>src/ts/MainScene/RenderPipeline/shaders/smaa_blendingWeightCalculation.vs</source>
<document_content>

varying vec2 vUv;
varying vec4 vOffset[3];
varying vec2 vPixcoord;

uniform vec4 SMAA_RT_METRICS;

void SMAABlendingWeightCalculationVS(vec2 texcoord) {
    vPixcoord = texcoord * SMAA_RT_METRICS.zw;

    // We will use these offsets for the searches later on (see @PSEUDO_GATHER4):
    vOffset[0] = mad(SMAA_RT_METRICS.xyxy, vec4(-0.25, -0.125, 1.25, -0.125), texcoord.xyxy);
    vOffset[1] = mad(SMAA_RT_METRICS.xyxy, vec4(-0.125, -0.25, -0.125, 1.25), texcoord.xyxy);

    // And these for the searches, they indicate the ends of the loops:
    vOffset[2] = mad(SMAA_RT_METRICS.xxyy, vec4(-2.0, 2.0, -2.0, 2.0) * float(SMAA_MAX_SEARCH_STEPS), vec4(vOffset[0].xz, vOffset[1].yw));
}

void main(void) {

    vec3 pos = position;

    gl_Position = vec4(position, 1.0);

    SMAABlendingWeightCalculationVS(uv);

    vUv = uv;
}
</document_content>
</document>
<document index="48">
<source>src/ts/MainScene/RenderPipeline/shaders/smaa_edgeDetection.fs</source>
<document_content>

varying vec2 vUv;
varying vec4 vOffset[3];

uniform sampler2D sceneTex;

vec2 SMAAColorEdgeDetectionPS(vec2 texcoord, vec4 offset[3], sampler2D colorTex) {
    // Calculate the threshold:
    vec2 threshold = vec2(SMAA_THRESHOLD, SMAA_THRESHOLD);

    // Calculate color deltas:
    vec4 delta;
    vec3 C = texture2D(colorTex, texcoord).rgb;

    vec3 Cleft = texture2D(colorTex, offset[0].xy).rgb;
    vec3 t     = abs(C - Cleft);
    delta.x    = max(max(t.r, t.g), t.b);

    vec3 Ctop = texture2D(colorTex, offset[0].zw).rgb;
    t         = abs(C - Ctop);
    delta.y   = max(max(t.r, t.g), t.b);

    // We do the usual threshold:
    vec2 edges = step(threshold, delta.xy);

    // Then discard if there is no edge:
    if (dot(edges, vec2(1.0, 1.0)) == 0.0)
        return vec2(0.0);

    // Calculate right and bottom deltas:
    vec3 Cright = texture2D(colorTex, offset[1].xy).rgb;
    t           = abs(C - Cright);
    delta.z     = max(max(t.r, t.g), t.b);

    vec3 Cbottom = texture2D(colorTex, offset[1].zw).rgb;
    t            = abs(C - Cbottom);
    delta.w      = max(max(t.r, t.g), t.b);

    // Calculate the maximum delta in the direct neighborhood:
    vec2 maxDelta = max(delta.xy, delta.zw);

    // Calculate left-left and top-top deltas:
    vec3 Cleftleft = texture2D(colorTex, offset[2].xy).rgb;
    t              = abs(C - Cleftleft);
    delta.z        = max(max(t.r, t.g), t.b);

    vec3 Ctoptop = texture2D(colorTex, offset[2].zw).rgb;
    t            = abs(C - Ctoptop);
    delta.w      = max(max(t.r, t.g), t.b);

    // Calculate the final maximum delta:
    maxDelta         = max(maxDelta.xy, delta.zw);
    float finalDelta = max(maxDelta.x, maxDelta.y);

    // Local contrast adaptation:
    edges.xy *= step(finalDelta, SMAA_LOCAL_CONTRAST_ADAPTATION_FACTOR * delta.xy);

    return edges;
}

void main(void) {
    gl_FragColor = vec4(SMAAColorEdgeDetectionPS(vUv, vOffset, sceneTex), 0.0, 0.0);
}
</document_content>
</document>
<document index="49">
<source>src/ts/MainScene/RenderPipeline/shaders/smaa_edgeDetection.vs</source>
<document_content>

varying vec2 vUv;
varying vec4 vOffset[3];
uniform vec4 SMAA_RT_METRICS;

void SMAAEdgeDetectionVS(vec2 texcoord) {
    vOffset[0] = mad(SMAA_RT_METRICS.xyxy, vec4(-1.0, 0.0, 0.0, -1.0), texcoord.xyxy);
    vOffset[1] = mad(SMAA_RT_METRICS.xyxy, vec4(1.0, 0.0, 0.0, 1.0), texcoord.xyxy);
    vOffset[2] = mad(SMAA_RT_METRICS.xyxy, vec4(-2.0, 0.0, 0.0, -2.0), texcoord.xyxy);
}

void main(void) {

    vec3 pos = position;

    gl_Position = vec4(position, 1.0);

    SMAAEdgeDetectionVS(uv);

    vUv = uv;
}
</document_content>
</document>
<document index="50">
<source>src/ts/MainScene/RenderPipeline/shaders/smaa_neiborhoodBlending.fs</source>
<document_content>

varying vec2 vUv;
varying vec4 vOffset;

uniform sampler2D backbuffer;
uniform sampler2D sceneTex;

uniform vec2 resolution;
uniform vec4 SMAA_RT_METRICS;

void SMAAMovc(vec2 cond, inout vec2 variable, vec2 value) {
    if (cond.x > 0.0)
        variable.x = value.x;
    if (cond.y > 0.0)
        variable.y = value.y;
}

void SMAAMovc(vec4 cond, inout vec4 variable, vec4 value) {
    SMAAMovc(cond.xy, variable.xy, value.xy);
    SMAAMovc(cond.zw, variable.zw, value.zw);
}

vec4 SMAANeighborhoodBlendingPS(vec2 texcoord, vec4 offset, sampler2D colorTex, sampler2D blendTex) {
    // Fetch the blending weights for current pixel:
    vec4 a;
    a.x  = texture2D(blendTex, offset.xy).a; // Right
    a.y  = texture2D(blendTex, offset.zw).g; // Top
    a.wz = texture2D(blendTex, texcoord).xz; // Bottom / Left

    // Is there any blending weight with a value greater than 0.0?
    if (dot(a, vec4(1.0, 1.0, 1.0, 1.0)) < 1e-5) {

        vec4 color = texture2D(colorTex, texcoord);
        return color;

    } else {

        float h = max(a.x, a.z) > max(a.y, a.w) ? 1.0 : 0.0; // max(horizontal) > max(vertical)

        // Calculate the blending offsets:
        vec4 blendingOffset = vec4(0.0, a.y, 0.0, a.w);
        vec2 blendingWeight = a.yw;
        SMAAMovc(vec4(h, h, h, h), blendingOffset, vec4(a.x, 0.0, a.z, 0.0));
        SMAAMovc(vec2(h, h), blendingWeight, a.xz);
        blendingWeight /= dot(blendingWeight, vec2(1.0, 1.0));

        // Calculate the texture coordinates:
        vec4 blendingCoord = mad(blendingOffset, vec4(SMAA_RT_METRICS.xy, -SMAA_RT_METRICS.xy), texcoord.xyxy);

        // We exploit bilinear filtering to mix current pixel with the chosen
        // neighbor:
        vec4 color;
        color += blendingWeight.x * texture2D(colorTex, blendingCoord.xy);
        color += blendingWeight.y * texture2D(colorTex, blendingCoord.zw);

        return color;
    }
}

void main(void) {
    gl_FragColor = SMAANeighborhoodBlendingPS(vUv, vOffset, sceneTex, backbuffer);
}
</document_content>
</document>
<document index="51">
<source>src/ts/MainScene/RenderPipeline/shaders/smaa_neiborhoodBlending.vs</source>
<document_content>
varying vec2 vUv;
varying vec4 vOffset;

uniform sampler2D backbuffer;
uniform vec2 resolution;
uniform vec4 SMAA_RT_METRICS;

void SMAANeighborhoodBlendingVS(vec2 texcoord) {
    vOffset = mad(SMAA_RT_METRICS.xyxy, vec4(1.0, 0.0, 0.0, 1.0), texcoord.xyxy);
}

void main(void) {

    vec3 pos = position;

    gl_Position = vec4(position, 1.0);

    SMAANeighborhoodBlendingVS(uv);

    vUv = uv;
}
</document_content>
</document>
<document index="52">
<source>src/ts/MainScene/Scroll/index.ts</source>
<document_content>
import EventEmitter from 'wolfy87-eventemitter';

export class Scroll extends EventEmitter {

	private elm: HTMLElement;
	private buttonElm: HTMLButtonElement;

	constructor() {

		super();

		this.elm = document.querySelector( '.scroll' )!;

		this.buttonElm = this.elm.querySelector( '.scroll-btn' ) as HTMLButtonElement;

		this.buttonElm.addEventListener( 'click', () => {

			this.emitEvent( 'click' );

		} );

		let fillCircle = this.elm.querySelector( '.scroll-fillCircle' ) as HTMLElement;

		this.buttonElm.addEventListener( 'mousemove', ( e ) => {

			let bound = this.buttonElm.getBoundingClientRect();

			let x = e.clientX - bound.left;
			let y = e.clientY - bound.top;

			fillCircle.style.left = x + 'px';
			fillCircle.style.top = y + 'px';


		} );

	}

	public switchVisible( visible: boolean ) {

		this.elm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

	}

}

</document_content>
</document>
<document index="53">
<source>src/ts/MainScene/Scroller/index.ts</source>
<document_content>
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';

export class Scroller extends EventEmitter {

	private animator: ORE.Animator;

	private sectionNum: number = 0;

	public value: number = 0;
	private velocity: number = 0;
	private velocityVelocity: number = 0;

	private touchStartContent: number | null = null;
	public currentContent: number = 0;
	private gravitiContent: number = 0;

	// wheel

	private wheelTime: number = - 1;
	private wheelDeltaMem: number = 0;

	// touch

	private isTouching: boolean = false;
	private touchStartPos: number = 0;
	public touchMove: number = 0;
	public touchMoveDiff: number = 0;

	constructor() {

		super();

		this.reset();

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = new ORE.Animator();
		this.animator.add( {
			name: 'value',
			initValue: 0,
			easing: ORE.Easings.easeInOutCubic
		} );

	}

	public changeSectionNum( contentNum: number ) {

		this.sectionNum = contentNum;
		this.reset();

		this.emitEvent( 'changeSelectingSection', [ this.gravitiContent ] );

	}

	private reset() {

		this.value = 0;
		this.gravitiContent = 0;
		this.touchStartContent = 0;
		this.velocity = 0;
		this.currentContent = 0;
		this.isTouching = false;
		this.touchStartPos = 0;
		this.touchMove = 0;

	}

	public update( deltaTime: number ) {

		this.animator.update( deltaTime );

		let selectingMem = this.gravitiContent;

		if ( this.animator.isAnimatingVariable( 'value' ) ) {

			// auto

			this.value = this.animator.get<number>( 'value' ) || 0;

			this.gravitiContent = Math.round( this.value );

		} else if ( this.isTouching ) {

			// touch

			this.value = this.touchStartPos + this.touchMove;

		} else {

			// inertia

			if ( this.touchStartContent ) {

				if ( this.gravitiContent == this.touchStartContent ) {

					if ( Math.abs( this.touchMoveDiff ) > 0.05 ) {

						this.gravitiContent += Math.sign( this.touchMoveDiff );
						this.touchMoveDiff = 0.0;

					}

				}

				this.touchStartContent = null;

			} else {

				if ( this.velocity > 0 ) {

					this.gravitiContent = Math.round( this.value + 0.45 );

				} else {

					this.gravitiContent = Math.round( this.value - 0.45 );

				}

			}

			this.gravitiContent = Math.max( 0.0, Math.min( this.sectionNum - 1, this.gravitiContent ) );

			let gravity = this.gravitiContent - this.value;

			this.velocityVelocity += gravity * deltaTime * 0.3;
			this.velocityVelocity *= 0.86 * ( 1.0 - deltaTime * 2.0 );

			this.velocity += this.velocityVelocity * 10.0 * deltaTime;
			this.velocity *= 1.0 - deltaTime * 8.0;

			this.value += this.velocity;

		}

		// calc current content

		let nearest = Math.round( this.value );

		if ( nearest != this.currentContent ) {

			this.currentContent = nearest;

			this.velocityVelocity = 0.0;

			this.emitEvent( 'changeCurrentContent', [ this.currentContent ] );

		}

		if ( this.gravitiContent != selectingMem ) {

			this.emitEvent( 'changeSelectingSection', [ this.gravitiContent ] );

		}

	}

	/*-------------------------------
		Mouse
	-------------------------------*/

	public addVelocity( delta: number ) {

		let now = new Date().getTime();
		let wheelDeltaTime = now - this.wheelTime;

		let wheelDeltaDelta = Math.abs( delta ) - Math.abs( this.wheelDeltaMem );

		this.wheelTime = now;
		this.wheelDeltaMem = delta;

		if ( wheelDeltaTime < 100 && wheelDeltaDelta < 0.0 ) {

			return;

		}

		this.velocityVelocity += delta;

	}

	/*-------------------------------
		Mobile
	-------------------------------*/

	public catch() {

		if ( this.animator.isAnimatingVariable( 'value' ) ) return;

		this.isTouching = true;

		this.touchStartPos = this.value;
		this.touchStartContent = Math.round( this.value );

		this.touchMove = 0;
		this.touchMoveDiff = 0;

	}

	public drag( delta: number ) {

		if ( ! this.isTouching ) return;

		if ( this.animator.isAnimatingVariable( 'value' ) ) return;

		let d = delta * 0.0005;

		this.touchMove -= d;
		this.touchMoveDiff -= d * 5.0;

	}

	public release( delta: number ) {

		if ( this.animator.isAnimatingVariable( 'value' ) ) return;

		if ( ! this.isTouching ) return;

		this.isTouching = false;

		this.velocity -= delta * 0.0005;


	}

	/*-------------------------------
		API
	-------------------------------*/

	public move( value: number, duration: number = 1, onFinished?: () => void ) {

		this.animator.setValue( 'value', this.value );
		this.animator.animate( 'value', value, duration, () => {

			this.velocity = 0;

			if ( onFinished ) {

				onFinished();

			}

		} );

		return false;

	}

}

</document_content>
</document>
<document index="54">
<source>src/ts/MainScene/Subtitle/index.ts</source>
<document_content>
import { NoiseText } from '../NoiseText';

export class Subtitles {

	private elm: HTMLElement;

	private noiseTextList: NoiseText[] = [];

	private textList: string[] = [
		"",
		"理想をトコトン突き詰めるために、いつも柔軟な発想を。",
		"これまでにない提案を実現するために、常に挑戦者であり続けます。",
		"わたしたちは、ものづくりで、多様な感動と成果をも生み出します。"
	];

	constructor( ) {

		this.elm = document.querySelector( '.subtitles' ) as HTMLElement;

	}

	public changeSection( sectionIndex: number ) {

		let text = this.textList[ sectionIndex ] || '';

		this.show( text );

	}

	public show( text: string, duration: number = 1.0, textHideDuration: number = 3.5 ) {

		this.hideAll();

		if ( ! text ) return;

		let textElm = document.createElement( 'p' );
		textElm.classList.add( "subtitles-text" );

		let span = document.createElement( 'span' );
		textElm.appendChild( span );
		this.elm.appendChild( textElm );

		let noiseText = new NoiseText( span );
		noiseText.noise = "このサイト作るの意外と大変なんですよこれが";
		noiseText.show( text, duration, 40 );

		noiseText.onFinishAnimation = () => {

			setTimeout( () => {

				noiseText.hide();

			}, textHideDuration * 1000 );

		};

		noiseText.onFinishHide = () => {

			this.noiseTextList = this.noiseTextList.filter( item => ! item.elm.isEqualNode( noiseText.elm ) );
			noiseText.elm.remove();

		};

		this.noiseTextList.push( noiseText );

	}

	public hideAll() {

		this.noiseTextList.forEach( item => item.hide() );

	}

}

</document_content>
</document>
<document index="55">
<source>src/ts/MainScene/World/BG/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import bgVert from './shaders/bg.vs';
import bgFrag from './shaders/bg.fs';

export class BG extends THREE.Mesh {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.uSection = window.gManager.animator.add( {
			name: 'bgSection',
			initValue: [ 0, 0, 0, 0, 0, 0 ]
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		let geo = new THREE.SphereGeometry( 100.0 );
		geo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( - 0.7, - 0.12, 1.095 ) ) );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: bgVert,
			fragmentShader: bgFrag,
			uniforms: uni,
			side: THREE.BackSide,
		} );

		super( geo, mat );

		this.commonUniforms = uni;
		this.animator = animator;

	}

	public changeSection( sectionIndex: number ) {

		let sec = [ 0, 0, 0, 0, 0, 0 ];

		if ( sectionIndex >= sec.length ) return;

		sec[ sectionIndex ] = 1;

		this.animator.animate( 'bgSection', sec, 1 );

	}

}

</document_content>
</document>
<document index="56">
<source>src/ts/MainScene/World/BG/shaders/bg.fs</source>
<document_content>
uniform vec3 uColor;
uniform float time;
uniform float uSection[6];

varying vec2 vUv;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )
#pragma glslify: random = require('./random.glsl' )
#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

void main( void ) {

	vec3 sec1 = hsv2rgb( vec3( vUv.y * 0.3 + time * 0.1 + random( gl_FragCoord.xy * 0.01 ) * 0.05, 0.5, 1.0  ) );
	vec3 sec2 = vec3( 1.0 );
	vec3 sec3 = vec3( 0.0 );
	vec3 sec4 = vec3( 1.0 );
	vec3 sec5 = vec3( smoothstep( 0.0, 1.0, vUv.y ) * 0.5 ) * 0.3;

	vec3 sec6 = vec3(
		exp( - linearstep( 1.0, 0.5, vUv.y + 0.00) * 10.0 ) * 0.6,
		exp( - linearstep( 1.0, 0.5, vUv.y + 0.015) * 10.0 ) * 0.6,
		exp( - linearstep( 1.0, 0.5, vUv.y + 0.03) * 10.0 ) * 0.6
	);

	sec6 += vec3(
		exp( -linearstep( 1.0, 0.99, vUv.y) * 5.0 )
	);
	sec6 += vec3(
		sin( vUv.y * 15.0 - 1.0 + time ) * 0.1,
		sin( vUv.y * 15.0 - 0.5 + time ) * 0.1,
		sin( vUv.y * 15.0 - 0.0 + time ) * 0.1
	);

	// vec3 sec6 = sec1;

	vec3 color = vec3( 0.0 );
	color = mix( color, sec1, uSection[ 0 ] );
	color = mix( color, sec2, uSection[ 1 ] );
	color = mix( color, sec3, uSection[ 2 ] );
	color = mix( color, sec4, uSection[ 3 ] );
	color = mix( color, sec5, uSection[ 4 ] );
	color = mix( color, sec6, uSection[ 5 ] );

	gl_FragColor = vec4( color, 1.0 );

}
</document_content>
</document>
<document index="57">
<source>src/ts/MainScene/World/BG/shaders/bg.vs</source>
<document_content>
varying vec2 vUv;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="58">
<source>src/ts/MainScene/World/Baku/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { PowerMesh } from 'power-mesh';

import bakuFrag from './shaders/baku.fs';
import bakuVert from './shaders/baku.vs';
import passThroughFrag from './shaders/passThrough.fs';

export type BakuMaterialType = 'normal' | 'glass' | 'line' | 'dark'

export class Baku extends THREE.Object3D {

	// animation

	private animator: ORE.Animator;
	private animationMixer?: THREE.AnimationMixer;
	private currentAnimationSection: string | null = null;
	private animationClipNameList: string[] = [];
	private animationActions: { [name:string]: THREE.AnimationAction} = {};

	// state

	private jumping: boolean = false;

	private manager: THREE.LoadingManager;
	private commonUniforms: ORE.Uniforms;

	private container: THREE.Object3D;
	private mesh?: PowerMesh;
	protected meshLine?: THREE.SkinnedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

	private passThrough?: ORE.PostProcessing;
	public sceneRenderTarget: THREE.WebGLRenderTarget;
	public onLoaded?: () => void;

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms ) {

		super();

		this.manager = manager;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uSceneTex: {
				value: null
			},
			uNoiseTex: window.gManager.assetManager.getTex( 'noise' ),
			winResolution: {
				value: new THREE.Vector2()
			},
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uTransparent = this.animator.add( {
			name: 'bakuTransparent',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic,
			userData: {
				pane: {
					min: 0, max: 1
				}
			}
		} );

		this.commonUniforms.uLine = this.animator.add( {
			name: 'bakuLine',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic,
			userData: {
				pane: {
					min: 0, max: 1
				}
			}
		} );

		this.commonUniforms.uRimLight = this.animator.add( {
			name: 'bakuRimLight',
			initValue: 1,
			easing: ORE.Easings.easeOutCubic,
			userData: {
				pane: {
					min: 0, max: 1
				}
			}
		} );

		this.animator.add( {
			name: 'bakuIntroRotate',
			initValue: 1,
			easing: ORE.Easings.easeOutCubic
		} );

		this.animator.add( {
			name: 'bakuRotateSpeed',
			initValue: 0.0,
		} );

		this.animator.add( {
			name: 'bakuRotateValue',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		/*-------------------------------
			RenderTarget
		-------------------------------*/

		this.sceneRenderTarget = new THREE.WebGLRenderTarget( 1, 1 );

		/*-------------------------------
			container
		-------------------------------*/

		this.container = new THREE.Object3D();
		this.add( this.container );

		/*-------------------------------
			Load
		-------------------------------*/

		let loader = new GLTFLoader( this.manager );

		loader.load( './assets/scene/baku.glb', ( gltf ) => {

			let bakuWrap = gltf.scene.getObjectByName( "baku_amature" ) as THREE.Object3D;

			this.container.add( bakuWrap );

			/*-------------------------------
				MainMesh
			-------------------------------*/

			this.mesh = new PowerMesh( bakuWrap.getObjectByName( 'Baku' ) as THREE.Mesh, {
				fragmentShader: bakuFrag,
				vertexShader: bakuVert,
				uniforms: this.commonUniforms,
			}, true );

			this.mesh.castShadow = true;
			this.mesh.renderOrder = 2;

			this.mesh.onBeforeRender = ( renderer ) => {

				if ( ! this.passThrough ) {

					this.passThrough = new ORE.PostProcessing( renderer, {
						fragmentShader: passThroughFrag,
					} );

				}

				let currentRenderTarget = renderer.getRenderTarget();

				if ( currentRenderTarget ) {

					this.passThrough.render( { tex: currentRenderTarget.texture }, this.sceneRenderTarget );

					this.commonUniforms.uSceneTex.value = this.sceneRenderTarget.texture;

				}

			};

			/*-------------------------------
				Line Mesh
			-------------------------------*/

			const lineMat = new THREE.ShaderMaterial( {
				vertexShader: bakuVert,
				fragmentShader: bakuFrag,
				uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				} ),
				side: THREE.BackSide,
				depthWrite: false,
				transparent: true,
				defines: {
					IS_LINE: ''
				},
			} );

			this.meshLine = new THREE.SkinnedMesh( this.mesh.geometry, lineMat );
			this.meshLine.skeleton = this.mesh.skeleton;
			// this.container.add( this.meshLine );

			/*-------------------------------
				animation
			-------------------------------*/

			this.animationMixer = new THREE.AnimationMixer( this );
			this.animations = gltf.animations;

			for ( let i = 0; i < this.animations.length; i ++ ) {

				let clip = this.animations[ i ];

				this.animator.add( {
					name: "BakuWeight/" + clip.name,
					initValue: 1,
					userData: {
						pane: {
							min: 0,
							max: 1
						}
					},
					easing: ORE.Easings.easeOutCubic
				} );

				this.animationClipNameList.push( clip.name );

				let action = this.animationMixer.clipAction( this.animations[ i ] );

				if ( clip.name == 'section_2' ) {

					action.timeScale = 0.2;

				}

				this.animationActions[ clip.name ] = action;

			}

			if ( this.currentAnimationSection ) {

				this.changeSectionAction( this.currentAnimationSection );

			}

			if ( this.onLoaded ) {

				this.onLoaded();

			}

		} );

	}

	public changeMaterial( type: BakuMaterialType ) {

		this.animator.animate( 'bakuTransparent', type == 'glass' ? 1 : 0, 1 );
		this.animator.animate( 'bakuLine', type == 'line' ? 1 : 0, 1 );
		this.animator.animate( 'bakuLine', type == 'line' ? 1 : 0, 1 );
		this.animator.animate( 'bakuRimLight', type == 'dark' ? 0.0 : 1.0 );

	}

	private playingSectionAction: THREE.AnimationAction | null = null;

	public changeSectionAction( sectionName: string ) {

		let action = this.animationActions[ sectionName ];
		let lastSectionAction = this.playingSectionAction;
		this.playingSectionAction = action;

		if ( action ) {

			action.play();

		}

		for ( let i = 0; i < this.animationClipNameList.length; i ++ ) {

			let name = this.animationClipNameList[ i ];
			this.animator.animate( 'BakuWeight/' + name, name == sectionName ? 1 : 0, 1.0, () =>{

				if ( lastSectionAction && lastSectionAction.getClip().name == name ) {

					lastSectionAction.stop();

				}

			} );

		}

		this.currentAnimationSection = sectionName;

	}

	public update( deltaTime: number ) {

		if ( this.animationMixer ) {

			this.animationMixer.update( deltaTime );

			for ( let i = 0; i < this.animationClipNameList.length; i ++ ) {

				let name = this.animationClipNameList[ i ];

				let action = this.animationActions[ name ];

				if ( action ) {

					action.weight = this.animator.get( 'BakuWeight/' + name ) || 0;

				}

				// 無理やりループ
				if ( action.loop != THREE.LoopOnce ) {

					if ( action.time > 3.33333333333 ) {

						action.time = 0;

					}

				}

			}

		}

		if ( this.mesh ) {

			this.rotation.z -= ( this.animator.get<number>( 'bakuIntroRotate' ) ?? 0 ) * 3.0;

		}

		if ( ! this.animator.isAnimatingVariable( 'bakuRotateValue' ) ) {


			this.animator.setValue( "bakuRotateValue", ( this.animator.get<number>( 'bakuRotateValue' ) ?? 0 ) + ( this.animator.get<number>( 'bakuRotateSpeed' ) ?? 0 ) * deltaTime );

		}

		this.container.rotation.z = this.animator.get<number>( 'bakuRotateValue' ) ?? 0;

	}

	public jump() {

		if ( this.jumping ) return;

		this.jumping = true;

		let action = this.animationActions[ "section_4_jump" ];
		action.reset();
		action.loop = THREE.LoopOnce;
		action.play();

		this.animator.animate( 'BakuWeight/section_4', 0, 0.1 );
		this.animator.animate( 'BakuWeight/section_4_jump', 1.0, 0.1 );

		if ( this.animationMixer ) {

			let onFinished = ( e: any ) => {

				let action = e.action as THREE.AnimationAction;
				let clip = action.getClip();

				if ( clip.name == 'section_4_jump' ) {

					this.animator.animate( 'BakuWeight/section_4', 1.0, 1.0 );
					this.animator.animate( 'BakuWeight/section_4_jump', 0.0, 1.0 );

					this.jumping = false;

					if ( this.animationMixer ) {

						this.animationMixer.addEventListener( 'finished', onFinished );

					}

				}

			};

			this.animationMixer.addEventListener( 'finished', onFinished );

		}

		this.dispatchEvent( {
			type: 'jump'
		} );

	}

	public changeRotateSpeed( speed: number ) {

		if ( speed == 0.0 ) {

			this.animator.setValue( 'bakuRotateSpeed', 0 );
			this.animator.setValue( 'bakuRotateValue', ( this.container.rotation.z + Math.PI ) % ( Math.PI * 2.0 ) - Math.PI );
			this.animator.animate( 'bakuRotateValue', 0 );

			return;

		}

		this.animator.animate( 'bakuRotateSpeed', speed );


	}

	public show( duration: number = 1.0 ) {

		this.animator.animate( 'bakuIntroRotate', 0, duration );

	}

	public resize( info: ORE.LayerInfo ) {

		this.sceneRenderTarget.setSize( info.size.canvasPixelSize.x, info.size.canvasPixelSize.y );
		this.commonUniforms.winResolution.value.copy( info.size.canvasPixelSize );

	}

}

</document_content>
</document>
<document index="59">
<source>src/ts/MainScene/World/Baku/shaders/baku.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}

/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform vec2 winResolution;
uniform float uTransparent;
uniform float uLine;
uniform float uRimLight;
uniform samplerCube uEnvMap;

/*-------------------------------
	Textures
-------------------------------*/

uniform sampler2D uSceneTex;
uniform sampler2D uBackSideNormalTex;

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif

#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

/*-------------------------------
	Lights
-------------------------------*/

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif

/*-------------------------------
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;
	uniform float cameraNear;
	uniform float cameraFar;

#endif

#ifdef USE_SHADOWMAP

#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#define SHADOW_SAMPLE_COUNT 4

	vec2 poissonDisk[ SHADOW_SAMPLE_COUNT ];

	void initPoissonDisk( float seed ) {

		float r = 0.1;
		float rStep = (1.0 - r) / float( SHADOW_SAMPLE_COUNT );

		float ang = random( gl_FragCoord.xy * 0.01 + sin( time ) ) * PI2 * 1.0;
		float angStep = ( ( PI2 * 11.0 ) / float( SHADOW_SAMPLE_COUNT ) );

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i++ ) {

			poissonDisk[ i ] = vec2(
				sin( ang ),
				cos( ang )
			) * pow( r, 0.75 );

			r += rStep;
			ang += angStep;
		}

	}

	vec2 compairShadowMapDepth( sampler2D shadowMap, vec2 shadowMapUV, float depth ) {

		if( shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadowMapDepth = unpackRGBAToDepth( texture2D( shadowMap, shadowMapUV ) );

		if( 0.0 >= shadowMapDepth || shadowMapDepth >= 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadow = depth <= shadowMapDepth ? 1.0 : 0.0;

		return vec2( shadow, shadowMapDepth );

	}

	float shadowMapPCF( sampler2D shadowMap, vec4 shadowMapCoord, vec2 shadowSize ) {

		float shadow = 0.0;

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i ++  ) {

			vec2 offset = poissonDisk[ i ] * shadowSize;

			shadow += compairShadowMapDepth( shadowMap, shadowMapCoord.xy + offset, shadowMapCoord.z ).x;

		}

		shadow /= float( SHADOW_SAMPLE_COUNT );

		return shadow;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float bias, vec4 shadowMapCoord ) {

		shadowMapCoord.xyz /= shadowMapCoord.w;
		shadowMapCoord.z += bias - 0.0001;

		initPoissonDisk(time);

		vec2 shadowSize = 1.0 / shadowMapSize;

		return shadowMapPCF( shadowMap, shadowMapCoord, shadowSize );

	}

#endif

/*-------------------------------
	RE
-------------------------------*/

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

float gSchlick( float d, float k ) {

	if( d == 0.0 ) return 0.0;

	return d / ( d * ( 1.0 - k ) + k );

}

float gSmith( float dNV, float dNL, float roughness ) {

	float k = clamp( roughness * sqrt( 2.0 / PI ), 0.0, 1.0 );

	return gSchlick( dNV, k ) * gSchlick( dNL, k );

}

float fresnel( float d ) {

	float f0 = 0.04;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	// diffuse
	vec3 diffuse = lambert( mat.diffuseColor ) * irradiance;

	// specular
	float D = ggx( dNH, mat.roughness );
	float G = gSmith( dNV, dNL, mat.roughness );
	float F = fresnel( dLH );

	vec3 specular = (( D * G * F ) / ( 4.0 * dNL * dNV + 0.0001 ) * mat.specularColor ) * irradiance;

	vec3 c = vec3( 0.0 );
	c += diffuse * ( 1.0 - F ) + specular;


	vec3 color = vec3( mix( vec3( 1.0 ), mat.diffuseColor * 0.5 + 0.5, length( mat.diffuseColor ) ) )* mix( #000, vec3( 1.0, 1.0, 1.0 ), dNL + random(gl_FragCoord.xy * 0.001) * 0.15 );
	// c = mix( c, vec3( 1.0 ), uLine);

	return c;

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	#ifdef IS_LINE

		gl_FragColor = vec4( 0.0, 0.0, 0.0, uLine );
		return;

	#endif

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;

	#ifdef USE_MAP

		vec4 color = LinearTosRGB( texture2D( map, vUv ) );
		mat.albedo = color.xyz;
		mat.opacity = color.w;

	#else

		mat.albedo = color.xyz;
		mat.opacity = 1.0;

	#endif

	#ifdef USE_ROUGHNESS_MAP

		mat.roughness = texture2D( roughnessMap, vUv ).y;

	#else

		mat.roughness = roughness;

	#endif

	mat.roughness *= 1.0 - uTransparent * 0.7;

	#ifdef USE_METALNESS_MAP

		mat.metalness = texture2D( metalnessMap, vUv ).z;

	#else

		mat.metalness = metalness;

	#endif

	#ifdef USE_ALPHA_MAP

		mat.opacity = texture2D( alphaMap, vUv ).x;

	#else

		mat.opacity *= opacity;

	#endif

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	// vec3 outColor = mix( vec3( 0.0 ), vec3( mix( vec3( 1.0 ), mat.diffuseColor, length( mat.diffuseColor ) )  ), uLine );
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;
	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	// refract

	vec3 refractCol = vec3( 0.0 );
	vec2 screenUv = gl_FragCoord.xy / winResolution.xy;
	vec2 refractUv = screenUv;

	float slide;
	vec2 refractUvR;
	vec2 refractUvG;
	vec2 refractUvB;
	float refractPower = 0.3;
	vec2 refractNormal = geo.normal.xy * ( 1.0 - geo.normal.z * 0.85 );

	#pragma unroll_loop_start
	for ( int i = 0; i < 16; i ++ ) {

		slide = float( UNROLLED_LOOP_INDEX ) / 16.0 * 0.1 + random( screenUv ) * 0.03;

		refractUvR = refractUv - refractNormal * ( refractPower + slide * 1.0 ) * uTransparent;
		refractUvG = refractUv - refractNormal * ( refractPower + slide * 1.5 ) * uTransparent;
		refractUvB = refractUv - refractNormal * ( refractPower + slide * 2.0 ) * uTransparent;

		refractCol.x += texture2D( uSceneTex, refractUvR ).x;
		refractCol.y += texture2D( uSceneTex, refractUvG ).y;
		refractCol.z += texture2D( uSceneTex, refractUvB ).z;

	}
	#pragma unroll_loop_end
	refractCol /= float( 16 );

	outColor += refractCol * mix( vec3( 0.8 ), mat.diffuseColor, length( mat.diffuseColor ) ) * uTransparent;

	/*-------------------------------
		Lighting
	-------------------------------*/

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;
				shadow = 1.0;

				#if defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS

					shadow = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

				outColor += RE( geo, mat, light ) * shadow;

			}
		#pragma unroll_loop_end

	#endif

	#if NUM_POINT_LIGHTS > 0

		PointLight pLight;

		#pragma unroll_loop_start

			for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

				pLight = pointLights[ i ];

				vec3 v = pLight.position - geo.pos;
				float d = length( v );
				light.direction = normalize( v );

				light.color = pLight.color ;

				if( pLight.distance > 0.0 && pLight.decay > 0.0 ) {

					float attenuation = pow( clamp( -d / pLight.distance + 1.0, 0.0, 1.0 ), pLight.decay );
					light.color *= attenuation;

				}

				outColor += RE( geo, mat, light );

			}

		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		EnvMap
	-------------------------------*/

	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float EF = mix( fresnel( dNV ), 1.0, mat.metalness );
	outColor += EF * ( 0.5 +  uRimLight * 0.3 );

	vec3 refDir = reflect( geo.viewDirWorld, geo.normalWorld );
	refDir.x *= -1.0;

	vec3 envMapColor = textureCube( uEnvMap, refDir ).xyz;
	outColor += envMapColor * EF * uTransparent;

	/*-------------------------------
		Emission
	-------------------------------*/

	#ifdef USE_EMISSION_MAP

		outColor += LinearTosRGB( texture2D( emissionMap, vUv ) ).xyz;

	#else

		outColor += emission;

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="60">
<source>src/ts/MainScene/World/Baku/shaders/baku.vs</source>
<document_content>
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec2 vHighPrecisionZW;

uniform float time;

#ifdef IS_LINE

	uniform float uLine;

#endif
/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>
#include <skinning_pars_vertex>

void main( void ) {

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 objectNormal = vec3( normal );

	#include <skinbase_vertex>
	#include <skinnormal_vertex>

	vec3 transformedNormal = normalMatrix * objectNormal;
	vec4 flipedTangent = tangent;
	flipedTangent.w *= -1.0;

	// #ifdef FLIP_SIDED
	// 	transformedNormal *= -1.0;
	// 	flipedTangent *= -1.0;
	// #endif


	vec3 normal = normalize( transformedNormal );
	vec3 tangent = normalize( ( modelViewMatrix * vec4( flipedTangent.xyz, 0.0 ) ).xyz );
	vec3 biTangent = normalize( cross( normal, tangent ) * flipedTangent.w );

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 transformed = vec3( position );

	#ifdef IS_LINE

		transformed += normal * 0.02 * uLine;

	#endif

	#include <skinning_vertex>

	vec3 pos = transformed;
	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vTangent = tangent;
	vBitangent = biTangent;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="61">
<source>src/ts/MainScene/World/Baku/shaders/passThrough.fs</source>
<document_content>
uniform sampler2D tex;
varying vec2 vUv;

void main( void ) {

	vec4 col = texture2D( tex, vUv );

	gl_FragColor = col;

}
</document_content>
</document>
<document index="62">
<source>src/ts/MainScene/World/Baku/shaders/passThrough.vs</source>
<document_content>
varying vec2 vUv;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="63">
<source>src/ts/MainScene/World/DrawTrail/Pencil/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import pencilVert from './shaders/pencil.vs';
import pencilFrag from './shaders/pencil.fs';

export class Pencil extends THREE.Mesh {

	private commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		let commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uTex: window.gManager.assetManager.getTex( 'signpen' )
		} );

		let height = 3.0;

		let size = new THREE.Vector2( 147 / 1024 * height * 1.3, height );
		let geo = new THREE.PlaneGeometry( size.x, size.y );
		// geo = new THREE.BoxGeometry( size.x, size.y, 1.0 );
		geo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeTranslation( 0.05, size.y / 2.0 - 0.1, 0.0 ) );
		geo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeRotationFromEuler( new THREE.Euler( 0.0, 0.7, - 0.2, 'YZX' ) ) );

		let mat = new THREE.ShaderMaterial( {
			fragmentShader: pencilFrag,
			vertexShader: pencilVert,
			uniforms: commonUniforms,
			side: THREE.DoubleSide,
			transparent: true,
		} );

		super( geo, mat );

		this.customDepthMaterial = new THREE.ShaderMaterial( {
			fragmentShader: pencilFrag,
			vertexShader: pencilVert,
			uniforms: commonUniforms,
			side: THREE.DoubleSide,
			defines: {
				DEPTH: ""
			},
		} );

		this.castShadow = true;
		this.frustumCulled = false;

		this.commonUniforms = commonUniforms;


	}

}

</document_content>
</document>
<document index="64">
<source>src/ts/MainScene/World/DrawTrail/Pencil/shaders/pencil.fs</source>
<document_content>
uniform sampler2D uTex;
varying vec2 vUv;

#include <packing>

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#endif

void main( void ) {

	vec4 color = texture2D( uTex, vUv );
	if( color.w < 0.5 ) discard;

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif


	gl_FragColor = color;

}
</document_content>
</document>
<document index="65">
<source>src/ts/MainScene/World/DrawTrail/Pencil/shaders/pencil.vs</source>
<document_content>
varying vec2 vUv;
uniform float uMaterial[6];
varying vec2 vHighPrecisionZW;

void main( void ) {

	vec3 pos = position;
	pos *= uMaterial[3];

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="66">
<source>src/ts/MainScene/World/DrawTrail/Sec1Pointer/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import sec1PointerVert from './shaders/sec1Pointer.vs';
import sec1PointerFrag from './shaders/sec1Pointer.fs';

export class Sec1Pointer {

	public mesh: THREE.Mesh;
	private commonUniforms: ORE.Uniforms;

	constructor( mesh: THREE.Mesh, parentUniforms: ORE.Uniforms ) {

		let baseMat = mesh.material as THREE.MeshStandardMaterial;

		let commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uTex: {
				value: baseMat.map
			},
			uMatCapTex: window.gManager.assetManager.getTex( 'matCap' ),
		} );

		let mat = new THREE.ShaderMaterial( {
			fragmentShader: sec1PointerFrag,
			vertexShader: sec1PointerVert,
			uniforms: commonUniforms,
		} );

		this.mesh = mesh;

		this.mesh.material = mat;

		this.mesh.children.forEach( item => {

			let mesh = item as THREE.Mesh;

			let mat = new THREE.ShaderMaterial( {
				fragmentShader: sec1PointerFrag,
				vertexShader: sec1PointerVert,
				uniforms: commonUniforms,
				defines: {
					"GRADATION": ''
				}
			} );

			mesh.material = mat;

		} );

		this.commonUniforms = commonUniforms;

	}

}

</document_content>
</document>
<document index="67">
<source>src/ts/MainScene/World/DrawTrail/Sec1Pointer/shaders/sec1Pointer.fs</source>
<document_content>
uniform sampler2D uTex;
uniform sampler2D uMatCapTex;
varying vec2 vUv;
varying vec3 vNormal;

#ifdef GRADATION

	uniform float time;

	//http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
	vec3 rgb2hsv(vec3 c)
	{
		vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
		vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
		vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

		float d = q.x - min(q.w, q.y);
		float e = 1.0e-10;
		return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
	}

	vec3 hsv2rgb(vec3 c)
	{
		vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
		return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
	}

#endif

void main( void ) {

	vec3 normal = normalize( vNormal );
	vec4 col = texture2D( uTex, vUv );
	col.xyz *= texture2D( uMatCapTex, vec2( normal.x, normal.y ) * 0.95 * 0.5 + 0.5 ).xyz;

	#ifdef GRADATION

		col.xyz =hsv2rgb( vec3( time * 0.1 + 0.3, 1.0, 0.9 ) );

	#endif

	gl_FragColor = col;

}
</document_content>
</document>
<document index="68">
<source>src/ts/MainScene/World/DrawTrail/Sec1Pointer/shaders/sec1Pointer.vs</source>
<document_content>
varying vec2 vUv;
uniform float uMaterial[6];
varying vec3 vNormal;

void main( void ) {

	vec3 pos = position;
	pos *= uMaterial[0];

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vNormal = normalMatrix * normal;

}
</document_content>
</document>
<document index="69">
<source>src/ts/MainScene/World/DrawTrail/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import drawTrailVert from './shaders/drawTrail.vs';
import drawTrailFrag from './shaders/drawTrail.fs';

import computePosition from './shaders/trailComputePosition.glsl';
import { Pencil } from './Pencil';
import { Sec1Pointer } from './Sec1Pointer';

declare interface Kernels{
    position: ORE.GPUComputationKernel
}

declare interface Datas{
    position: ORE.GPUcomputationData
}

export class DrawTrail extends THREE.Mesh {

	private animator: ORE.Animator;

	private commonUniforms: ORE.Uniforms;
	private meshUniforms: ORE.Uniforms;

	private renderer: THREE.WebGLRenderer;

	private radialSegments: number;
	private heightSegments: number;
	private positionAttr: THREE.BufferAttribute;

	private gCon: ORE.GPUComputationController;
	private kernels: Kernels;
	private datas: Datas;

	// state

	private cursorPos: THREE.Vector3 = new THREE.Vector3();
	private cursorPosDelay: THREE.Vector3 = new THREE.Vector3();

	private assets: THREE.Object3D;

	// children

	private childrenWrapper: THREE.Object3D;
	private pencil: Pencil;
	private pointer: Sec1Pointer;

	constructor( renderer: THREE.WebGLRenderer, assets: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		let radialSegments = 9;
		let heightSegments = 128;

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uCursorPos: {
				value: new THREE.Vector3( 0, 0 )
			},
			uPosDataTex: {
				value: null
			},
			uDataSize: {
				value: new THREE.Vector2()
			},
			uMaterial: window.gManager.animator.add( {
				name: 'trailMaterial',
				initValue: [ 1.0, 0.0, 0.0, 0.0, 0.0, 0.0 ],
			} ),
		} );

		let meshUniforms = ORE.UniformsLib.mergeUniforms( THREE.UniformsUtils.clone( THREE.UniformsLib.lights ), uni, {
			uSceneTex: {
				value: null
			},
			uWinResolution: {
				value: new THREE.Vector2()
			},
		} );

		let radius = 0.05;

		let geo = new THREE.CylinderGeometry( radius, radius, 1.0, radialSegments, heightSegments, true );
		let mat = new THREE.ShaderMaterial( {
			vertexShader: drawTrailVert,
			fragmentShader: drawTrailFrag,
			uniforms: meshUniforms,
			lights: true,
			transparent: false
		} );

		let computeUVArray = [];

		for ( let i = 0; i <= heightSegments; i ++ ) {

			for ( let j = 0; j <= radialSegments; j ++ ) {

				computeUVArray.push(
					i / ( heightSegments ), 0
				);

			}

		}

		geo.setAttribute( 'computeUV', new THREE.BufferAttribute( new Float32Array( computeUVArray ), 2 ), );
		geo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );
		geo.getAttribute( 'normal' ).applyMatrix4( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

		super( geo, mat );

		this.assets = assets;

		this.castShadow = true;

		this.animator = window.gManager.animator;

		this.renderOrder = 999;

		this.renderer = renderer;
		this.commonUniforms = uni;
		this.meshUniforms = meshUniforms;
		this.radialSegments = radialSegments;
		this.heightSegments = heightSegments;

		this.positionAttr = this.geometry.getAttribute( 'position' ) as THREE.BufferAttribute;

		/*-------------------------------
			GPU Controller
		-------------------------------*/

		let gpuCommonUniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
		} );

		this.gCon = new ORE.GPUComputationController( this.renderer, new THREE.Vector2( heightSegments, 1 ) );

		this.commonUniforms.uDataSize.value.copy( this.gCon.dataSize );

		// create computing position kernel

		let posUni = ORE.UniformsLib.mergeUniforms( gpuCommonUniforms, {
			uPosDataTex: { value: null },
			uNoiseTex: window.gManager.assetManager.getTex( 'noise' )
		} );

		let posKernel = this.gCon.createKernel( {
			fragmentShader: computePosition,
			uniforms: posUni
		} );

		// matomeru

		this.kernels = {
			position: posKernel,
		};

		this.datas = {
			position: this.gCon.createData()
		};

		/*-------------------------------
			Children
		-------------------------------*/

		this.childrenWrapper = new THREE.Object3D();
		this.add( this.childrenWrapper );

		this.pencil = new Pencil( this.commonUniforms );
		this.pencil.position.y = 0.1;
		this.childrenWrapper.add( this.pencil );

		this.pointer = new Sec1Pointer( this.assets.getObjectByName( 'Rocket' ) as THREE.Mesh, this.commonUniforms );
		this.childrenWrapper.add( this.pointer.mesh );

	}

	public setSceneTex( texture: THREE.Texture ) {

		this.meshUniforms.uSceneTex.value = texture;

	}

	private pointerDirection: THREE.Vector2 = new THREE.Vector2();

	public update( deltaTime: number ) {

		this.kernels.position.uniforms.uPosDataTex.value = this.datas.position.buffer.texture;
		this.gCon.compute( this.kernels.position, this.datas.position );

		this.meshUniforms.uPosDataTex.value = this.datas.position.buffer.texture;

		// calc pos
		let diff = this.cursorPos.clone().sub( this.cursorPosDelay );
		diff.multiplyScalar( deltaTime * 13.0 );

		this.cursorPosDelay.add( diff );

		this.commonUniforms.uCursorPos.value.copy( this.cursorPosDelay );
		this.childrenWrapper.position.copy( this.cursorPosDelay );

		this.pencil.rotation.z = diff.x * 0.7;
		this.pencil.rotation.x = - diff.z * 0.5;

		// pointer
		let diffVec2 = new THREE.Vector2( diff.x, diff.y );
		this.pointerDirection.lerp( diffVec2, Math.min( 1.0, diffVec2.length() * 10.0 ) );
		this.pointer.mesh.rotation.z = Math.atan2( this.pointerDirection.y, this.pointerDirection.x ) - Math.PI / 2;

	}

	public updateCursorPos( worldPos: THREE.Vector3, raycasterWorldPos: THREE.Vector3 ) {

		let localPos = this.worldToLocal( worldPos.clone() ).lerp( raycasterWorldPos, this.animator.get<number[]>( 'trailMaterial' )![ 3 ] );

		this.cursorPos.copy( localPos );

	}

	public changeMaterial( sectionIndex: number ) {

		let mat = [ 0, 0, 0, 0, 0, 0 ];

		mat[ sectionIndex ] = 1.0;

		this.animator.animate( 'trailMaterial', mat );

	}

	public resize( info: ORE.LayerInfo ) {

		this.meshUniforms.uWinResolution.value.copy( info.size.canvasPixelSize );

	}

}

</document_content>
</document>
<document index="70">
<source>src/ts/MainScene/World/DrawTrail/shaders/drawTrail.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform vec3 uColor;
uniform samplerCube uEnvMap;

uniform float uMaterial[6];

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}

/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform vec2 uWinResolution;

/*-------------------------------
	Textures
-------------------------------*/

uniform sampler2D uSceneTex;
uniform sampler2D uBackSideNormalTex;

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif

#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	vec3 emission;
	float metalness;
	float roughness;
	float opacity;
};

/*-------------------------------
	Lights
-------------------------------*/

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

/*-------------------------------
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#endif

#ifdef USE_SHADOWMAP

#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#define SHADOW_SAMPLE_COUNT 4

	vec2 poissonDisk[ SHADOW_SAMPLE_COUNT ];

	void initPoissonDisk( float seed ) {

		float r = 0.1;
		float rStep = (1.0 - r) / float( SHADOW_SAMPLE_COUNT );

		float ang = random( gl_FragCoord.xy * 0.01 ) * PI2 * 1.0;
		float angStep = ( ( PI2 * 11.0 ) / float( SHADOW_SAMPLE_COUNT ) );

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i++ ) {

			poissonDisk[ i ] = vec2(
				sin( ang ),
				cos( ang )
			) * pow( r, 0.75 );

			r += rStep;
			ang += angStep;
		}

	}

	vec2 compairShadowMapDepth( sampler2D shadowMap, vec2 shadowMapUV, float depth ) {

		if( shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadowMapDepth = unpackRGBAToDepth( texture2D( shadowMap, shadowMapUV ) );

		if( 0.0 >= shadowMapDepth || shadowMapDepth >= 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadow = depth <= shadowMapDepth ? 1.0 : 0.0;

		return vec2( shadow, shadowMapDepth );

	}

	float shadowMapPCF( sampler2D shadowMap, vec4 shadowMapCoord, vec2 shadowSize ) {

		float shadow = 0.0;

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i ++  ) {

			vec2 offset = poissonDisk[ i ] * shadowSize * 2.5;

			shadow += compairShadowMapDepth( shadowMap, shadowMapCoord.xy + offset, shadowMapCoord.z ).x;

		}

		shadow /= float( SHADOW_SAMPLE_COUNT );

		return shadow;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float bias, vec4 shadowMapCoord ) {

		shadowMapCoord.xyz /= shadowMapCoord.w;
		shadowMapCoord.z += bias - 0.0001;

		initPoissonDisk(time);

		vec2 shadowSize = 1.0 / shadowMapSize;

		return shadowMapPCF( shadowMap, shadowMapCoord, shadowSize );

	}

#endif


float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

float gSchlick( float d, float k ) {

	if( d == 0.0 ) return 0.0;

	return d / ( d * ( 1.0 - k ) + k );

}

float gSmith( float dNV, float dNL, float roughness ) {

	float k = clamp( roughness * sqrt( 2.0 / PI ), 0.0, 1.0 );

	return gSchlick( dNV, k ) * gSchlick( dNL, k );

}

float fresnel( float d ) {

	float f0 = 0.15;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}


vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	// diffuse
	vec3 diffuse = lambert( mat.diffuseColor ) * irradiance;

	// specular
	float D = ggx( dNH, mat.roughness );
	float G = gSmith( dNV, dNL, mat.roughness );
	float F = fresnel( dLH );

	vec3 specular = (( D * G * F ) / ( 4.0 * dNL * dNV + 0.0001 ) * mat.specularColor ) * irradiance;

	vec3 c = vec3( 0.0 );
	c += diffuse * ( 1.0 - F ) + specular;


	vec3 color = vec3( mix( vec3( 1.0 ), mat.diffuseColor * 0.5 + 0.5, length( mat.diffuseColor ) ) )* mix( #000, vec3( 1.0, 1.0, 1.0 ), dNL + random(gl_FragCoord.xy * 0.001) * 0.15 );
	// c = mix( c, vec3( 1.0 ), uLine);

	return c;

}

/*-------------------------------
	HSV
-------------------------------*/

vec3 hsv2rgb( vec3 hsv ){

	return ((clamp(abs(fract(hsv.x+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*hsv.y+1.)*hsv.z;

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;
	mat.opacity = 1.0;
	mat.roughness = 0.1;
	mat.metalness = 0.0;

	vec3 gradation = hsv2rgb( vec3( time * (0.1 + step(0.1, uMaterial[5] ) * 1.0) + ( -vUv.x ) * (0.1 + uMaterial[5] * 3.0) + 0.3, 1.0 - uMaterial[2] * 0.5 - uMaterial[5] * 0.4, 1.0 ) ) * (uMaterial[0] + uMaterial[2] + uMaterial[3] + uMaterial[5]) * 0.9;

	// albedo

	mat.albedo += gradation * uMaterial[0];

	// emission

	mat.emission = vec3( 0.0 );
	mat.emission += gradation * uMaterial[0];
	mat.emission += gradation * uMaterial[2];
	mat.emission += gradation * uMaterial[3];
	mat.emission += vec3( 0.1, 0.0, 0.0 ) * uMaterial[3];
	mat.emission += vec3( 0.5 ) * uMaterial[4];
	mat.emission += gradation * uMaterial[5];


	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output

	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;
	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Refract
	-------------------------------*/

	vec3 refractCol = vec3( 0.0 );
	vec2 screenUv = gl_FragCoord.xy / uWinResolution.xy;
	vec2 refractUv = screenUv;
	float slide;
	vec2 refractUvR;
	vec2 refractUvG;
	vec2 refractUvB;
	float refractPower = 0.1;
	vec2 refractNormal = geo.normal.xy * ( 1.0 - geo.normal.z * 0.9 );

	#pragma unroll_loop_start

	for ( int i = 0; i < 16; i ++ ) {

		slide = float( UNROLLED_LOOP_INDEX ) / 16.0 * 0.03 + random( screenUv ) * 0.007;

		refractUvR = refractUv - refractNormal * ( refractPower + slide * 1.0 );
		refractUvG = refractUv - refractNormal * ( refractPower + slide * 2.0 );
		refractUvB = refractUv - refractNormal * ( refractPower + slide * 3.0 );

		refractCol.x += texture2D( uSceneTex, refractUvR ).x;
		refractCol.y += texture2D( uSceneTex, refractUvG ).y;
		refractCol.z += texture2D( uSceneTex, refractUvB ).z;

	}
	#pragma unroll_loop_end
	refractCol /= float( 16 );

	outColor += (refractCol) * hsv2rgb(vec3( time * 0.05, 1.0, 1.0 ) ) * uMaterial[1];

	/*-------------------------------
		PBR
	-------------------------------*/

	Light light;

	float lw;
	lw += uMaterial[0];

	#if NUM_DIR_LIGHTS > 0

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;

				outColor += RE( geo, mat, light ) * lw;

			}
		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		Emission
	-------------------------------*/

	outColor += mat.emission;

	/*-------------------------------
		Shadow
	-------------------------------*/

	#if NUM_DIR_LIGHTS > 0

		float shadow = 1.0;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				#if defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS

					shadow *= getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

			}
		#pragma unroll_loop_end

		outColor *= mix( 1.0, shadow * 0.8 + 0.2, uMaterial[3] );

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="71">
<source>src/ts/MainScene/World/DrawTrail/shaders/drawTrail.vs</source>
<document_content>
attribute vec2 computeUV;
attribute vec4 tangent;

uniform sampler2D uPosDataTex;
uniform vec2 uDataSize;
uniform float uMaterial[6];
uniform float time;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec2 vHighPrecisionZW;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )

mat3 makeRotationDir( vec3 direction, vec3 up ) {

	vec3 xaxis = normalize( cross( up, direction ) );
	vec3 yaxis = normalize( cross( direction, xaxis ) );

	return mat3(
		xaxis.x, yaxis.x, direction.x,
		xaxis.y, yaxis.y, direction.y,
		xaxis.z, yaxis.z, direction.z
	);

}

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	pos.z *= 0.0;

    vec2 nextUV = computeUV + vec2(1.0 / ( uDataSize.x ), 0.0);

	vec4 posData = texture2D( uPosDataTex, computeUV );
    vec4 nextPosData = texture2D( uPosDataTex, nextUV );

    vec3 delta = ( posData.xyz - nextPosData.xyz );
	vec3 vec = normalize( delta );

	// length

	float trailLength = 0.0;
	trailLength += uMaterial[0] *( 0.054 );
	trailLength += uMaterial[1] * 0.1;
	trailLength += uMaterial[2] * 0.4;
	trailLength += uMaterial[3] * 1.0;
	trailLength += uMaterial[4] * 1.0;
	trailLength += uMaterial[5] * 0.5;

	// thickness

	float trailClamp = 1.0 - min( (1.0 - uv.y) / trailLength, 1.0);
	float thicknessWeight = sin( trailClamp * PI ) * length(delta) * 3.0;

	float thickness = 0.0;
	thickness += uMaterial[0] * 1.5 * thicknessWeight;
	thickness += uMaterial[1] * 5.0 * thicknessWeight;
	thickness += uMaterial[2] * 0.3 * thicknessWeight;
	thickness += uMaterial[3] * 1.0;
	thickness += uMaterial[4] * 0.05 * thicknessWeight;
	thickness += uMaterial[5] * 1.0 * thicknessWeight;

	mat2 sec4Rot = rotate( - (PI / 2.0) * uMaterial[3] );
	pos.xy *= sec4Rot;

	mat3 rot = makeRotationDir(vec, mix( vec3( 0.0, 0.0, 1.0 ), vec3( 0.0, 1.0, 0.0 ), uMaterial[3] ) );
	pos *= rot;
	pos *= thickness;
	pos += posData.xyz;

	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	vec4 flipedTangent = tangent;
	flipedTangent.w *= -1.0;

	#ifdef FLIP_SIDED
		transformedNormal *= -1.0;
		flipedTangent *= -1.0;
	#endif

	vec3 normal = normalize( transformedNormal );
	normal.xy *= sec4Rot;
	normal *= rot;

	vec3 tangent = normalize( ( modelViewMatrix * vec4( flipedTangent.xyz, 0.0 ) ).xyz );
	vec3 biTangent = normalize( cross( normal, tangent ) * flipedTangent.w );

	/*-------------------------------
		Shadow
	-------------------------------*/

	vec4 shadowWorldPos;

	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPos = worldPos + vec4( vec4( transformedNormal, 0.0 ) * modelMatrix ) * directionalLightShadows[ i ].shadowNormalBias;
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPos;

		}
		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = computeUV;
	vNormal = normal;
	vTangent = tangent;
	vBitangent = biTangent;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="72">
<source>src/ts/MainScene/World/DrawTrail/shaders/trailComputePosition.glsl</source>
<document_content>
uniform vec2 dataSize;
uniform sampler2D uPosDataTex;
uniform sampler2D uNoiseTex;
uniform float time;
uniform float uMaterial[6];
uniform vec3 uCursorPos;

#pragma glslify: rotate = require('./rotate.glsl' )

void main() {

    if( gl_FragCoord.x <= 1.0 ) {

        vec2 uv = gl_FragCoord.xy / dataSize.xy;
        gl_FragColor = vec4( uCursorPos, 1.0 );

    }

uniform float time;
uniform vec3 uColor;
uniform float uReflection;
uniform float uVisibility;

uniform float uVisibleIllust;
uniform float uVisibleGrid;

uniform sampler2D uIllustTex;
uniform sampler2D uGridTex;

uniform sampler2D uRandomTex;
uniform sampler2D uNoiseTex;

/*-------------------------------
	Textures
-------------------------------*/

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif

uniform sampler2D reflectionTex;
uniform vec2 renderResolution;
uniform vec2 mipMapResolution;

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

/*-------------------------------
	Lights
-------------------------------*/

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

#if NUM_POINT_LIGHTS > 0

	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};

	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];

#endif

/*-------------------------------
	EnvMap
-------------------------------*/

#ifdef USE_ENV_MAP

	uniform sampler2D envMap;
	uniform float envMapIntensity;
	uniform float iblIntensity;
	uniform float maxLodLevel;

	#define ENVMAP_TYPE_CUBE_UV
	#include <cube_uv_reflection_fragment>

#endif

/*-------------------------------
	Reflection
-------------------------------*/

#define REF_MIPMAP_LEVEL 8.0

#ifdef IS_REFLECTIONPLANE

	vec2 getRefMipmapUV( vec2 uv, float level ) {

		vec2 ruv = uv;

		if( level > 0.0 ) {

			ruv.x *= 1.0 / ( 3.0 * ( pow( 2.0, level ) / 2.0 ) );
			ruv.y *= 1.0 / ( pow( 2.0, level ) );
			ruv.y += 1.0 / ( pow( 2.0, level ) );
			ruv.x += 1.0 / 1.5;

		} else {

			ruv.x /= 1.5;

		}

		return ruv;

	}

	vec4 cubic(float v) {
		vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
		vec4 s = n * n * n;
		float x = s.x;
		float y = s.y - 4.0 * s.x;
		float z = s.z - 4.0 * s.y + 6.0 * s.x;
		float w = 6.0 - x - y - z;
		return vec4(x, y, z, w);
	}

	// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
	vec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {
		vec2 invTexSize = 1.0 / textureSize;
		texCoords = texCoords * textureSize - 0.5;
		vec2 fxy = fract(texCoords);
		texCoords -= fxy;
		vec4 xcubic = cubic(fxy.x);
		vec4 ycubic = cubic(fxy.y);
		vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;
		vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
		vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
		offset *= invTexSize.xxyy;
		vec4 sample0 = texture2D(t, offset.xz);
		vec4 sample1 = texture2D(t, offset.yz);
		vec4 sample2 = texture2D(t, offset.xw);
		vec4 sample3 = texture2D(t, offset.yw);
		float sx = s.x / (s.x + s.y);
		float sy = s.z / (s.z + s.w);
		return mix(
		mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
	}

#endif

/*-------------------------------
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#endif

#ifdef USE_SHADOWMAP

#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#define SHADOW_SAMPLE_COUNT 4

	vec2 poissonDisk[ SHADOW_SAMPLE_COUNT ];

	void initPoissonDisk( float seed ) {

		float r = 0.1;
		float rStep = (1.0 - r) / float( SHADOW_SAMPLE_COUNT );

		float ang = random( gl_FragCoord.xy * 0.01 ) * PI2 * 1.0;
		float angStep = ( ( PI2 * 11.0 ) / float( SHADOW_SAMPLE_COUNT ) );

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i++ ) {

			poissonDisk[ i ] = vec2(
				sin( ang ),
				cos( ang )
			) * pow( r, 0.75 );

			r += rStep;
			ang += angStep;
		}

	}

	vec2 compairShadowMapDepth( sampler2D shadowMap, vec2 shadowMapUV, float depth ) {

		if( shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadowMapDepth = unpackRGBAToDepth( texture2D( shadowMap, shadowMapUV ) );

		if( 0.0 >= shadowMapDepth || shadowMapDepth >= 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadow = depth <= shadowMapDepth ? 1.0 : 0.0;

		return vec2( shadow, shadowMapDepth );

	}

	float shadowMapPCF( sampler2D shadowMap, vec4 shadowMapCoord, vec2 shadowSize ) {

		float shadow = 0.0;

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i ++  ) {

			vec2 offset = poissonDisk[ i ] * shadowSize * 2.5;

			shadow += compairShadowMapDepth( shadowMap, shadowMapCoord.xy + offset, shadowMapCoord.z ).x;

		}

		shadow /= float( SHADOW_SAMPLE_COUNT );

		return shadow;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float bias, vec4 shadowMapCoord ) {

		shadowMapCoord.xyz /= shadowMapCoord.w;
		shadowMapCoord.z += bias - 0.0001;

		initPoissonDisk(time);

		vec2 shadowSize = 1.0 / shadowMapSize;

		return shadowMapPCF( shadowMap, shadowMapCoord, shadowSize );

	}

#endif

/*-------------------------------
	RE
-------------------------------*/

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float fresnel( float d ) {

	float f0 = 0.04;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;

	mat.albedo = uColor;
	mat.albedo *=
		mix( vec3( 1.0 ), texture2D( uGridTex, vUv * 4.0 * vec2( uVisibleGrid * 0.5 + 0.5, 1.0 ) ).xyz, uVisibleGrid ) *
		mix( vec3( 1.0 ), texture2D( uIllustTex, vUv ).xyz, step( 0.0, - texture2D( uNoiseTex, vUv * 2.0 ).x + uVisibleIllust * 1.0 ) );

	mat.albedo *= 0.95 + 0.05 * texture2D( uRandomTex, vUv * 3.0 ).x;

	mat.opacity = uVisibility;
	mat.roughness = texture2D( roughnessMap, vUv ).y;
	mat.metalness = 0.0;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( mat.albedo );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	#ifdef USE_NORMAL_MAP

		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );

		#ifdef DOUBLE_SIDED

			tangent *= faceDirection;
			bitangent *= faceDirection;

		#endif

		mat3 vTBN = mat3( tangent, bitangent, geo.normal );

		vec3 mapN = texture2D( normalMap, vUv ).xyz;
		mapN = mapN * 2.0 - 1.0;
		geo.normal = normalize( vTBN * mapN );

	#endif

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Shadow
	-------------------------------*/

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				#if defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS

					outColor *= 0.3 + 0.6 * getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

			}
		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		Reflection
	-------------------------------*/

	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float EF = fresnel( dNV );

	vec2 refUV = gl_FragCoord.xy / renderResolution;

	refUV.x += geo.normal.x * 0.5;

	float l = (mat.roughness ) * REF_MIPMAP_LEVEL;

	float offset1 = floor( l );
	float offset2 = offset1 + 1.0;
	float blend = fract( l );

	vec2 ruv1 = getRefMipmapUV( refUV, offset1 );
	vec2 ruv2 = getRefMipmapUV( refUV, offset2 );

	vec3 ref1 = textureBicubic( reflectionTex, ruv1, mipMapResolution ).xyz;
	vec3 ref2 = textureBicubic( reflectionTex, ruv2, mipMapResolution ).xyz;

	vec3 ref = mat.specularColor * mix( ref1, ref2, blend );

	outColor = mix(
		outColor,
		ref,
		EF * uReflection
	);

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="75">
<source>src/ts/MainScene/World/Intro/CameraController/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export type CameraTransform = {
	position: THREE.Vector3;
	targetPosition: THREE.Vector3;
	fov: number
}

export class CameraController {

	// camera

	private camera: THREE.PerspectiveCamera;
	private baseCamera: THREE.PerspectiveCamera;

	// cursor

	private cursorPos: THREE.Vector2;
	public cursorPosDelay: THREE.Vector2;
	private cursorPosDelayVel: THREE.Vector2;

	// param

	private moveRange: THREE.Vector2;

	// pos

	private basePos: THREE.Vector3;
	private target: THREE.Vector3;

	private posData = {
		base: {
			pos: new THREE.Vector3( 0, 0, 5 ),
			target: new THREE.Vector3( 0, 0, 0 )
		},
	};

	constructor( obj: THREE.PerspectiveCamera ) {

		this.camera = obj;
		this.baseCamera = new THREE.PerspectiveCamera( 40, 1.0, 0.1, 1000 );

		// param

		this.moveRange = new THREE.Vector2( 0.1, 0.1 );

		this.cursorPos = new THREE.Vector2();
		this.cursorPosDelay = new THREE.Vector2();
		this.cursorPosDelayVel = new THREE.Vector2();

		this.basePos = new THREE.Vector3();
		this.basePos.copy( this.posData.base.pos );

		this.target = new THREE.Vector3();
		this.target.copy( this.posData.base.target );

	}

	public updateCursor( pos: THREE.Vector2 ) {

		if ( pos.x != pos.x ) return;

		this.cursorPos.set( Math.min( 1.0, Math.max( - 1.0, pos.x ) ), Math.min( 1.0, Math.max( - 1.0, pos.y ) ) );

	}

	public update( deltaTime: number ) {

		deltaTime = Math.min( 0.3, deltaTime ) * 0.3;

		/*------------------------
			update hover
		------------------------*/

		let diff = this.cursorPos.clone().sub( this.cursorPosDelay ).multiplyScalar( deltaTime * 1.0 );
		diff.multiply( diff.clone().addScalar( 1.0 ) );

		this.cursorPosDelayVel.add( diff.multiplyScalar( 5.0 ) );
		this.cursorPosDelayVel.multiplyScalar( 0.85 );

		this.cursorPosDelay.add( this.cursorPosDelayVel );

		/*------------------------
			Position
		------------------------*/


		this.camera.position.set(
			this.basePos.x + this.cursorPosDelay.x * this.moveRange.x,
			this.basePos.y + this.cursorPosDelay.y * this.moveRange.y,
			this.basePos.z
		);

		/*------------------------
			Target
		------------------------*/

		this.camera.lookAt( this.target );

	}

	public resize( info: ORE.LayerInfo ) {

		this.camera.fov = this.baseCamera.fov * 1.0 + info.size.portraitWeight * 20.0;
		this.camera.updateProjectionMatrix();

	}

}

</document_content>
</document>
<document index="76">
<source>src/ts/MainScene/World/Intro/IntroGrid/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import introGridVert from './shaders/introGrid.vs';
import introGridFrag from './shaders/introGrid.fs';

export class IntroGrid extends THREE.Mesh {

	private commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		let geo = new THREE.PlaneGeometry( 10, 10 );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: introGridVert,
			fragmentShader: introGridFrag,
			uniforms: uni
		} );

		super( geo, mat );

		this.commonUniforms = uni;

	}

}

</document_content>
</document>
<document index="77">
<source>src/ts/MainScene/World/Intro/IntroGrid/shaders/introGrid.fs</source>
<document_content>
uniform float uVisibility;
varying vec2 vUv;

void main( void ) {

	vec3 col = vec3( 0.0 );

	vec2 glid = step( vec2( 0.985 ), mod( vUv * 20.0, vec2( 1.0, 1.0 ) ) );

	col += min( 1.0, glid.x + glid.y ) * 0.2;
	col *= uVisibility;

	gl_FragColor = vec4( col, 1.0 );

}
</document_content>
</document>
<document index="78">
<source>src/ts/MainScene/World/Intro/IntroGrid/shaders/introGrid.vs</source>
<document_content>
varying vec2 vUv;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}

</document_content>
</document>
<document index="79">
<source>src/ts/MainScene/World/Intro/IntroText/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import textVert from './shaders/introText.vs';
import textFrag from './shaders/introText.fs';

export class IntroText {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	private root: THREE.Object3D;
	private text: string;
	private elm?: HTMLElement;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms, text: string, elm?: HTMLElement ) {

		this.root = root;
		this.text = text;
		this.elm = elm;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'introTextVisibility' + this.root.uuid,
			initValue: 0,
		} );

		/*-------------------------------
			Material
		-------------------------------*/

		this.root.children.forEach( item => {

			let mesh = item as THREE.Mesh;

			if ( mesh.isMesh ) {

				let baseMaterial = mesh.material as THREE.MeshStandardMaterial;

				let map = baseMaterial.map;

				if ( map ) {

					map.magFilter = THREE.LinearFilter;
					map.minFilter = THREE.LinearFilter;

				}

				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: textVert,
					fragmentShader: textFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						tex: {
							value: map
						}
					} ),
					transparent: true
				} );

			}

		} );

		this.setVisible( false );

	}

	public async start( unRemovable?: boolean ) {

		setTimeout( () => {

			window.subtitles.show( this.text, 1, 2.0 );

		}, 500 );

		await this.swithVisibility( true );

		await new Promise( ( r ) => {

			setTimeout( () => {

				r( null );

			}, 2000 );

		} );

		if ( ! unRemovable ) {

			await this.swithVisibility( false );

		} else {

			if ( this.elm ) {

				this.elm.setAttribute( 'data-visible', "false" );

			}

		}

	}

	public async swithVisibility( visible: boolean ) {

		if ( visible ) this.setVisible( true );

		if ( this.elm ) {

			this.elm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

		}

		return this.animator.animate( 'introTextVisibility' + this.root.uuid, visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.setVisible( false );

		} );

	}

	private enable: boolean = false;
	private visible: boolean = true;

	public setEnable( enable: boolean ) {

		this.enable = enable;

		this.checkObjectVisible();

	}

	public setVisible( visible: boolean ) {

		this.visible = visible;

		this.checkObjectVisible();

	}

	private checkObjectVisible() {

		if ( this.enable && this.visible ) {

			this.root.visible = true;

		} else {

			this.root.visible = false;

		}

	}

}

</document_content>
</document>
<document index="80">
<source>src/ts/MainScene/World/Intro/IntroText/shaders/introText.fs</source>
<document_content>
uniform sampler2D tex;
uniform float uVisibility;
varying vec2 vUv;

void main( void ) {

	vec4 col = texture2D( tex, vUv );
	col.w *= uVisibility;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="81">
<source>src/ts/MainScene/World/Intro/IntroText/shaders/introText.vs</source>
<document_content>
varying vec2 vUv;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="82">
<source>src/ts/MainScene/World/Intro/IntroUI/index.ts</source>
<document_content>
import EventEmitter from "wolfy87-eventemitter";

export class IntroUI extends EventEmitter {

	// private elm: HTMLElement;

	// skip
	private skipElm: HTMLElement;
	private skipBakuElm: HTMLElement;
	private skiptTxtElm: HTMLElement;

	constructor() {

		super();

		// this.elm = document.querySelector( '.intro' )!;

		// skip
		this.skipElm = document.querySelector( '.intro-skip' )!;
		this.skipBakuElm = this.skipElm.querySelector( '.intro-skip-baku' )!;
		this.skiptTxtElm = this.skipElm.querySelector( '.intro-skip-txt' )!;
		this.skiptTxtElm.setAttribute( 'data-skipTxt', 'skip' );

		this.skipElm.addEventListener( 'click', () => {

			this.skiptTxtElm.setAttribute( 'data-skipTxt', 'ok' );

			setTimeout( () => {

				this.switchSkipVisibility( false );

			}, 200 );

			setTimeout( () => {

				this.emitEvent( 'skip' );

			}, 1000 );

		} );

	}

	public switchSkipVisibility( visible: boolean ) {

		this.skipElm.setAttribute( 'data-skipVisible', visible ? 'true' : 'false' );

	}

}

</document_content>
</document>
<document index="83">
<source>src/ts/MainScene/World/Intro/Logo/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import logoVert from './shaders/logo.vs';
import logoFrag from './shaders/logo.fs';
import logoIsVert from './shaders/logoIs.vs';
import logoIsFrag from './shaders/logoIs.fs';

import imagingVert from './shaders/imaging.vs';
import imagingFrag from './shaders/imaging.fs';
import EventEmitter from 'wolfy87-eventemitter';

export class Logo extends EventEmitter {

	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;
	private layoutController: ORE.LayoutController;

	private logoMesh: THREE.Mesh;
	private lineMesh: THREE.Mesh;
	private isMesh: THREE.Mesh;
	private imagingMesh: THREE.Mesh;

	private canceled: boolean = false;

	constructor( logoMesh: THREE.Mesh, parentUniforms: ORE.Uniforms ) {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uIntroLogoVisibility = this.animator.add( {
			name: 'introLogoVisibility',
			initValue: 1,
			// easing: ORE.Easings.easeOutCubic
		} );

		this.commonUniforms.uImaging = this.animator.add( {
			name: 'introLogoImaging',
			initValue: 0,
		} );

		this.commonUniforms.uIsVisibility = this.animator.add( {
			name: 'introLogoIs',
			initValue: 0,
			easing: ORE.Easings.linear
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		// logo

		this.logoMesh = logoMesh;

		this.logoMesh.material = new THREE.ShaderMaterial( {
			fragmentShader: logoFrag,
			vertexShader: logoVert,
			uniforms: this.commonUniforms,
			transparent: true
		} );

		// line

		this.lineMesh = this.logoMesh.getObjectByName( 'LogoLine' ) as THREE.Mesh;
		this.lineMesh.material = new THREE.ShaderMaterial( {
			fragmentShader: logoIsFrag,
			vertexShader: logoIsVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uNum: {
					value: 1
				}
			} ),
			transparent: true,
			defines: {
				'IS_LINE': ''
			}
		} );

		// isMesh

		this.isMesh = this.logoMesh.getObjectByName( 'LogoIs' ) as THREE.Mesh;
		this.isMesh.material = new THREE.ShaderMaterial( {
			fragmentShader: logoIsFrag,
			vertexShader: logoIsVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uNum: {
					value: 2
				}
			} ),
			transparent: true,
		} );

		// imaging

		this.imagingMesh = this.logoMesh.getObjectByName( 'Imaging' ) as THREE.Mesh;

		let baseMat = this.imagingMesh.material as THREE.MeshStandardMaterial;

		this.imagingMesh.material = new THREE.ShaderMaterial( {
			fragmentShader: imagingFrag,
			vertexShader: imagingVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uTex: { value: baseMat.map },
				uNoiseTex: window.gManager.assetManager.getTex( 'noise' ),
			} ),
			transparent: true
		} );

		/*-------------------------------
			Layout
		-------------------------------*/

		this.layoutController = new ORE.LayoutController( this.logoMesh, {
			position: new THREE.Vector3( 0.0, 0.0, 0.0 ),
		}, true );

	}

	public update( deltaTime: number ) {

		// this.layoutController.updateTransform( this.animator.get( 'introLogoVisibility' ) || 0 );
		this.logoMesh.position.x = - ( this.animator.get<number>( 'introLogoImaging' ) || 0 ) * 0.4;

	}

	public async start() {

		await this.animator.animate( 'introLogoIs', 0, 1 );

		await this.animator.animate( 'introLogoIs', 1, 1 );

		await this.animator.animate( 'introLogoIs', 1, 0.8 );

		setTimeout( () => {

			if ( this.canceled ) return;

			window.subtitles.show( 'わたしたちは、想像します。', 0.8 );

			this.emitEvent( 'showImaging' );

		}, 500 );


		await this.animator.animate( 'introLogoImaging', 1, 1.5 );

		await this.animator.animate( 'introLogoImaging', 1, 0.5 );

		setTimeout( () => {

			window.subtitles.hideAll();

		}, 500 );

		await this.animator.animate( 'introLogoVisibility', 0, 1 );

		this.logoMesh.visible = false;
		this.isMesh.visible = false;
		this.lineMesh.visible = false;
		this.imagingMesh.visible = false;

	}

	public cancel() {

		this.canceled = true;
		window.subtitles.hideAll();

	}

}

</document_content>
</document>
<document index="84">
<source>src/ts/MainScene/World/Intro/Logo/shaders/imaging.fs</source>
<document_content>
uniform sampler2D uTex;
uniform sampler2D uNoiseTex;
uniform float uImaging;
uniform float loaded;
uniform float uIntroLogoVisibility;

varying vec2 vUv;

void main( void ) {

	vec4 col = vec4( 1.0, 1.0, 1.0, 1.0 );

	vec4 noise = texture2D( uNoiseTex, vUv );

	vec2 uv = vUv;
	uv.x += noise.x * ( 1.0 - uImaging ) * 0.2;

	vec4 tex = texture2D( uTex, uv );
	col.w *= tex.w * uImaging;

	col.w *= uIntroLogoVisibility;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="85">
<source>src/ts/MainScene/World/Intro/Logo/shaders/imaging.vs</source>
<document_content>
varying vec2 vUv;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="86">
<source>src/ts/MainScene/World/Intro/Logo/shaders/logo.fs</source>
<document_content>
uniform sampler2D tex;
uniform float loaded;
uniform float uIntroLogoVisibility;
varying vec2 vUv;

void main( void ) {

	vec4 col = vec4( 1.0, 1.0, 1.0, 1.0 );

	col.w = loaded * uIntroLogoVisibility;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="87">
<source>src/ts/MainScene/World/Intro/Logo/shaders/logo.vs</source>
<document_content>
uniform float uIsVisibility;
varying vec2 vUv;

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

float easeInOutQuad( float t ) {

	return t < 0.5 ? 2.0 * t * t : -1.0 + ( 4.0 - 2.0 * t ) * t;

}

void main( void ) {

	vec3 pos = position;

	pos.x += easeInOutQuad( 1.0 - uIsVisibility ) * 0.12;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="88">
<source>src/ts/MainScene/World/Intro/Logo/shaders/logoIs.fs</source>
<document_content>
uniform sampler2D tex;
uniform float loaded;
uniform float uIsVisibility;
uniform float uIntroLogoVisibility;

varying vec2 vUv;
varying float vAlpha;

void main( void ) {

	vec4 col = vec4( 1.0, 1.0, 1.0, 1.0 );

	col.w = vAlpha * uIntroLogoVisibility;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="89">
<source>src/ts/MainScene/World/Intro/Logo/shaders/logoIs.vs</source>
<document_content>
varying vec2 vUv;

uniform float uIsVisibility;
uniform float uNum;

varying float vAlpha;

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

float easeInOutQuad( float t ) {

	return t < 0.5 ? 2.0 * t * t : -1.0 + ( 4.0 - 2.0 * t ) * t;

}


void main( void ) {

	vec3 pos = position;

	#ifdef IS_LINE

		pos.x += 0.08;
		pos.x *= easeInOutQuad( linearstep( 0.0, 1.0, uIsVisibility ) );
		pos.x -= 0.08;

		pos.x += easeInOutQuad( 1.0 - uIsVisibility ) * 0.12;

		vAlpha = 1.0;
	#else
		float v = easeInOutQuad( linearstep( 0.0, 1.0, uIsVisibility ) );
		pos.x -= ( 1.0 - v ) * 0.07;
		vAlpha = v;
	#endif

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="90">
<source>src/ts/MainScene/World/Intro/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Logo } from './Logo';
import { CameraController } from './CameraController';
import { IntroGrid } from './IntroGrid';
import { IntroText } from './IntroText';
import EventEmitter from 'wolfy87-eventemitter';
import { IntroUI } from './IntroUI';

export class Intro extends EventEmitter {

	private commonUniforms: ORE.Uniforms;

	private animator: ORE.Animator;

	private ui: IntroUI;

	private renderer: THREE.WebGLRenderer;
	public scene: THREE.Scene;
	public camera: THREE.PerspectiveCamera;
	private cameraController: CameraController;

	public renderTarget: THREE.WebGLRenderTarget;

	private logo: Logo;
	private text1: IntroText;
	private text2: IntroText;
	private text3: IntroText;

	private dirLight: THREE.DirectionalLight;
	private aLight: THREE.AmbientLight;

	public finished: boolean = false;
	private layoutControllerList: ORE.LayoutController[] = [];

	constructor( renderer: THREE.WebGLRenderer, introObj: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		super();

		this.renderer = renderer;

		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color( "#000" );

		this.camera = new THREE.PerspectiveCamera( 38, 16 / 9, 0.01, 1000, );
		this.camera.position.set( 0, 0, 10 );
		this.scene.add( this.camera );

		this.renderTarget = new THREE.WebGLRenderTarget( 1, 1 );

		this.scene.add( introObj );

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			UI
		-------------------------------*/

		this.ui = new IntroUI();

		this.ui.addListener( 'skip', () => {

			this.skip();
			this.emitEvent( 'finish' );

			this.text1.swithVisibility( false );
			this.text2.swithVisibility( false );
			this.text3.swithVisibility( false );

		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.loaded = this.animator.add( {
			name: 'loaded',
			initValue: 0,
			userData: {
				pane: {
					min: 0,
					max: 1
				}
			}
		} );

		this.animator.add( {
			name: 'introLightIntensity',
			initValue: 0,
			easing: ORE.Easings.sigmoid( 1 )
		} );

		/*-------------------------------
			Logo
		-------------------------------*/

		this.logo = new Logo( this.scene.getObjectByName( 'Logo' ) as THREE.Mesh, this.commonUniforms );
		this.logo.addListener( 'showImaging', () => {

			this.animator.animate( 'introLightIntensity', 1, 10 );

		} );

		/*-------------------------------
			Text1
		-------------------------------*/

		this.text1 = new IntroText( this.scene.getObjectByName( 'Text1' ) as THREE.Object3D, this.commonUniforms, 'アイデアとテクノロジーで、世界をもっとハッピーでワクワクしたものに。', document.querySelector( '.intro-text-item.introText1' ) as HTMLElement );
		this.text2 = new IntroText( this.scene.getObjectByName( 'Text2' ) as THREE.Object3D, this.commonUniforms, '理想を現実に。ジュニは、そんな思いで全員でものづくりを行っています。', document.querySelector( '.intro-text-item.introText2' ) as HTMLElement );
		this.text3 = new IntroText( this.scene.getObjectByName( 'Text3' ) as THREE.Object3D, this.commonUniforms, 'そんなジュニのものづくりの理想を、少し、覗いてみませんか？', document.querySelector( '.intro-text-item.introText3' ) as HTMLElement );

		/*-------------------------------
			Scene
		-------------------------------*/

		this.dirLight = new THREE.DirectionalLight();
		this.dirLight.position.set( 1, 1, - 0.0 );
		this.scene.add( this.dirLight );

		this.aLight = new THREE.AmbientLight();
		this.scene.add( this.aLight );

		let introGrid = new IntroGrid( ORE.UniformsLib.mergeUniforms( this.commonUniforms,
			{
				uVisibility: this.animator.getVariableObject( 'introLightIntensity' )!
			}
		) );
		introGrid.position.z = - 1.0;
		this.scene.add( introGrid );

		/*-------------------------------
			CameraController
		-------------------------------*/

		this.cameraController = new CameraController( this.camera );

		/*-------------------------------
			Layout
		-------------------------------*/

		this.layoutControllerList.push( new ORE.LayoutController( this.scene.getObjectByName( 'Wave_Left' )!, {
			position: new THREE.Vector3( 1.7, 0.4, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.scene.getObjectByName( 'Cone' )!, {
			position: new THREE.Vector3( 1.5, - 0.2, 0.0 ),
			scale: 0.8
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.scene.getObjectByName( 'Wave_Right' )!, {
			position: new THREE.Vector3( - 1.5, 0.0, 0.0 ),
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.scene.getObjectByName( 'Torus' )!, {
			position: new THREE.Vector3( - 1.5, - 0.5, 0.0 ),
			scale: 0.6
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.scene.getObjectByName( 'Cube' )!, {
			position: new THREE.Vector3( - 1.0, - 0.5, 0.0 ),
			scale: 0.6
		} ) );

	}

	public hover( args: ORE.TouchEventArgs ) {

		this.cameraController.updateCursor( args.screenPosition );

	}

	public update( deltaTime: number ) {

		if ( this.finished ) return;

		this.logo.update( deltaTime );

		this.cameraController.update( deltaTime );

		let lightIntensity = this.animator.get<number>( 'introLightIntensity' ) || 0;

		this.dirLight.intensity = 0.5 * lightIntensity;
		this.aLight.intensity = 0.05 * lightIntensity;

		this.dirLight.position.y = 1 - ( 1.0 - lightIntensity ) * 2.0;

		let rt = this.renderer.getRenderTarget();
		this.renderer.setRenderTarget( this.renderTarget );
		this.renderer.render( this.scene, this.camera );
		this.renderer.setRenderTarget( rt );

	}

	public async updateLoadState( percentage: number ) {

		this.animator.animate( 'loaded', percentage, 0.5, async () => {

			if ( percentage == 1.0 ) {

				if ( this.finished ) return;

				this.ui.switchSkipVisibility( true );

				await this.logo.start();

				if ( this.finished ) return;

				this.emitEvent( 'showImaging' );

				await this.text1.start();

				if ( this.finished ) return;

				await this.text2.start();

				if ( this.finished ) return;

				setTimeout( () => {

					this.ui.switchSkipVisibility( false );

				}, 1000 );

				await this.text3.start( true );

				this.finished = true;

				this.emitEvent( 'finish' );

			}

		} );

	}

	public resize( info: ORE.LayerInfo ) {

		this.renderTarget.setSize( info.size.canvasPixelSize.x, info.size.canvasPixelSize.y );

		this.camera.aspect = info.size.canvasAspectRatio;
		this.camera.fov = 38 + info.size.portraitWeight * 10.0;
		this.camera.updateProjectionMatrix();

		let isSP = info.size.windowSize.x <= 800;

		this.text1.setEnable( ! isSP );
		this.text2.setEnable( ! isSP );
		this.text3.setEnable( ! isSP );

		this.layoutControllerList.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

	}

	public skip() {

		this.finished = true;

		this.logo.cancel();

	}

}

</document_content>
</document>
<document index="91">
<source>src/ts/MainScene/World/Lights/index.ts</source>
<document_content>
import * as ORE from 'ore-three';
import * as THREE from 'three';
import { Section } from '../Sections/Section';

export class Lights {

	private animator: ORE.Animator;

	private scene: THREE.Scene;

	private light1: THREE.DirectionalLight;
	private light1Taraget: THREE.Object3D;
	private light1Using: boolean = false;

	private light2: THREE.DirectionalLight;
	private light2Taraget: THREE.Object3D;
	private light2Using: boolean = false;


	private helpers: THREE.DirectionalLightHelper[] = [];

	constructor( scene: THREE.Scene ) {

		this.scene = scene;

		this.light1 = new THREE.DirectionalLight();
		scene.add( this.light1 );

		this.light1Taraget = new THREE.Object3D();
		this.scene.add( this.light1Taraget );

		this.light1.target = this.light1Taraget;

		// shadowmap (only light1)

		this.light1.castShadow = true;
		let shadowSize = 10.0;
		this.light1.shadow.blurSamples = 100;
		this.light1.shadow.camera.left = - shadowSize;
		this.light1.shadow.camera.right = shadowSize;
		this.light1.shadow.camera.top = shadowSize;
		this.light1.shadow.camera.bottom = - shadowSize;
		this.light1.shadow.camera.far = 35.0;
		this.light1.shadow.bias = - 0.002;
		this.light1.shadow.mapSize.set( 1024, 1024 );

		this.light2 = new THREE.DirectionalLight();
		scene.add( this.light2 );

		this.light2Taraget = new THREE.Object3D();
		this.scene.add( this.light2Taraget );

		this.light2.target = this.light2Taraget;

		// helpers

		let helper = new THREE.DirectionalLightHelper( this.light1 );

		// scene.add( helper );
		// this.helpers.push( helper );

		helper = new THREE.DirectionalLightHelper( this.light2 );

		// scene.add( helper );
		// this.helpers.push( helper );

		this.animator = window.gManager.animator;

		this.animator.add( {
			name: 'light1Position',
			initValue: new THREE.Vector3(),
			easing: ORE.Easings.easeOutCubic
		} );

		this.animator.add( {
			name: 'light1TargetPosition',
			initValue: new THREE.Vector3(),
			easing: ORE.Easings.easeOutCubic,
		} );

		this.animator.add( {
			name: 'light1Intensity',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic,
		} );

		this.animator.add( {
			name: 'light2Position',
			initValue: new THREE.Vector3(),
			easing: ORE.Easings.easeOutCubic,
		} );

		this.animator.add( {
			name: 'light2TargetPosition',
			initValue: new THREE.Vector3(),
			easing: ORE.Easings.easeOutCubic,
		} );

		this.animator.add( {
			name: 'light2Intensity',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic,
		} );

	}

	public update( deltaTime: number ) {

		this.light1.position.copy( this.animator.get( 'light1Position' ) || new THREE.Vector3() );
		this.light1Taraget.position.copy( this.animator.get( 'light1TargetPosition' ) || new THREE.Vector3() );
		this.light1.intensity = this.animator.get<number>( 'light1Intensity' ) || 0;

		this.light2.position.copy( this.animator.get( 'light2Position' ) || new THREE.Vector3() );
		this.light2Taraget.position.copy( this.animator.get( 'light2TargetPosition' ) || new THREE.Vector3() );
		this.light2.intensity = this.animator.get<number>( 'light2Intensity' ) || 0;

		this.helpers.forEach( item => item.update() );

	}

	public changeSection( section: Section ) {

		if ( section.light1Data ) {

			let lightData = section.light1Data;

			if ( this.light1Using ) {

				this.animator.animate( 'light1Position', lightData.position );
				this.animator.animate( 'light1TargetPosition', lightData.targetPosition );
				this.animator.animate( 'light1Intensity', lightData.intensity );

			} else {

				this.animator.setValue( 'light1Position', lightData.position );
				this.animator.setValue( 'light1TargetPosition', lightData.targetPosition );
				this.animator.setValue( 'light1Intensity', lightData.intensity );

			}

			this.light1Using = true;

		} else {

			this.animator.animate( 'light1Intensity', 0, 1, () => {

				this.light1Using = false;

			} );

		}

		if ( section.light2Data ) {

			let lightData = section.light2Data;

			if ( this.light2Using ) {

				this.animator.animate( 'light2Position', lightData.position );
				this.animator.animate( 'light2TargetPosition', lightData.targetPosition );
				this.animator.animate( 'light2Intensity', lightData.intensity );

			} else {

				this.animator.setValue( 'light2Position', lightData.position );
				this.animator.setValue( 'light2TargetPosition', lightData.targetPosition );
				this.animator.setValue( 'light2Intensity', lightData.intensity );

			}

			this.light2Using = true;

		} else {

			this.animator.animate( 'light2Intensity', 0, 1, () => {

				this.light2Using = false;

			} );

		}


	}

}

</document_content>
</document>
<document index="92">
<source>src/ts/MainScene/World/Sections/Section/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CameraTransform } from '../../../CameraController';
import { LayerInfo } from 'ore-three';
import { PPParam } from '../../../RenderPipeline';
import { BakuMaterialType } from '../../Baku';


export type BakuTransform = {
	position: THREE.Vector3;
	rotation: THREE.Quaternion;
	scale: THREE.Vector3;
}

export type LightData = {
	position: THREE.Vector3;
	targetPosition: THREE.Vector3;
	intensity: number
}

export type ViewingState = 'ready' | 'viewing' | 'passed'

export class Section extends THREE.Object3D {

	public sectionName: string;

	protected commonUniforms: ORE.Uniforms;

	protected elm: HTMLElement | null = null;

	// animation

	protected animator: ORE.Animator;
	protected animationMixer?: THREE.AnimationMixer;
	protected animationList?: THREE.AnimationClip[];
	protected animationActionList: THREE.AnimationAction[] = [];

	// manager

	protected manager: THREE.LoadingManager;

	// light datas

	public light1Data?: LightData;
	public light2Data?: LightData;

	// transforms

	public cameraTransform: CameraTransform = {
		position: new THREE.Vector3(),
		targetPosition: new THREE.Vector3(),
		fov: 50,
		fovCalculated: 50,
	};

	public bakuTransform: BakuTransform = {
		position: new THREE.Vector3(),
		rotation: new THREE.Quaternion(),
		scale: new THREE.Vector3( 1, 1, 1 )
	};

	// state

	public sectionVisibility: boolean = false;
	protected viewing: ViewingState = 'ready';
	public trailDepth = 0.97;

	// pp param

	public ppParam: PPParam = {
		bloomBrightness: 0,
		vignet: 0,
	};

	// baku material

	public bakuParam: {
		materialType: BakuMaterialType,
		rotateSpeed: number
	} = {
			materialType: 'normal',
			rotateSpeed: 0
		};

	// camera weight

	public cameraSPFovWeight: number = 30;
	public cameraRange: THREE.Vector2 = new THREE.Vector2( 0.1, 0.1 );

	constructor( manager: THREE.LoadingManager, sectionName: string, parentUniforms: ORE.Uniforms ) {

		super();

		this.sectionName = sectionName;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.sectionVisibility = false;

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uSectionViewing = this.animator.add( {
			name: 'sectionViewing' + this.sectionName,
			initValue: 0,
			// userData: {
			// 	pane: {
			// 		min: 0,
			// 		max: 2
			// 	}
			// }
		} );

		this.commonUniforms.uSectionVisibility = this.animator.add( {
			name: 'sectionVisibility' + this.sectionName,
			initValue: 0,
			// userData: {
			// 	pane: {
			// 		min: 0,
			// 		max: 1
			// 	}
			// }
		} );

		/*-------------------------------
			Load
		-------------------------------*/

		this.manager = manager;

		this.loadGLTF( this.sectionName );

	}

	protected loadGLTF( gltfName: string ) {

		let loader = new GLTFLoader( this.manager );

		loader.load( './assets/scene/' + gltfName + '.glb', ( gltf ) => {

			// camera transform

			let camera = gltf.scene.getObjectByName( 'Camera' ) as THREE.PerspectiveCamera;

			if ( ! camera.isPerspectiveCamera ) {

				let camera_ = camera.children[ 0 ] as THREE.PerspectiveCamera;
				camera_.position.copy( camera.position );
				camera_.rotation.copy( camera.rotation );
				camera_.scale.copy( camera.scale );

				if ( camera.parent ) {

					camera.parent.add( camera_ );

				}

				camera = camera_;

			}

			if ( camera ) {

				this.cameraTransform.position.copy( camera.position );
				this.cameraTransform.fov = camera.fov;

			}

			let target = gltf.scene.getObjectByName( 'CameraTarget' );

			if ( target ) {

				this.cameraTransform.targetPosition.copy( target.position );

			}


			// baku transform

			let baku = gltf.scene.getObjectByName( 'Baku' ) as THREE.Object3D;

			if ( baku ) {

				this.bakuTransform.position.copy( baku.position );
				this.bakuTransform.rotation.copy( baku.quaternion );
				this.bakuTransform.scale.copy( baku.scale );

			}

			// animations

			this.animationMixer = new THREE.AnimationMixer( gltf.scene );
			this.animations = gltf.animations;

			for ( let i = 0; i < this.animations.length; i ++ ) {

				this.animationActionList.push( this.animationMixer.clipAction( this.animations[ i ] ) );

			}

			this.onLoadedGLTF( gltf );

			// emitevent

			this.dispatchEvent( { type: 'loaded' } );

		} );

	}

	protected onLoadedGLTF( gltf: GLTF ) {
	}

	public switchViewingState( viewing: ViewingState ) {

		this.viewing = viewing;
		this.sectionVisibility = viewing == 'viewing';

		if ( viewing == 'ready' ) {

			this.animator.animate( 'sectionViewing' + this.sectionName, 0 );

		} else if ( viewing == 'viewing' ) {

			this.animator.animate( 'sectionViewing' + this.sectionName, 1 );

		} else if ( viewing == 'passed' ) {

			this.animator.animate( 'sectionViewing' + this.sectionName, 2 );

		}

		if ( this.sectionVisibility ) {

			// this.visible = true;

		}

		this.animator.animate( 'sectionVisibility' + this.sectionName, this.sectionVisibility ? 1 : 0, 1, () => {

			if ( ! this.sectionVisibility ) {

				// this.visible = false;

			}

		} );

		if ( this.elm ) {

			this.elm.setAttribute( 'data-visible', viewing == 'viewing' ? 'true' : 'false' );

		}

	}

	public update( deltaTime: number ) {
	}

	public resize( info: LayerInfo ) {

		this.cameraTransform.fovCalculated = this.cameraTransform.fov + this.cameraSPFovWeight * info.size.portraitWeight;

	}

}

</document_content>
</document>
<document index="93">
<source>src/ts/MainScene/World/Sections/Section1/BakuCollision/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import * as CANNON from 'cannon';

export type PhysicsData = {
	body: CANNON.Body,
	mesh: THREE.Mesh
}

export class BakuCollision extends THREE.Object3D {

	private animator: ORE.Animator;

	private cannonWorld: CANNON.World;
	private commonUniforms: ORE.Uniforms;

	private mesh: THREE.Mesh;
	private body: CANNON.Body;
	private kinematicBody: CANNON.Body;

	constructor( cannonWorld: CANNON.World, parentUniforms: ORE.Uniforms ) {

		super();

		this.cannonWorld = cannonWorld;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;
		this.animator.add( {
			name: 'bakuCollisionPosition',
			initValue: new THREE.Vector3( 0, 1, - 1 ),
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		let radius = 0.35;
		this.mesh = new THREE.Mesh( new THREE.SphereGeometry( radius ), new THREE.MeshNormalMaterial() );
		this.mesh.visible = false;
		this.add( this.mesh );

		this.body = new CANNON.Body( { type: CANNON.Body.DYNAMIC, mass: 1000 } );
		this.body.addShape( new CANNON.Sphere( radius ) );
		this.body.position.copy( this.animator.get( 'bakuCollisionPosition' ) as unknown as CANNON.Vec3 );
		this.body.sleep();
		this.cannonWorld.addBody( this.body );

		this.kinematicBody = new CANNON.Body( { type: CANNON.Body.KINEMATIC } );
		this.kinematicBody.addShape( new CANNON.Sphere( radius * 1.7 ) );
		this.kinematicBody.position.set( 0, 0, - 10 );
		this.cannonWorld.addBody( this.kinematicBody );

		// @ts-ignore
		this.body.name = 'baku';

	}

	public update( deltaTime: number ) {

		this.mesh.position.copy( this.body.position as unknown as THREE.Vector3 );

	}

	public splash() {

		this.body.wakeUp();
		this.body.velocity.set( - 0.5, 1, 7 );

		setTimeout( () => {

			this.animator.animate( 'bakuCollisionPosition', new THREE.Vector3( 0, 1, 0 ), 1 );
			this.kinematicBody.position.set( 0, 1, 0 );

		}, 500 );

	}

}

</document_content>
</document>
<document index="94">
<source>src/ts/MainScene/World/Sections/Section1/Crosses/Cross/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Mesh } from 'three';

import crossVert from './shaders/cross.vs';
import crossFrag from './shaders/cross.fs';

export class Cross extends THREE.Mesh {

	private animatorId: string;
	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;

	constructor( origin: Mesh, parentUniforms: ORE.Uniforms ) {

		let originGeo = origin.geometry;
		let geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute( 'position', originGeo.getAttribute( 'position' ) );
		geo.setAttribute( 'uv', originGeo.getAttribute( 'uv' ) );
		geo.setIndex( originGeo.getIndex() );

		geo.setAttribute( 'offsetPos', new THREE.InstancedBufferAttribute( new Float32Array( [
			0, 0, 0,
			0.2, 0, 0,
			0.4, 0, 0,
		] ), 3 ) );

		geo.setAttribute( 'num', new THREE.InstancedBufferAttribute( new Float32Array( [
			1.0 / 3 * 0,
			1.0 / 3 * 1,
			1.0 / 3 * 2
		] ), 1 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {} );

		let parentId = origin.uuid;
		let animator = window.gManager.animator;

		uni.uRotate = animator.add( {
			name: 'rotate' + parentId,
			initValue: 0,
			easing: ORE.Easings.linear
		} );

		let mat = new THREE.ShaderMaterial( {
			fragmentShader: crossFrag,
			vertexShader: crossVert,
			uniforms: uni
		} );

		super( geo, mat );

		this.animator = animator;
		this.animatorId = parentId;
		this.commonUniforms = uni;

	}

	public rotate() {

		this.animator.setValue( 'rotate' + this.animatorId, 0 );
		this.animator.animate( 'rotate' + this.animatorId, 1, 2, () => {

			this.rotate();

		} );

	}

}

</document_content>
</document>
<document index="95">
<source>src/ts/MainScene/World/Sections/Section1/Crosses/Cross/shaders/cross.fs</source>
<document_content>
uniform float time;
varying vec2 vUv;
varying vec3 vPos;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )
#pragma glslify: random = require('./random.glsl' )

void main( void ) {

	vec3 color = hsv2rgb( vec3( -(vPos.x + vPos.y) * 0.01 + 0.3 + time * 0.1, 1.0, 1.0  ) );
	// color = vec3( 1.0 );
	gl_FragColor = vec4( color, 1.0 );

}
</document_content>
</document>
<document index="96">
<source>src/ts/MainScene/World/Sections/Section1/Crosses/Cross/shaders/cross.vs</source>
<document_content>
attribute vec3 offsetPos;
attribute float num;

varying vec2 vUv;
varying vec3 vPos;

uniform float uRotate;
uniform float uVisibility;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

float easeInOutQuad( float t ) {

	return t < 0.5 ? 2.0 * t * t : -1.0 + ( 4.0 - 2.0 * t ) * t;

}

float easeOutBack(float x) {

	float c1 = 1.70158;
	float c3 = c1 + 1.0;

	return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0);

}

void main( void ) {

	vec3 pos = position;
	pos *= uVisibility;

	float r = easeInOutQuad( smoothstep( 0.0, 1.0, -num + uRotate * 2.0 ) );
	float ru = easeOutBack( linearstep( 0.0, 1.0, -num * 0.5 + uVisibility * 1.5) );

	pos.xy *= rotate( r * PI + ( 1.0 - uVisibility) );

	vec4 mvPosition = modelViewMatrix * vec4( pos + offsetPos, 1.0 );
	mvPosition.y += mvPosition.y * (1.0 - ru) * 2.0;
	// mvPosition.xy *= rotate( -(1.0 - ru) );

	gl_Position = projectionMatrix * mvPosition;

	vPos = mvPosition.xyz + pos * 30.0;
	vUv = uv;

}
</document_content>
</document>
<document index="97">
<source>src/ts/MainScene/World/Sections/Section1/Crosses/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Cross } from './Cross';

export class Crosses {

	private animator: ORE.Animator;

	public root: THREE.Object3D;
	private commonUniforms: ORE.Uniforms;
	private crossList: Cross[] = [];

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );


		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec1CrossesVisibility',
			initValue: 0,
			easing: ORE.Easings.linear
		} );

		root.children.concat().forEach( ( item, i ) => {

			let origin = item as THREE.Mesh;

			let cross = new Cross( origin, this.commonUniforms );
			cross.name = item.name;

			setTimeout( () => {

				cross.rotate();

			}, 500 * i );

			this.crossList.push( cross );

			cross.position.copy( origin.position );
			cross.rotation.copy( origin.rotation );
			cross.scale.copy( origin.scale );

			if ( origin.parent ) {

				origin.parent.add( cross );
				origin.parent.remove( origin );
				origin.visible = false;

			}

		} );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( 'sec1CrossesVisibility', visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="98">
<source>src/ts/MainScene/World/Sections/Section1/Dots/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import dotVert from './shaders/dot.vs';
import dotFrag from './shaders/dot.fs';

export class Dots {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	public root: THREE.Object3D;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {

		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec1DotVisibility',
			initValue: 0,
			easing: ORE.Easings.linear
		} );


		this.root.children.forEach( ( obj, index ) => {

			let mesh = obj as THREE.Mesh;

			if ( mesh.isMesh ) {

				let baseMaterial = mesh.material as THREE.MeshStandardMaterial;

				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: dotVert,
					fragmentShader: dotFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						uColor: {
							value: baseMaterial.emissive
						},
						num: {
							value: index / this.root.children.length
						}
					} ),
					side: THREE.DoubleSide,
					transparent: true
				} );

			}

		} );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( 'sec1DotVisibility', visible ? 1 : 0, 0.5, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="99">
<source>src/ts/MainScene/World/Sections/Section1/Dots/shaders/dot.fs</source>
<document_content>
uniform float time;
uniform float uVisibility;
varying vec2 vUv;
varying vec3 vPos;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )
#pragma glslify: random = require('./random.glsl' )

void main( void ) {

	vec3 color = vec3( 1.0 );
	gl_FragColor = vec4( color, 1.0 );


}
</document_content>
</document>
<document index="100">
<source>src/ts/MainScene/World/Sections/Section1/Dots/shaders/dot.vs</source>
<document_content>
varying vec2 vUv;
varying vec3 vPos;
uniform float uVisibility;
uniform float num;

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

float easeOutBack(float x) {

	float c1 = 1.70158;
	float c3 = c1 + 1.0;

	return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0);

}

void main( void ) {

	vec3 pos = position;

	float v = easeOutBack( linearstep( 0.0, 1.0, -num + uVisibility * 1.5) );
	pos *= v;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="101">
<source>src/ts/MainScene/World/Sections/Section1/Gradation/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import gradationVert from './shaders/gradation.vs';
import gradationFrag from './shaders/gradation.fs';

export class Gradation {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	public root: THREE.Object3D;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {

		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec1GradVisibility',
			initValue: 0,
			easing: ORE.Easings.linear
		} );


		this.root.children.forEach( ( obj, index ) => {

			let mesh = obj as THREE.Mesh;

			if ( mesh.isMesh ) {

				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: gradationVert,
					fragmentShader: gradationFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						num: {
							value: index / this.root.children.length
						}
					} ),
					transparent: true,
				} );

			}

		} );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( 'sec1GradVisibility', visible ? 1 : 0, 0.5, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="102">
<source>src/ts/MainScene/World/Sections/Section1/Gradation/shaders/gradation.fs</source>
<document_content>
uniform float time;
varying vec2 vUv;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )
#pragma glslify: random = require('./random.glsl' )

void main( void ) {

	vec3 color = hsv2rgb( vec3( -vUv.x * 0.2 + 0.3 + time * 0.1 + random( gl_FragCoord.xy * 0.01 ) * 0.02, 0.95, 1.0  ) );
	gl_FragColor = vec4( color, 1.0 );

}
</document_content>
</document>
<document index="103">
<source>src/ts/MainScene/World/Sections/Section1/Gradation/shaders/gradation.vs</source>
<document_content>
uniform float uVisibility;
uniform float num;
varying vec2 vUv;

#pragma glslify: rotate = require('./rotate.glsl' )

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

float easeOutBack(float x) {

	float c1 = 1.70158;
	float c3 = c1 + 1.0;

	return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0);

}

void main( void ) {

	vec3 pos = position;

	float v = easeOutBack( linearstep( 0.0, 1.0, -num + uVisibility * 1.5) );
	pos *= v;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

	// mvPosition.xy *= rotate( -1.0 + v );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="104">
<source>src/ts/MainScene/World/Sections/Section1/Lines/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import lineVert from './shaders/line.vs';
import lineFrag from './shaders/line.fs';
import { ViewingState } from '../../Section';

export class Lines {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	public root: THREE.Object3D;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {

		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec1LineVisibility',
			initValue: 0,
			// easing: ORE.Easings.linear
		} );


		this.root.children.forEach( ( obj, index ) => {

			let mesh = obj as THREE.Mesh;

			if ( mesh.isMesh ) {

				let rot = mesh.rotation.clone();
				mesh.rotation.set( 0, 0, 0 );
				let len = new THREE.Box3().setFromObject( mesh ).getSize( new THREE.Vector3() );
				mesh.rotation.copy( rot );


				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: lineVert,
					fragmentShader: lineFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						num: {
							value: index / this.root.children.length
						},
						len: {
							value: len.y
						}
					} ),
					transparent: true,
				} );

			}

		} );

	}

	public switchVisibility( viewing: ViewingState ) {

		let visible = viewing == 'viewing';

		if ( visible ) this.root.visible = true;

		let v = 0.0;

		let current = this.animator.get<number>( 'sec1LineVisibility' ) || 0;

		if ( viewing == 'viewing' ) {

			let f = Math.ceil( current );
			v = f + ( f + 1 ) % 2;

			if ( v == 0.0 ) v ++;

		}

		if ( viewing == 'passed' ) {

			let f = Math.ceil( current );
			v = f + f % 2;

		}

		this.animator.animate( 'sec1LineVisibility', v, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="105">
<source>src/ts/MainScene/World/Sections/Section1/Lines/shaders/line.fs</source>
<document_content>
uniform float time;
varying vec2 vUv;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )
#pragma glslify: random = require('./random.glsl' )

void main( void ) {

	vec3 color = vec3( 1.0 );
	gl_FragColor = vec4( color, 1.0 );

}
</document_content>
</document>
<document index="106">
<source>src/ts/MainScene/World/Sections/Section1/Lines/shaders/line.vs</source>
<document_content>
uniform float uVisibility;
varying vec2 vUv;

uniform float time;
uniform float len;

#pragma glslify: rotate = require('./rotate.glsl' )

void main( void ) {

	vec3 pos = position;

	float v = mod( uVisibility, 2.0 );

	if( v <= 1.0 ) {

		pos.y *= v;

	} else {
		pos.y += len;
		pos.y *= 2.0 - v;
		pos.y -= len;
	}


	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="107">
<source>src/ts/MainScene/World/Sections/Section1/Logo/LogoPart/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import logoVert from './shaders/logo.vs';
import logoFrag from './shaders/logo.fs';

export class LogoPart {

	private commonUniforms: ORE.Uniforms;

	public mesh: THREE.Mesh;

	// position

	private basePosition: THREE.Vector3;
	private transformedPosition: THREE.Vector3;
	private transformedWorldPosition: THREE.Vector3;

	private velocity: THREE.Vector3;
	private time = 0.0;
	private offset: number = 0.0;

	public spTransform?: ORE.Transform;

	constructor( mesh: THREE.Mesh, offset: number, parentUniforms: ORE.Uniforms ) {

		this.offset = offset;
		this.time -= this.offset * 5.0;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.mesh = mesh;
		let baseMaterial = mesh.material as THREE.MeshStandardMaterial;

		let mat = new THREE.ShaderMaterial( {
			vertexShader: logoVert,
			fragmentShader: logoFrag,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uColor: {
					value: baseMaterial.emissive.convertLinearToSRGB()
				},
				uMatCapTex: window.gManager.assetManager.getTex( 'matCap' ),
				num: {
					value: 1.0 - this.offset
				}
			} ),
			side: THREE.DoubleSide
		} );

		this.mesh.material = mat;

		this.basePosition = this.mesh.position.clone();
		this.transformedPosition = this.basePosition.clone();
		this.transformedWorldPosition = this.mesh.getWorldPosition( new THREE.Vector3() );
		this.velocity = new THREE.Vector3();

	}


	public update( deltaTime: number ) {

		this.time += deltaTime;

		this.velocity.add( this.transformedPosition.clone().sub( this.mesh.position ).multiplyScalar( deltaTime ) );
		this.velocity.y += Math.sin( this.time ) * 0.002;
		this.velocity.multiplyScalar( 0.9 );

		this.mesh.position.add( this.velocity );

	}

	public hover( args: ORE.TouchEventArgs, camera: THREE.PerspectiveCamera ) {

		let screenPos = this.transformedWorldPosition.clone().applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

		// @ts-ignore
		let d = args.screenPosition.distanceTo( new THREE.Vector2( screenPos.x, screenPos.y ) );

		this.velocity.add( new THREE.Vector3( args.delta.x, - args.delta.y ).multiplyScalar( 0.001 * Math.max( 0.0, 1.0 - d * 2.0 ) ) );

	}

	public resize( info: ORE.LayerInfo ) {

		if ( this.spTransform ) {

			let transformPosition = this.spTransform.position;

			if ( transformPosition ) {

				this.transformedPosition.copy( this.basePosition.clone().add( transformPosition.clone().multiplyScalar( info.size.portraitWeight ) ) );

				let parent = this.mesh.parent || this.mesh;
				this.transformedWorldPosition = this.transformedPosition.clone().applyMatrix4( parent.matrixWorld );

			}

		}

	}

}

</document_content>
</document>
<document index="108">
<source>src/ts/MainScene/World/Sections/Section1/Logo/LogoPart/shaders/logo.fs</source>
<document_content>
uniform vec3 uColor;
varying vec3 vNormal;

uniform sampler2D uMatCapTex;

varying vec2 vUv;

void main( void ) {

	vec3 normal = normalize( vNormal );
	vec3 col = texture2D( uMatCapTex, vec2( normal.x, normal.y ) * 0.95 * 0.5 + 0.5 ).xyz;
	// col = vec3( 1.0 );

	gl_FragColor = vec4( col, 1.0 );

}
</document_content>
</document>
<document index="109">
<source>src/ts/MainScene/World/Sections/Section1/Logo/LogoPart/shaders/logo.vs</source>
<document_content>
uniform float uVisibility;
uniform float num;
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;

#pragma glslify: rotate = require('./rotate.glsl' )

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

float easeOutBack(float x) {

	float c1 = 1.70158;
	float c3 = c1 + 1.0;

	return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0);

}

void main( void ) {

	float r = 1.0 - easeOutBack( linearstep( 0.0, 1.0, -num * 0.5 + uVisibility * 1.5) );
	vec3 pos = position;
	// pos.xy *= rotate( r );
	pos *= 1.0 - r;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	mvPosition.xy *= rotate( (-r) * 1.0);
	mvPosition.xy *= 1.0 - r * 0.5;

	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vNormal = normalMatrix * normal;

}
</document_content>
</document>
<document index="110">
<source>src/ts/MainScene/World/Sections/Section1/Logo/index.ts</source>
<document_content>
import * as ORE from 'ore-three';
import * as THREE from 'three';

import { LogoPart } from './LogoPart';

export class Logo {

	private animator: ORE.Animator;

	private commonUniforms: ORE.Uniforms;
	private root: THREE.Object3D;
	private meshList: LogoPart[] = [];

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec1LogoVisibility',
			initValue: 0,
			easing: ORE.Easings.linear
		} );

		this.root.children.forEach( ( obj, index ) => {

			let mesh = obj as THREE.Mesh;

			if ( mesh.isMesh ) {

				let part = new LogoPart( mesh, index / this.root.children.length, this.commonUniforms );
				this.meshList.push( part );

			}

		} );

		this.meshList.find( item => item.mesh.name == 'LogoPart_1' )!.spTransform = {
			position: new THREE.Vector3( 1, 1.3, 0.0 )
		};

		this.meshList.find( item => item.mesh.name == 'LogoPart_2' )!.spTransform = {
			position: new THREE.Vector3( 1.5, 0.3, 0.0 )
		};

		this.meshList.find( item => item.mesh.name == 'LogoPart_3' )!.spTransform = {
			position: new THREE.Vector3( - 0.7, 0.5, 0.0 )
		};

		this.meshList.find( item => item.mesh.name == 'LogoPart_4' )!.spTransform = {
			position: new THREE.Vector3( - 1.5, - 2.3, 0.0 )
		};

		this.meshList.find( item => item.mesh.name == 'LogoPart_5' )!.spTransform = {
			position: new THREE.Vector3( - 2.0, - 3.0, 0.0 )
		};

	}

	public update( deltaTime: number ) {

		if ( ! this.root.visible ) return;

		this.meshList.forEach( item => {

			item.update( deltaTime );

		} );

	}

	public hover( args: ORE.TouchEventArgs, camera: THREE.PerspectiveCamera ) {

		this.meshList.forEach( item => {

			item.hover( args, camera );

		} );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( 'sec1LogoVisibility', visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

	public resize( info: ORE.LayerInfo ) {

		this.meshList.forEach( item=> {

			item.resize( info );

		} );

	}

}

</document_content>
</document>
<document index="111">
<source>src/ts/MainScene/World/Sections/Section1/Slashes/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import slashVert from './shaders/slash.vs';
import slashFrag from './shaders/slash.fs';

export class Slashes {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	private root: THREE.Object3D;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {

		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec1SlashVisibile',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );


		this.root.children.forEach( ( obj, index ) => {

			let mesh = obj as THREE.Mesh;

			if ( mesh.isMesh ) {

				let baseMaterial = mesh.material as THREE.MeshStandardMaterial;

				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: slashVert,
					fragmentShader: slashFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						uColor: {
							value: baseMaterial.emissive
						}
					} ),
					side: THREE.DoubleSide,
					transparent: true,
				} );

			}

		} );

	}

	private timer: number | null = null;

	public switchVisibility( visible: boolean ) {

		if ( this.timer != null ) {

			window.clearTimeout( this.timer );
			this.timer = null;

		}

		let wait = visible ? 500 : 0;

		this.timer = window.setTimeout( () => {

			if ( visible ) this.root.visible = true;

			this.animator.animate( 'sec1SlashVisibile', visible ? 1 : 0, 0.5, () => {

				if ( ! visible ) this.root.visible = false;

			} );

			this.timer = null;

		}, wait );


	}

}

</document_content>
</document>
<document index="112">
<source>src/ts/MainScene/World/Sections/Section1/Slashes/shaders/slash.fs</source>
<document_content>
uniform float time;
uniform float uVisibility;
varying vec2 vUv;
varying vec3 vPos;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )
#pragma glslify: random = require('./random.glsl' )

void main( void ) {

	if( step( -1.0 + uVisibility, sin( vUv.x * 30.0 - time * 3.0 ) ) > 0.0 ) discard;
	vec3 color = vec3( 1.0 );
	gl_FragColor = vec4( color, 0.7 );


}
</document_content>
</document>
<document index="113">
<source>src/ts/MainScene/World/Sections/Section1/Slashes/shaders/slash.vs</source>
<document_content>
varying vec2 vUv;
varying vec3 vPos;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="114">
<source>src/ts/MainScene/World/Sections/Section1/Wall/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import * as CANNON from 'cannon';

import wallVert from './shaders/wall.vs';
import wallFrag from './shaders/wall.fs';

export type PhysicsData = {
	body: CANNON.Body,
	mesh: THREE.Mesh,
	material: THREE.ShaderMaterial
}

export class Wall extends THREE.Object3D {

	private animator: ORE.Animator;

	private cannonWorld: CANNON.World;
	private commonUniforms: ORE.Uniforms;

	private physics: PhysicsData[] = [];

	private disposed: boolean = false;
	private animating: boolean = true;

	constructor( cannonWorld: CANNON.World, parentUniforms: ORE.Uniforms ) {

		super();

		this.cannonWorld = cannonWorld;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			tex: {
				value: null
			},
			uNoiseTex: window.gManager.assetManager.getTex( 'noise' )
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'wallVisibility',
			initValue: 1,
		} );

	}

	public setTex( texture: THREE.Texture ) {

		this.commonUniforms.tex.value = texture;

	}

	public init( camera: THREE.PerspectiveCamera ) {

		let parent = this;
		let distance = 2.0;

		let height = Math.tan( camera.fov / 2 * THREE.MathUtils.DEG2RAD ) * 2.0 * distance;
		let width = height * camera.aspect;

		let cameraWorldPos = camera.getWorldPosition( new THREE.Vector3() );
		let position = parent.worldToLocal( cameraWorldPos.clone().add( camera.getWorldDirection( new THREE.Vector3() ).normalize().multiplyScalar( distance ) ) );

		let mesh = new THREE.Mesh( new THREE.PlaneGeometry( width, height ), new THREE.MeshNormalMaterial( { wireframe: true } ) );
		mesh.position.copy( position );
		mesh.lookAt( parent.worldToLocal( cameraWorldPos ) );

		/*-------------------------------
			Mesh
		-------------------------------*/

		let globalSize = new THREE.Vector3( width, height, 0.15 );
		let res = new THREE.Vector2( globalSize.x, globalSize.y ).multiplyScalar( 5 ).round();
		let size = new THREE.Vector2( globalSize.x / res.x, globalSize.y / res.y );

		for ( let i = 0; i < res.x; i ++ ) {

			for ( let j = 0; j < res.y; j ++ ) {

				let geo = new THREE.BoxGeometry( size.x, size.y, globalSize.z );

				let uv = geo.getAttribute( 'uv' );
				uv.applyMatrix4( new THREE.Matrix4().makeScale( 1.0 / res.x, 1.0 / res.y, 1 ) );
				uv.applyMatrix4( new THREE.Matrix4().makeTranslation( 1.0 / res.x * i, 1.0 / res.y * j, 0.0 ) );

				let boxBody = new CANNON.Body( {
					mass: 1,
					allowSleep: true,
				} );

				let boxMat = new THREE.ShaderMaterial( {
					vertexShader: wallVert,
					fragmentShader: wallFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						velocity: {
							value: boxBody.velocity
						}
					} ),
				} );

				let boxMesh = new THREE.Mesh( geo, boxMat );
				this.add( boxMesh );

				boxBody.sleep();
				boxBody.sleepSpeedLimit = 0.1;
				boxBody.sleepTimeLimit = 1;

				let pos = new THREE.Vector3( size.x / 2 + i * size.x - ( globalSize.x / 2 ), size.y / 2 + j * size.y - ( globalSize.y / 2 ), - globalSize.z / 2 );
				pos.applyQuaternion( mesh.quaternion );
				pos.add( mesh.position );

				// @ts-ignore
				boxBody.name = i + '-' + j;
				boxBody.position.set( pos.x, pos.y, pos.z );
				boxBody.quaternion.copy( mesh.quaternion as unknown as CANNON.Quaternion );
				boxBody.addShape( new CANNON.Box( new CANNON.Vec3( size.x / 2, size.y / 2, globalSize.z ) ) );

				this.cannonWorld.addBody( boxBody );

				this.physics.push( {
					mesh: boxMesh,
					body: boxBody,
					material: boxMat
				} );

			}

		}

	}

	public update( deltaTime: number ) {

		if ( ! this.animating ) return;

		for ( let i = 0; i < this.physics.length; i ++ ) {

			let mesh = this.physics[ i ].mesh;
			let body = this.physics[ i ].body;
			let mat = this.physics[ i ].material;

			mesh.position.copy( body.position as unknown as THREE.Vector3 );
			mesh.quaternion.copy( body.quaternion as unknown as THREE.Quaternion );

		}

	}

	public dispose() {

		if ( this.disposed ) return;

		this.animator.animate( 'wallVisibility', 0, 1, () => {

			this.visible = false;
			this.animating = false;

			this.physics.forEach( item => {

				this.remove( item.mesh );
				item.mesh.geometry.dispose();
				item.material.dispose();

			} );

			this.physics.length = 0;

		} );

	}

}

</document_content>
</document>
<document index="115">
<source>src/ts/MainScene/World/Sections/Section1/Wall/shaders/wall.fs</source>
<document_content>
uniform sampler2D tex;
uniform sampler2D uNoiseTex;
uniform float uVisibility;
uniform float time;
varying vec2 vUv;
varying vec3 vNormal;
varying float vTexBlend;
uniform vec3 velocity;

#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )

void main( void ) {

	vec3 sceneCol = texture2D( tex, vUv ).xyz;

	vec4 n1 = texture2D( uNoiseTex, vUv * 0.05 + time * 0.01);
	vec4 noise = texture2D( uNoiseTex, vUv * 0.3 + n1.xy * 0.1 );
	vec3 noiseCol = hsv2rgb( vec3( 0.2 + noise.x * 0.9, smoothstep( 0.2, 0.70, noise.z ) * 0.9, 1.0 ) ) * 1.8;

	vec3 col = mix( noiseCol, sceneCol, vTexBlend );

	// col = noiseCol;

	vec3 normal = normalize( vNormal );

	vec3 outCol = col;

	gl_FragColor = vec4( outCol, 1.0 );

}
</document_content>
</document>
<document index="116">
<source>src/ts/MainScene/World/Sections/Section1/Wall/shaders/wall.vs</source>
<document_content>
varying vec2 vUv;
varying vec3 vNormal;
varying float vTexBlend;
uniform vec3 velocity;
uniform float uVisibility;

void main( void ) {

	vec3 pos = position;
	pos *= uVisibility;
	// pos *= velocity;
	// pos *= 1.0 - pow(smoothstep( 0.0, 4.0, length( velocity) ), 2.0 ) * 0.5;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

	vNormal = normalMatrix * normal;
	vTexBlend = normal.z >= 1.0 ? 1.0 : 0.0;

}
</document_content>
</document>
<document index="117">
<source>src/ts/MainScene/World/Sections/Section1/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import * as CANNON from 'cannon';

import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Section, ViewingState } from '../Section';
import { Wall } from './Wall';
import { BakuCollision } from './BakuCollision';
import { Logo } from './Logo';
import { Crosses } from './Crosses';
import { Gradation } from './Gradation';
import { Lines } from './Lines';
import { Slashes } from './Slashes';
import { Dots } from './Dots';

export class Section1 extends Section {

	private bakuStartPos: THREE.Vector3;
	private bakuGoalPos: THREE.Vector3;

	private cannonWorld: CANNON.World;
	private bakuCollision: BakuCollision;

	// objects

	public wall: Wall;
	private logo?: Logo;
	private crosses?: Crosses;
	private gradation?: Gradation;
	private lines?: Lines;
	private slashes?: Slashes;
	private dots?: Dots;

	// layout

	private layoutControllerList: ORE.LayoutController[] = [];

	// state

	private layerInfo: ORE.LayerInfo | null = null;
	public splashed: boolean = false; //ここがtrueにならないとswitchVisivilityがきかない( splash後にボヨンしたいから )

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms ) {

		super( manager, 'section_1', parentUniforms );

		// params

		this.cameraRange.set( 0.01, 0.01 );
		this.elm = document.querySelector( '.section1' ) as HTMLElement;
		this.ppParam.vignet = 0.7;
		this.trailDepth = 0.95;
		this.cameraSPFovWeight = 25;

		// baku

		this.bakuStartPos = new THREE.Vector3();
		this.bakuGoalPos = new THREE.Vector3();

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator.add( {
			name: 'bakuSplash',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		/*-------------------------------
			Light
		-------------------------------*/

		this.light1Data = {
			intensity: 1,
			position: new THREE.Vector3( 1.0, 1.0, 1.0 ),
			targetPosition: new THREE.Vector3( 0, 0, 0 ),
		};

		this.light2Data = {
			intensity: 1,
			position: new THREE.Vector3( 3, - 1, 1 ),
			targetPosition: new THREE.Vector3( 0, 0, 0 ),
		};

		/*-------------------------------
			Physics
		-------------------------------*/

		this.cannonWorld = new CANNON.World();
		this.cannonWorld.gravity.set( 0.0, - 2.0, 0.0 );
		this.cannonWorld.solver.iterations = 10;
		this.cannonWorld.allowSleep = true;

		this.cannonWorld.defaultContactMaterial.contactEquationStiffness = 5e6;
		this.cannonWorld.defaultContactMaterial.contactEquationRelaxation = 3;

		/*-------------------------------
			BakuCollision
		-------------------------------*/

		this.bakuCollision = new BakuCollision( this.cannonWorld, this.commonUniforms );
		this.add( this.bakuCollision );

		/*-------------------------------
			Wall
		-------------------------------*/

		this.wall = new Wall( this.cannonWorld, this.commonUniforms );
		this.add( this.wall );

	}

	protected onLoadedGLTF( gltf: GLTF ): void {

		let scene = gltf.scene;
		this.add( scene );

		this.bakuStartPos.set( 0, 1, - 2 );
		this.bakuGoalPos.copy( this.bakuTransform.position );
		this.bakuTransform.position.copy( this.bakuStartPos );

		if ( this.splashed ) {

			this.bakuTransform.position.copy( this.bakuGoalPos );

		}

		/*-------------------------------
			Logo
		-------------------------------*/

		this.logo = new Logo( scene.getObjectByName( 'Logo' ) as THREE.Object3D, this.commonUniforms );
		this.logo.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			crosses
		-------------------------------*/

		this.crosses = new Crosses( this.getObjectByName( 'Crosses' ) as THREE.Object3D, this.commonUniforms );
		this.crosses.switchVisibility( this.sectionVisibility );

		this.layoutControllerList.push( new ORE.LayoutController( this.crosses.root.getObjectByName( 'Cross_Right' )!, {
			position: new THREE.Vector3( - 0.3, 0.4, 0.0 ),
			scale: 0.8
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.crosses.root.getObjectByName( 'Cross_Left' )!, {
			position: new THREE.Vector3( 0.4, - 0.6, 0.0 ),
			scale: 0.8
		} ) );

		/*-------------------------------
			Gradations
		-------------------------------*/

		this.gradation = new Gradation( this.getObjectByName( 'Gradations' ) as THREE.Object3D, this.commonUniforms );
		this.gradation.switchVisibility( this.sectionVisibility );

		this.layoutControllerList.push( new ORE.LayoutController( this.gradation.root.getObjectByName( 'Gradation_RightTop' )!, {
			position: new THREE.Vector3( - 3.0, 2.0, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.gradation.root.getObjectByName( 'Gradation_LeftBottom' )!, {
			position: new THREE.Vector3( 3.0, - 4.0, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.gradation.root.getObjectByName( 'Gradation_RightBottom' )!, {
			position: new THREE.Vector3( - 2.0, - 3.0, 0.0 )
		} ) );

		/*-------------------------------
			Lines
		-------------------------------*/

		this.lines = new Lines( this.getObjectByName( 'Lines' ) as THREE.Object3D, this.commonUniforms );
		this.lines.switchVisibility( this.viewing );

		this.layoutControllerList.push( new ORE.LayoutController( this.lines.root, {
			scale: 0.6,
			position: new THREE.Vector3( 0.0, - 0.2, 0.0 )
		} ) );

		/*-------------------------------
			Slash
		-------------------------------*/

		this.slashes = new Slashes( this.getObjectByName( 'Slashes' ) as THREE.Object3D, this.commonUniforms );
		this.slashes.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Dots
		-------------------------------*/

		this.dots = new Dots( this.getObjectByName( 'Dots' ) as THREE.Object3D, this.commonUniforms );
		this.dots.switchVisibility( this.sectionVisibility );

		this.layoutControllerList.push( new ORE.LayoutController( this.dots.root.getObjectByName( 'Dots_RightTop' )!, {
			position: new THREE.Vector3( - 5.0, 3, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.dots.root.getObjectByName( 'Dots_RightBottom' )!, {
			position: new THREE.Vector3( - 2.0, - 1.5, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.dots.root.getObjectByName( 'Dots_LeftBottom' )!, {
			position: new THREE.Vector3( 3.0, - 3.5, 0.0 )
		} ) );

		// resize

		if ( this.layerInfo ) {

			this.resize( this.layerInfo );

		}

	}

	public update( deltaTime: number ): void {

		if ( this.wall.visible ) {

			this.cannonWorld.step( deltaTime );

			this.bakuCollision.update( deltaTime );
			this.wall.update( deltaTime );

		}

		if ( this.animator.isAnimatingVariable( 'bakuSplash' ) ) {

			this.bakuTransform.position.copy( this.bakuStartPos.clone().lerp( this.bakuGoalPos, this.animator.get<number>( 'bakuSplash' ) || 0 ) );

		}

		if ( this.animationMixer ) {

			this.animationMixer.update( deltaTime );

		}

		if ( this.logo ) {

			this.logo.update( deltaTime );

		}

	}

	public splash() {

		this.splashed = true;
		this.animator.animate( 'bakuSplash', 1, 1 );

		this.animationActionList.forEach( action => {

			action.setLoop( THREE.LoopOnce, 1 );
			action.clampWhenFinished = true;
			action.play();

		} );

		this.bakuCollision.splash();

	}

	public hover( args: ORE.TouchEventArgs, camera: THREE.PerspectiveCamera ) {

		if ( this.logo ) {

			this.logo.hover( args, camera );

		}

	}


	public resize( info: ORE.LayerInfo ) {

		super.resize( info );

		this.layerInfo = info;

		// baku layout

		let baku = this.getObjectByName( 'Baku' );

		if ( baku ) {

			this.bakuGoalPos.copy( baku.position.clone().add( new THREE.Vector3( info.size.portraitWeight * 0.2, 0.0, 0.0 ) ) );
			this.bakuTransform.position.copy( this.bakuStartPos.clone().lerp( this.bakuGoalPos, this.animator.get<number>( 'bakuSplash' ) || 0 ) );

		}

		// object layout

		this.layoutControllerList.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

		// logo layout

		if ( this.logo ) this.logo.resize( this.layerInfo );


	}

	public switchViewingState( viewing: ViewingState ): void {

		if ( ! this.splashed ) return;

		super.switchViewingState( viewing );

		if ( this.logo ) this.logo.switchVisibility( this.sectionVisibility );
		if ( this.gradation ) this.gradation.switchVisibility( this.sectionVisibility );
		if ( this.lines ) this.lines.switchVisibility( viewing );
		if ( this.slashes ) this.slashes.switchVisibility( this.sectionVisibility );
		if ( this.crosses ) this.crosses.switchVisibility( this.sectionVisibility );
		if ( this.dots ) this.dots.switchVisibility( this.sectionVisibility );

	}

}

</document_content>
</document>
<document index="118">
<source>src/ts/MainScene/World/Sections/Section2/Flexible/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import flexibleVert from './shaders/flexible.vs';
import flexibleFrag from './shaders/flexible.fs';

export class Flexible {

	private commonUniforms: ORE.Uniforms;

	private animator: ORE.Animator;

	public mesh: THREE.Mesh;

	private layoutControllerList: ORE.LayoutController[] = [];

	constructor( mesh: THREE.Mesh, parentUniforms: ORE.Uniforms ) {

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'flexibleVisibility',
			initValue: 0
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		this.mesh = mesh;

		this.mesh.traverse( obj => {

			let mesh = obj as THREE.Mesh;
			if ( mesh.isMesh ) {

				let baseMat = mesh.material as THREE.MeshStandardMaterial;

				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: flexibleVert,
					fragmentShader: flexibleFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						uTex: {
							value: baseMat.map
						}
					} ),
					depthTest: true,
					depthWrite: false,
					transparent: true,
				} );

				mesh.renderOrder = 2;

			}

		} );

		this.layoutControllerList.push( new ORE.LayoutController( this.mesh.getObjectByName( 'text01' )!, {
			position: new THREE.Vector3( 0.0, 1.2, 0.0 ),
			scale: 1.3
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.mesh.getObjectByName( 'text02' )!, {
			position: new THREE.Vector3( 0.0, - 1.2, 0.0 ),
			scale: 1.3
		} ) );

	}

	public switchVisibility( visible: boolean, duration: number = 1 ) {

		if ( visible ) this.mesh.visible = true;

		this.animator.animate( 'flexibleVisibility', visible ? 1 : 0, duration, () => {

			if ( ! visible ) this.mesh.visible = false;

		} );

	}

	public resize( info: ORE.LayerInfo ) {

		this.layoutControllerList.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

	}

}

</document_content>
</document>
<document index="119">
<source>src/ts/MainScene/World/Sections/Section2/Flexible/shaders/flexible.fs</source>
<document_content>
uniform sampler2D uTex;
varying vec2 vUv;
uniform float time;
uniform float uVisibility;

void main( void ) {

	vec4 col = texture2D( uTex, vUv );
	col.w *= uVisibility;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="120">
<source>src/ts/MainScene/World/Sections/Section2/Flexible/shaders/flexible.vs</source>
<document_content>
varying vec2 vUv;
uniform float uSectionViewing;

void main( void ) {

	vec3 pos = position;
	pos.xy -= (-1.0 + uSectionViewing) * vec2( 3.0, 0.6 );

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="121">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import titleContainerVert from './shaders/titleContainer.vs';
import titleContainerFrag from './shaders/titleContainer.fs';

import titleBackgroundVert from './shaders/titleBackground.vs';
import titleBackgroundFrag from './shaders/titleBackground.fs';

import titleTextVert from './shaders/titleText.vs';
import titleTextFrag from './shaders/titleText.fs';

export class Section2Title {

	private commonUniforms: ORE.Uniforms;
	private root: THREE.Object3D;

	private container: THREE.Mesh;
	private bg: THREE.Mesh;
	private text: THREE.Object3D;
	private animator: ORE.Animator;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'section2TitleVisibility',
			initValue: 0,
		} );

		/*-------------------------------
			Container
		-------------------------------*/

		this.container = root.getObjectByName( 'TitleContainer' ) as THREE.Mesh;

		this.container.material = new THREE.ShaderMaterial( {
			fragmentShader: titleContainerFrag,
			vertexShader: titleContainerVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			} ),
			transparent: true,
		} );

		this.container.renderOrder = 999;

		/*-------------------------------
			BG
		-------------------------------*/

		this.bg = root.getObjectByName( 'Background' ) as THREE.Mesh;

		this.bg.material = new THREE.ShaderMaterial( {
			fragmentShader: titleBackgroundFrag,
			vertexShader: titleBackgroundVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			} ),
			transparent: true,
		} );
		this.bg.renderOrder = 2;

		/*-------------------------------
			Text
		-------------------------------*/

		this.text = root.getObjectByName( 'TitleText' ) as THREE.Object3D;
		this.text.children.forEach( obj => {

			let mesh = obj as THREE.Mesh;

			if ( mesh.isMesh ) {

				mesh.material = new THREE.ShaderMaterial( {
					vertexShader: titleTextVert,
					fragmentShader: titleTextFrag,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms )
				} );

			}

		} );


	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( 'section2TitleVisibility', visible ? 1.0 : 0.0, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

	public update( deltaTime: number ) {

		this.container.rotateX( deltaTime * 0.3 );

	}

}

</document_content>
</document>
<document index="122">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/shaders/titleBackground.fs</source>
<document_content>
varying vec2 vUv;
uniform float uVisibility;

void main( void ) {

	vec3 col = vec3( 0.0 );
	float alpha = uVisibility;

	gl_FragColor = vec4( col, alpha );

}
</document_content>
</document>
<document index="123">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/shaders/titleBackground.vs</source>
<document_content>
uniform float uVisibility;

varying vec2 vUv;

void main( void ) {

	vec3 pos = position;
	pos.y *= uVisibility;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;

}
</document_content>
</document>
<document index="124">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/shaders/titleContainer.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform samplerCube uEnvMap;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}

/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform vec2 winResolution;

/*-------------------------------
	Textures
-------------------------------*/

uniform sampler2D uSceneTex;
uniform sampler2D uBackSideNormalTex;

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif

#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

float fresnel( float d ) {

	float f0 = 0.15;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;

	#ifdef USE_MAP

		vec4 color = LinearTosRGB( texture2D( map, vUv ) );
		mat.albedo = color.xyz;
		mat.opacity = color.w;

	#else

		mat.albedo = color.xyz;
		mat.opacity = 1.0;

	#endif

	#ifdef USE_ROUGHNESS_MAP

		mat.roughness = texture2D( roughnessMap, vUv ).y;

	#else

		mat.roughness = roughness;

	#endif

	#ifdef USE_METALNESS_MAP

		mat.metalness = texture2D( metalnessMap, vUv ).z;

	#else

		mat.metalness = metalness;

	#endif

	#ifdef USE_ALPHA_MAP

		mat.opacity = texture2D( alphaMap, vUv ).x;

	#else

		mat.opacity *= opacity;

	#endif

	// if( mat.opacity < 0.5 ) discard;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Refract
	-------------------------------*/

	vec3 refractCol = vec3( 0.0 );
	vec2 screenUv = gl_FragCoord.xy / winResolution.xy;
	vec2 refractUv = screenUv;
	float slide;
	vec2 refractUvR;
	vec2 refractUvG;
	vec2 refractUvB;
	float refractPower = 0.1;
	vec2 refractNormal = geo.normal.xy * ( 1.0 - geo.normal.z * 0.9 );

	#pragma unroll_loop_start
	for ( int i = 0; i < 16; i ++ ) {

		slide = float( UNROLLED_LOOP_INDEX ) / 16.0 * 0.04 + random( screenUv ) * 0.004;

		refractUvR = refractUv + refractNormal * ( refractPower + slide * 1.0 );
		refractUvG = refractUv + refractNormal * ( refractPower + slide * 2.0 );
		refractUvB = refractUv + refractNormal * ( refractPower + slide * 3.0 );

		refractCol.x += texture2D( uSceneTex, refractUvR ).x;
		refractCol.y += texture2D( uSceneTex, refractUvG ).y;
		refractCol.z += texture2D( uSceneTex, refractUvB ).z;

	}
	#pragma unroll_loop_end
	refractCol /= float( 16 );

	outColor += refractCol;

	/*-------------------------------
		Specular
	-------------------------------*/

	vec3 lightDir = normalize( vec3( 1.0, 1.0, 1.0 ) );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );

	outColor += ggx( dNH, 0.1  );

	/*-------------------------------
		Envmap
	-------------------------------*/

	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float EF = fresnel( dNV );

	vec3 refDir = reflect( geo.viewDirWorld, geo.normalWorld );
	refDir.x *= -1.0;

	vec3 envMapColor = textureCube( uEnvMap, refDir ).xyz;

	outColor += envMapColor * EF;

	gl_FragColor = vec4( outColor, 1.0 );

}
</document_content>
</document>
<document index="125">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/shaders/titleContainer.vs</source>
<document_content>
uniform float uVisibility;
uniform float uSectionViewing;
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

#pragma glslify: rotate = require('./rotate.glsl' )

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	pos.yz *= rotate( ( 1.0 - uSectionViewing ) * 5.0 );
	pos *= uVisibility;

	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	vec3 normal = normalize( transformedNormal );

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;

}
</document_content>
</document>
<document index="126">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/shaders/titleText.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform samplerCube uEnvMap;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}

/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform vec2 winResolution;

/*-------------------------------
	Textures
-------------------------------*/

uniform sampler2D uSceneTex;
uniform sampler2D uBackSideNormalTex;

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif

#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float fresnel( float d ) {

	float f0 = 0.15;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;

	mat.albedo = vec3( 1.0, 1.0, 1.0 );

	#ifdef USE_ROUGHNESS_MAP

		mat.roughness = texture2D( roughnessMap, vUv ).y;

	#else

		mat.roughness = roughness;

	#endif

	#ifdef USE_METALNESS_MAP

		mat.metalness = texture2D( metalnessMap, vUv ).z;

	#else

		mat.metalness = metalness;

	#endif

	#ifdef USE_ALPHA_MAP

		mat.opacity = texture2D( alphaMap, vUv ).x;

	#else

		mat.opacity *= opacity;

	#endif

	// if( mat.opacity < 0.5 ) discard;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Refract
	-------------------------------*/

	vec3 refractCol = vec3( 0.0 );
	vec2 screenUv = gl_FragCoord.xy / winResolution.xy;
	vec2 refractUv = screenUv;
	float slide;
	vec2 refractUvR;
	vec2 refractUvG;
	vec2 refractUvB;
	float refractPower = 0.1;

	outColor += (vec3( 0.5 ));

	/*-------------------------------
		Envmap
	-------------------------------*/

	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float EF = fresnel( dNV );

	outColor += EF * 2.0;

	gl_FragColor = vec4( outColor, 1.0 );

}
</document_content>
</document>
<document index="127">
<source>src/ts/MainScene/World/Sections/Section2/Section2Title/shaders/titleText.vs</source>
<document_content>
uniform float uVisibility;
uniform float uSectionViewing;
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

#pragma glslify: rotate = require('./rotate.glsl' )

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	pos.yz *= rotate( ( 1.0 - uSectionViewing ) * 5.0 );
	pos *= uVisibility;

	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	vec3 normal = normalize( transformedNormal );

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;

}
</document_content>
</document>
<document index="128">
<source>src/ts/MainScene/World/Sections/Section2/Slides/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import slideVert from './shaders/slide.vs';
import slideFrag from './shaders/slide.fs';
import { ViewingState } from '../../Section';

export class Slides {

	private animator: ORE.Animator;

	private commonUniforms: ORE.Uniforms;
	private root: THREE.Object3D;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec2SlidesVisibility',
			initValue: 0,
		} );

		this.commonUniforms.uSlide = this.animator.add( {
			name: 'sec2SlidesSlide',
			initValue: 0,
		} );

		this.root = root;

		let res = 4;

		let posArray: number[] = [];
		let indexArray: number[] = [];
		let uvArray: number[] = [];

		let radius = 9.0;
		let height = 1.6;

		for ( let i = 0; i <= res; i ++ ) {

			let theta = i / res * Math.PI * 2.0 + Math.PI / 4.0;

			let x = Math.cos( theta ) * radius * 2.0;
			let z = Math.sin( theta ) * radius;

			posArray.push( x, height / 2, z );
			posArray.push( x, - height / 2, z );

			if ( i < res ) {

				indexArray.push( i * 2.0 + 0.0 );
				indexArray.push( i * 2.0 + 1.0 );
				indexArray.push( ( i + 1 ) * 2.0 );

				indexArray.push( i * 2.0 + 1.0 );
				indexArray.push( ( i + 1 ) * 2.0 + 1.0 );
				indexArray.push( ( i + 1 ) * 2.0 + 0.0 );

			}

			let uvx = i / res;

			uvArray.push( uvx, 1.0 );
			uvArray.push( uvx, 0.0 );

		}

		let offsetPosArray = [];
		let scaleArray = [];
		let rndArray = [];

		let num = 50;

		let posY = 0.0;

		for ( let i = 0; i < num; i ++ ) {

			let scale = 0.3 + 1.0 * Math.random();
			let scaleH = scale / 2;

			let h = height * 0.80;

			posY -= scaleH * h;
			offsetPosArray.push( 0.0, posY, 0.0 );
			posY -= scaleH * h;

			scaleArray.push( scale );
			rndArray.push( Math.random() );
			rndArray.push( Math.random() );

		}

		for ( let i = 0; i < num; i ++ ) {

			offsetPosArray[ i * 3.0 + 1 ] -= posY / 2;

		}

		let geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( posArray ), 3 ) );
		geo.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvArray ), 2 ) );
		geo.setAttribute( 'offsetPos', new THREE.InstancedBufferAttribute( new Float32Array( offsetPosArray ), 3 ) );
		geo.setAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scaleArray ), 1 ) );
		geo.setAttribute( 'rnd', new THREE.InstancedBufferAttribute( new Float32Array( rndArray ), 2 ) );
		geo.setIndex( new THREE.BufferAttribute( new Uint8Array( indexArray ), 1 ) );

		let mat = new THREE.ShaderMaterial( {
			fragmentShader: slideFrag,
			vertexShader: slideVert,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				tex: window.gManager.assetManager.getTex( 'sec2BGText' ),
				speed: {
					value: Math.random() * 0.5 + 0.5,
				}
			} ),
			transparent: true,
		} );

		let mesh = new THREE.Mesh( geo, mat );
		this.root.add( mesh );

	}

	public switchVisibility( viewing: ViewingState ) {

		let visible = viewing == 'viewing';

		if ( visible ) this.root.visible = true;

		let slide = 1.0;
		if ( viewing == 'viewing' ) slide = 0.0;
		if ( viewing == 'passed' ) slide = - 1.0;

		this.animator.animate( 'sec2SlidesSlide', slide, 1 );
		this.animator.animate( 'sec2SlidesVisibility', visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="129">
<source>src/ts/MainScene/World/Sections/Section2/Slides/shaders/slide.fs</source>
<document_content>
uniform sampler2D tex;
uniform float time;

varying vec2 vUv;
varying float vAlpha;
varying vec2 vRnd;

void main( void ) {

	vec4 col = vec4( vec3( 0.9 ), 1.0 );

	vec2 uv = vUv;

	vec4 text = texture2D( tex, uv );

	if( text.w < 0.2 ) discard;

	col.w *= vAlpha * text.w;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="130">
<source>src/ts/MainScene/World/Sections/Section2/Slides/shaders/slide.vs</source>
<document_content>
attribute vec3 offsetPos;
attribute float scale;
attribute vec2 rnd;

uniform float uSectionViewing;
uniform float uVisibility;
uniform float uSlide;
uniform float time;
uniform float speed;

varying vec2 vUv;
varying float vAlpha;
varying vec2 vRnd;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )

void main( void ) {

	vec3 pos = position;
	pos.y *= scale;
	pos.y += ( pos.x ) * 0.25;
	pos += offsetPos;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vAlpha = uVisibility;

	vUv = uv;
	vUv.x *= 5.0;
	vUv.x += time * 0.1 * speed * rnd.x + rnd.y + uSectionViewing * rnd.x;
	vUv.x /= scale;


	vRnd = rnd;

}
</document_content>
</document>
<document index="131">
<source>src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import transparentVert from './shaders/transparent.vs';
import transparentFrag from './shaders/transparent.fs';

export class Transparent {

	// position

	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;

	private velocity: THREE.Vector3;
	private positionWorld: THREE.Vector3;
	public root: THREE.Object3D;


	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		/*-------------------------------
			Material
		-------------------------------*/

		this.root.traverse( item => {

			let mesh = item as THREE.Mesh;

			if ( mesh.isMesh ) {

				let baseMat = mesh.material as THREE.MeshStandardMaterial;

				mesh.material = new THREE.ShaderMaterial( {
					fragmentShader: transparentFrag,
					vertexShader: transparentVert,
					uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
						uColor: { value: baseMat.color }
					} ),
					transparent: true,
				} );

				mesh.renderOrder = 999;

			}

		} );

		/*-------------------------------
			Position
		-------------------------------*/

		this.velocity = new THREE.Vector3();
		this.positionWorld = new THREE.Vector3();

	}

	public update( deltaTime: number ) {

		this.velocity.multiplyScalar( 0.98 );

		this.root.applyQuaternion(
			new THREE.Quaternion().setFromEuler(
				new THREE.Euler(
					this.velocity.y * 3.0,
					this.velocity.x * 3.0 + 0.004,
					deltaTime * 0.2,
				) )
		);

	}

	public hover( args: ORE.TouchEventArgs, camera: THREE.PerspectiveCamera ) {

		let screenPos = this.root.getWorldPosition( this.positionWorld ).applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

		// @ts-ignore
		let d = args.screenPosition.distanceTo( new THREE.Vector2( screenPos.x, screenPos.y ) );

		// this.velocity.add( new THREE.Vector3( args.delta.x, - args.delta.y ).multiplyScalar( 0.001 * Math.max( 0.0, 1.0 - d * 2.0 ) ) );
		this.velocity.add( new THREE.Vector3( args.delta.x, args.delta.y, 0.0 ).multiplyScalar( 0.0003 * Math.max( 0.0, 1.0 - d * 2.0 ) ) );

	}

}

</document_content>
</document>
<document index="132">
<source>src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/shaders/transparent.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform vec3 uColor;
uniform samplerCube uEnvMap;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}

/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform vec2 winResolution;

/*-------------------------------
	Textures
-------------------------------*/

uniform sampler2D uSceneTex;
uniform sampler2D uBackSideNormalTex;

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif

#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

float fresnel( float d ) {

	float f0 = 0.15;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

//http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;

	#ifdef USE_MAP

		vec4 color = LinearTosRGB( texture2D( map, vUv ) );
		mat.albedo = color.xyz;
		mat.opacity = color.w;

	#else

		mat.albedo = color.xyz;
		mat.opacity = 1.0;

	#endif

	#ifdef USE_ROUGHNESS_MAP

		mat.roughness = texture2D( roughnessMap, vUv ).y;

	#else

		mat.roughness = roughness;

	#endif

	#ifdef USE_METALNESS_MAP

		mat.metalness = texture2D( metalnessMap, vUv ).z;

	#else

		mat.metalness = metalness;

	#endif

	#ifdef USE_ALPHA_MAP

		mat.opacity = texture2D( alphaMap, vUv ).x;

	#else

		mat.opacity *= opacity;

	#endif

	// if( mat.opacity < 0.5 ) discard;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Refract
	-------------------------------*/

	vec3 refractCol = vec3( 0.0 );
	vec2 screenUv = gl_FragCoord.xy / winResolution.xy;
	vec2 refractUv = screenUv;
	float slide;
	vec2 refractUvR;
	vec2 refractUvG;
	vec2 refractUvB;
	float refractPower = 0.02;
	vec2 refractNormal = geo.normal.xy * ( 1.0 - geo.normal.z * 0.7 );

	#pragma unroll_loop_start
	for ( int i = 0; i < 16; i ++ ) {

		slide = float( UNROLLED_LOOP_INDEX ) / 16.0 * 0.03 + random( screenUv ) * 0.007;

		refractUvR = refractUv - refractNormal * ( refractPower + slide * 1.0 );
		refractUvG = refractUv - refractNormal * ( refractPower + slide * 2.0 );
		refractUvB = refractUv - refractNormal * ( refractPower + slide * 3.0 );

		refractCol.x += texture2D( uSceneTex, refractUvR ).x;
		refractCol.y += texture2D( uSceneTex, refractUvG ).y;
		refractCol.z += texture2D( uSceneTex, refractUvB ).z;

	}
	#pragma unroll_loop_end
	refractCol /= float( 16 );
	// refractCol *= uColor;

	outColor += (refractCol);

	/*-------------------------------
		Specular
	-------------------------------*/

	vec3 lightDir = normalize( vec3( 1.0, 1.0, 1.0 ) );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );

	outColor += ggx( dNH, 0.1  );

	/*-------------------------------
		Envmap
	-------------------------------*/

	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float EF = fresnel( dNV );

	vec3 refDir = reflect( geo.viewDirWorld, geo.normalWorld );
	refDir.x *= -1.0;

	vec3 envMapColor = textureCube( uEnvMap, refDir ).xyz;

	// outColor += envMapColor * hsv2rgb( vec3( dNV * 2.0 + sin( time ) * 0.1 + 0.2, 1.0, 1.0 ) ) * EF;
	outColor = mix( outColor, envMapColor * hsv2rgb( vec3( dNV * 2.0 + sin( time ) * 0.1 + 0.2, 1.0, 1.0 ) ), EF * 0.3 );

	gl_FragColor = vec4( outColor, 1.0 );

}
</document_content>
</document>
<document index="133">
<source>src/ts/MainScene/World/Sections/Section2/Transparents/Transparent/shaders/transparent.vs</source>
<document_content>
uniform float uSectionViewing;
uniform float uVisibility;
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

#pragma glslify: rotate = require('./rotate.glsl' )

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	mat2 rot = rotate( ( 1.0 - uSectionViewing ) * 5.0 );
	pos.xy *= rot;
	pos *= uVisibility;

	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	transformedNormal.xy *= rot;
	vec3 normal = normalize( transformedNormal );

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;

}
</document_content>
</document>
<document index="134">
<source>src/ts/MainScene/World/Sections/Section2/Transparents/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Transparent } from './Transparent';

export class Transparents {

	private root: THREE.Object3D;

	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;

	private meshList: Transparent[] = [];
	private layoutController: ORE.LayoutController[] = [];

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'transparentVisibility',
			initValue: 0,
		} );

		this.root.children.forEach( item => {

			this.meshList.push( new Transparent( item, this.commonUniforms ) );

		} );

		this.layoutController.push( new ORE.LayoutController( this.meshList.find( item => item.root.name == 'Cube' )!.root, {
			position: new THREE.Vector3( 1.7, 1.3, 0.0 ),
			scale: 1.0,
		} ) );

		this.layoutController.push( new ORE.LayoutController( this.meshList.find( item => item.root.name == 'Torus' )!.root, {
			position: new THREE.Vector3( - 1.5, - 1.0, 0.0 ),
			scale: 1.2
		} ) );

		this.layoutController.push( new ORE.LayoutController( this.meshList.find( item => item.root.name == 'Cylinder' )!.root, {
			position: new THREE.Vector3( - 1.8, - 1.5, 0.0 ),
			scale: 1.5
		} ) );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( 'transparentVisibility', visible ? 1.0 : 0.0, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}

	public update( deltaTime: number ) {

		for ( let i = 0; i < this.meshList.length; i ++ ) {

			let obj = this.meshList[ i ];
			obj.update( deltaTime );

		}

	}

	public hover( args: ORE.TouchEventArgs, camera: THREE.PerspectiveCamera ) {

		this.meshList.forEach( item => {

			item.hover( args, camera );

		} );

	}

	public resize( info: ORE.LayerInfo ) {

		this.layoutController.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

	}

}

</document_content>
</document>
<document index="135">
<source>src/ts/MainScene/World/Sections/Section2/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Section, ViewingState } from '../Section';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Slides } from './Slides';
import { Transparents } from './Transparents';
import { Flexible } from './Flexible';
import { Section2Title } from './Section2Title';

export class Section2 extends Section {

	private slides?: Slides;
	private transparents?: Transparents;
	private flexible?: Flexible;
	private title?: Section2Title;
	private info?: ORE.LayerInfo;
	private layoutControllerList: ORE.LayoutController[] = [];

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms ) {

		super( manager, 'section_2', ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uSceneTex: {
				value: null
			},
			winResolution: {
				value: new THREE.Vector2()
			}
		} ) );

		// params

		this.elm = document.querySelector( '.section2' ) as HTMLElement;

		this.ppParam.bloomBrightness = 0;
		this.ppParam.vignet = 1.5;
		this.bakuParam.rotateSpeed = - 0.09;
		this.bakuParam.materialType = 'glass';

		/*-------------------------------
			Light
		-------------------------------*/

		this.light1Data = {
			position: new THREE.Vector3( - 1, 2, 1 ),
			targetPosition: new THREE.Vector3( 0, 0, 0 ),
			intensity: 1
		};

	}

	protected onLoadedGLTF( gltf: GLTF ): void {

		let scene = gltf.scene;

		this.add( scene );

		/*-------------------------------
			Slide
		-------------------------------*/

		this.slides = new Slides( scene.getObjectByName( 'Slides' ) as THREE.Object3D, this.commonUniforms );
		this.slides.switchVisibility( this.viewing );

		/*-------------------------------
			Titles
		-------------------------------*/

		this.title = new Section2Title( scene.getObjectByName( 'Title' ) as THREE.Mesh, this.commonUniforms );
		this.title.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Transparent
		-------------------------------*/

		this.transparents = new Transparents( scene.getObjectByName( 'Transparents' ) as THREE.Object3D, this.commonUniforms );
		this.transparents.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Flexible
		-------------------------------*/

		this.flexible = new Flexible( scene.getObjectByName( 'Flexible' ) as THREE.Mesh, this.commonUniforms );
		this.flexible.switchVisibility( this.sectionVisibility );

		this.layoutControllerList.push( new ORE.LayoutController( this.flexible.mesh, {
			scale: 0.45,
			rotation: new THREE.Quaternion().setFromEuler( new THREE.Euler( 0.0, 0.0, 0.0 ) )
		} ) );

		if ( this.info ) {

			this.resize( this.info );

		}

	}

	public setSceneTex( tex: THREE.Texture ) {

		this.commonUniforms.uSceneTex.value = tex;

	}

	public update( deltaTime: number ) {

		if ( this.title ) this.title.update( deltaTime );
		if ( this.transparents ) this.transparents.update( deltaTime );

	}

	public hover( args: ORE.TouchEventArgs, camera: THREE.PerspectiveCamera ) {

		if ( this.transparents ) this.transparents.hover( args, camera );

	}

	public resize( info: ORE.LayerInfo ): void {

		super.resize( info );

		this.info = info;

		this.commonUniforms.winResolution.value.copy( info.size.canvasPixelSize );

		if ( this.transparents ) {

			this.transparents.resize( info );

		}

		this.layoutControllerList.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

		if ( this.flexible ) this.flexible.resize( this.info );

	}

	public switchViewingState( viewing: ViewingState ): void {

		super.switchViewingState( viewing );

		if ( this.slides ) this.slides.switchVisibility( viewing );
		if ( this.title ) this.title.switchVisibility( this.sectionVisibility );
		if ( this.transparents ) this.transparents.switchVisibility( this.sectionVisibility );
		if ( this.flexible ) this.flexible.switchVisibility( this.sectionVisibility );

	}

}

</document_content>
</document>
<document index="136">
<source>src/ts/MainScene/World/Sections/Section3/BackText/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import backTextVert from './shaders/backText.vs';
import backTextFrag from './shaders/backText.fs';

export class BackText {

	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;
	private mesh: THREE.Mesh;

	constructor( mesh: THREE.Mesh, parentUniforms: ORE.Uniforms ) {

		this.mesh = mesh;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec4BackTextVisibility',
			initValue: 0.0,
			easing: ORE.Easings.easeOutCubic
		} );

		/*-------------------------------
			Material
		-------------------------------*/

		let baseMat = this.mesh.material as THREE.MeshStandardMaterial;

		if ( baseMat.map ) {

			baseMat.map.wrapS = THREE.RepeatWrapping;

		}

		this.commonUniforms.uTex = {
			value: baseMat.map
		};

		mesh.material = new THREE.ShaderMaterial( {
			vertexShader: backTextVert,
			fragmentShader: backTextFrag,
			uniforms: this.commonUniforms,
		} );

	}

	private timer: number | null = null;

	public switchVisibility( visible: boolean ) {

		if ( this.timer ) {

			window.clearInterval( this.timer );
			this.timer = null;

		}

		let wait = visible ? 1000 : 0;

		this.timer = window.setTimeout( () => {

			if ( visible ) this.mesh.visible = true;

			this.animator.animate( 'sec4BackTextVisibility', visible ? 1 : 0, 2, () => {

				if ( ! visible ) this.mesh.visible = false;

			} );

			this.timer = null;

		}, wait );

	}

}

</document_content>
</document>
<document index="137">
<source>src/ts/MainScene/World/Sections/Section3/BackText/shaders/backText.fs</source>
<document_content>
uniform sampler2D uTex;
uniform float uVisibility;
varying vec2 vUv;

void main( void ) {

	vec4 col = texture2D( uTex, vUv );

	col.w *= step( abs ( vUv.y - 0.5 ), uVisibility * 0.5 );

	if( col.w < 0.5 ) {

		discard;

	}

	gl_FragColor = col;

}
</document_content>
</document>
<document index="138">
<source>src/ts/MainScene/World/Sections/Section3/BackText/shaders/backText.vs</source>
<document_content>
uniform float time;
varying vec2 vUv;

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vUv.x += time * 0.02;

}
</document_content>
</document>
<document index="139">
<source>src/ts/MainScene/World/Sections/Section3/CursorLight/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class CursorLight extends THREE.DirectionalLight {

	private goalPos: THREE.Vector3 = new THREE.Vector3();
	private currentPos: THREE.Vector3 = new THREE.Vector3();
	private velocity: THREE.Vector3 = new THREE.Vector3();

	// private helper: THREE.PointLightHelper;

	constructor() {

		super();

		this.goalPos.set( - 1.0, - 1.0, - 0.5 );

	}

	public update( deltaTime: number ) {

		let diff = this.goalPos.clone().sub( this.currentPos );
		this.velocity.add( diff.multiplyScalar( deltaTime * 2.5 ) );
		this.velocity.multiplyScalar( 0.8 );

		this.currentPos.add( this.velocity );
		this.position.copy( this.currentPos );

	}

	public hover( args: ORE.TouchEventArgs ) {

		this.goalPos.set( args.screenPosition.x, args.screenPosition.y, - 0.5 );

	}

}

</document_content>
</document>
<document index="140">
<source>src/ts/MainScene/World/Sections/Section3/Displays/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';

import displayVert from './shaders/display.vs';
import displayFrag from './shaders/display.fs';

import containerVert from './shaders/container.vs';
import containerFrag from './shaders/container.fs';

export class Displays extends EventEmitter {

	public root: THREE.Object3D;
	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uNoiseTex: window.gManager.assetManager.getTex( 'noise' ),
			uDisplayTex: window.gManager.assetManager.getTex( 'display' )
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'displayVisibility',
			initValue: 0
		} );

		this.animator.add( {
			name: 'raymarchEffect',
			initValue: 0,
			easing: ORE.Easings.cubicBezier( 0, .85, .25, 1.01 )
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		this.root = root;
		this.root.children.forEach( ( item, index ) => {

			let container = item as THREE.Mesh;

			container.material = new THREE.ShaderMaterial( {
				vertexShader: containerVert,
				fragmentShader: containerFrag,
				uniforms: ORE.UniformsLib.mergeUniforms( THREE.UniformsUtils.clone( THREE.UniformsLib.lights ), this.commonUniforms, {
				} ),
				transparent: true,
				lights: true,
			} );

			container.renderOrder = 10;

			let display = item.children[ 0 ] as THREE.Mesh;

			let defines: any = {};

			let uniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uOffset: {
					value: index
				}
			} );

			if ( display.name.indexOf( 'Raymarching' ) > - 1 ) {

				defines[ "IS_RAYMARCH" ] = '';
				defines[ "IS_RAYMARCH_" + display.name.split( "_" )[ 1 ] ] = '';
				uniforms.uRaymarchEffect = this.animator.getVariableObject( 'raymarchEffect' )!;

			}

			display.material = new THREE.ShaderMaterial( {
				vertexShader: displayVert,
				fragmentShader: displayFrag,
				uniforms,
				transparent: true,
				defines
			} );

			display.renderOrder = 10;

		} );


		let animate = () => {

			this.animator.animate( 'raymarchEffect', Math.random(), Math.random() * 1.0 + 0.8, () => {

				animate();

			} );

		};

		animate();

	}

	public switchVisibility( visibility: boolean ) {

		if ( visibility ) this.root.visible = true;

		this.animator.animate( 'displayVisibility', visibility ? 1 : 0, 1, () => {

			if ( ! visibility ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="141">
<source>src/ts/MainScene/World/Sections/Section3/Displays/shaders/container.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}


/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform float uVisibility;

/*-------------------------------
	Textures
-------------------------------*/

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif
#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

#ifdef IS_REFLECTIONPLANE

	uniform sampler2D reflectionTex;
	uniform vec2 renderResolution;
	uniform vec2 mipMapResolution;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

/*-------------------------------
	Lights
-------------------------------*/

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

/*-------------------------------
	EnvMap
-------------------------------*/

#ifdef USE_ENV_MAP

	uniform sampler2D envMap;
	uniform float envMapIntensity;
	uniform float iblIntensity;
	uniform float maxLodLevel;

	#define ENVMAP_TYPE_CUBE_UV
	#include <cube_uv_reflection_fragment>

#endif

/*-------------------------------
	Reflection
-------------------------------*/

#define REF_MIPMAP_LEVEL 8.0

#ifdef IS_REFLECTIONPLANE

	vec2 getRefMipmapUV( vec2 uv, float level ) {

		vec2 ruv = uv;

		if( level > 0.0 ) {

			ruv.x *= 1.0 / ( 3.0 * ( pow( 2.0, level ) / 2.0 ) );
			ruv.y *= 1.0 / ( pow( 2.0, level ) );
			ruv.y += 1.0 / ( pow( 2.0, level ) );
			ruv.x += 1.0 / 1.5;

		} else {

			ruv.x /= 1.5;

		}

		return ruv;

	}

	vec4 cubic(float v) {
		vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
		vec4 s = n * n * n;
		float x = s.x;
		float y = s.y - 4.0 * s.x;
		float z = s.z - 4.0 * s.y + 6.0 * s.x;
		float w = 6.0 - x - y - z;
		return vec4(x, y, z, w);
	}

	// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
	vec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {
		vec2 invTexSize = 1.0 / textureSize;
		texCoords = texCoords * textureSize - 0.5;
		vec2 fxy = fract(texCoords);
		texCoords -= fxy;
		vec4 xcubic = cubic(fxy.x);
		vec4 ycubic = cubic(fxy.y);
		vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;
		vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
		vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
		offset *= invTexSize.xxyy;
		vec4 sample0 = texture2D(t, offset.xz);
		vec4 sample1 = texture2D(t, offset.yz);
		vec4 sample2 = texture2D(t, offset.xw);
		vec4 sample3 = texture2D(t, offset.yw);
		float sx = s.x / (s.x + s.y);
		float sy = s.z / (s.z + s.w);
		return mix(
		mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
	}

#endif

/*-------------------------------
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;
	uniform float cameraNear;
	uniform float cameraFar;

#endif

#ifdef USE_SHADOWMAP

#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#define SHADOW_SAMPLE_COUNT 4

	vec2 poissonDisk[ SHADOW_SAMPLE_COUNT ];

	void initPoissonDisk( float seed ) {

		float r = 0.1;
		float rStep = (1.0 - r) / float( SHADOW_SAMPLE_COUNT );

		float ang = random( gl_FragCoord.xy * 0.01 + sin( time ) ) * PI2 * 1.0;
		float angStep = ( ( PI2 * 11.0 ) / float( SHADOW_SAMPLE_COUNT ) );

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i++ ) {

			poissonDisk[ i ] = vec2(
				sin( ang ),
				cos( ang )
			) * pow( r, 0.75 );

			r += rStep;
			ang += angStep;
		}

	}

	vec2 compairShadowMapDepth( sampler2D shadowMap, vec2 shadowMapUV, float depth ) {

		if( shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadowMapDepth = unpackRGBAToDepth( texture2D( shadowMap, shadowMapUV ) );

		if( 0.0 >= shadowMapDepth || shadowMapDepth >= 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadow = depth <= shadowMapDepth ? 1.0 : 0.0;

		return vec2( shadow, shadowMapDepth );

	}

	float shadowMapPCF( sampler2D shadowMap, vec4 shadowMapCoord, vec2 shadowSize ) {

		float shadow = 0.0;

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i ++  ) {

			vec2 offset = poissonDisk[ i ] * shadowSize;

			shadow += compairShadowMapDepth( shadowMap, shadowMapCoord.xy + offset, shadowMapCoord.z ).x;

		}

		shadow /= float( SHADOW_SAMPLE_COUNT );

		return shadow;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float bias, vec4 shadowMapCoord ) {

		shadowMapCoord.xyz /= shadowMapCoord.w;
		shadowMapCoord.z += bias - 0.0001;

		initPoissonDisk(time);

		vec2 shadowSize = 1.0 / shadowMapSize;

		return shadowMapPCF( shadowMap, shadowMapCoord, shadowSize );

	}

#endif

/*-------------------------------
	RE
-------------------------------*/

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

float gSchlick( float d, float k ) {

	if( d == 0.0 ) return 0.0;

	return d / ( d * ( 1.0 - k ) + k );

}

float gSmith( float dNV, float dNL, float roughness ) {

	float k = clamp( roughness * sqrt( 2.0 / PI ), 0.0, 1.0 );

	return gSchlick( dNV, k ) * gSchlick( dNL, k );

}

float fresnel( float d ) {

	float f0 = 0.04;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	// diffuse
	vec3 diffuse = lambert( mat.diffuseColor ) * irradiance;

	// specular
	float D = ggx( dNH, mat.roughness );
	float G = gSmith( dNV, dNL, mat.roughness );
	float F = fresnel( dLH );

	vec3 specular = (( D * G * F ) / ( 4.0 * dNL * dNV + 0.0001 ) * mat.specularColor ) * irradiance;

	vec3 c = vec3( 0.0 );
	c += diffuse * ( 1.0 - F ) + specular;

	return c;

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;
	mat.albedo = vec3( 0.2 );
	mat.opacity = 1.0;
	mat.roughness = 0.5;
	mat.metalness = 0.1;
	mat.opacity *= uVisibility;

	// if( mat.opacity < 0.5 ) discard;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	#ifdef USE_NORMAL_MAP

		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );

		#ifdef DOUBLE_SIDED

			tangent *= faceDirection;
			bitangent *= faceDirection;

		#endif

		mat3 vTBN = mat3( tangent, bitangent, geo.normal );

		vec3 mapN = texture2D( normalMap, vUv ).xyz;
		mapN = mapN * 2.0 - 1.0;
		geo.normal = normalize( vTBN * mapN );

	#endif

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Lighting
	-------------------------------*/

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;
				shadow = 1.0;

				#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHTS < NUM_DIR_LIGHT_SHADOWS

					shadow = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

				outColor += RE( geo, mat, light ) * shadow;

			}
		#pragma unroll_loop_end

	#endif

	#if defined( USE_ENV_MAP ) || defined( IS_REFLECTIONPLANE )

		float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
		float EF = fresnel( dNV );

	#endif

	/*-------------------------------
		Environment Lighting
	-------------------------------*/

	#ifdef USE_ENV_MAP

		vec3 refDir = reflect( geo.viewDirWorld, geo.normalWorld );
		refDir.x *= -1.0;

		vec4 envMapColor = textureCubeUV( envMap, geo.normalWorld, 1.0 ) * iblIntensity * envMapIntensity;
		outColor += mat.diffuseColor * envMapColor.xyz * ( 1.0 - mat.metalness );

	#endif

	/*-------------------------------
		Reflection
	-------------------------------*/

	#ifdef IS_REFLECTIONPLANE

		vec2 refUV = gl_FragCoord.xy / renderResolution;

		refUV.x += geo.normal.x * 0.5;

		float l = (mat.roughness ) * 1.6 * REF_MIPMAP_LEVEL;

		float offset1 = floor( l );
		float offset2 = offset1 + 1.0;
		float blend = fract( l );

		vec2 ruv1 = getRefMipmapUV( refUV, offset1 );
		vec2 ruv2 = getRefMipmapUV( refUV, offset2 );

		vec3 ref1 = textureBicubic( reflectionTex, ruv1, mipMapResolution ).xyz;
		vec3 ref2 = textureBicubic( reflectionTex, ruv2, mipMapResolution ).xyz;

		vec3 ref = mat.specularColor * mix( ref1, ref2, blend );

		outColor = mix(
			outColor + ref * mat.metalness,
			ref,
			EF
		);

	#elif defined( USE_ENV_MAP )

		vec3 env = mat.specularColor * textureCubeUV( envMap, refDir, mat.roughness ).xyz * envMapIntensity;

		outColor = mix(
			outColor + env * mat.metalness,
			env,
			EF
		);

	#endif

	/*-------------------------------
		Emission
	-------------------------------*/

	#ifdef USE_EMISSION_MAP

		outColor += LinearTosRGB( texture2D( emissionMap, vUv ) ).xyz;

	#else

		outColor += emission;

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="142">
<source>src/ts/MainScene/World/Sections/Section3/Displays/shaders/container.vs</source>
<document_content>
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec2 vHighPrecisionZW;

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	vec4 flipedTangent = tangent;
	flipedTangent.w *= -1.0;

	#ifdef FLIP_SIDED
		transformedNormal *= -1.0;
		flipedTangent *= -1.0;
	#endif

	vec3 normal = normalize( transformedNormal );
	vec3 tangent = normalize( ( modelViewMatrix * vec4( flipedTangent.xyz, 0.0 ) ).xyz );
	vec3 biTangent = normalize( cross( normal, tangent ) * flipedTangent.w );

	/*-------------------------------
		Shadow
	-------------------------------*/

	vec4 shadowWorldPos;

	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPos = worldPos + vec4( vec4( transformedNormal, 0.0 ) * modelMatrix ) * directionalLightShadows[ i ].shadowNormalBias;
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPos;

		}
		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vTangent = tangent;
	vBitangent = biTangent;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="143">
<source>src/ts/MainScene/World/Sections/Section3/Displays/shaders/display.fs</source>
<document_content>

varying vec2 vUv;
varying vec2 vUv2;
varying float vBrightness;
varying float vFade;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vInvert;

uniform float time;
uniform float uTimeMod;
uniform sampler2D uNoiseTex;
uniform sampler2D uDisplayTex;
uniform float uRaymarchEffect;

uniform float uSectionVisibility;

#pragma glslify: random = require( './random.glsl' )
#pragma glslify: rotate = require( './rotate.glsl' )

#ifdef IS_RAYMARCH

	float sdBox( vec3 p, vec3 b )
	{
		vec3 q = abs(p) - b;
		return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
	}

	float sdSphere( vec3 p, float s )
	{
		return length(p)-s;
	}

#endif

#ifdef IS_RAYMARCH_1

	float SDF( vec3 p ){

		p.xy *= rotate( p.z * 0.05 + uRaymarchEffect * 5.0 );

		vec3 loopP = mod( p, 4.0 ) - 2.0;

		loopP.yz *= rotate( uRaymarchEffect * 10.0 + time );
		loopP.xz *= rotate( uRaymarchEffect * 10.0 );

		vec3 size = vec3( 0.3, 0.3 + uRaymarchEffect * 3.0, 0.3 );
		size *= 1.0 - uRaymarchEffect * 0.5;

		float d = sdBox( loopP, size );

		return d;
	}

#endif

#ifdef IS_RAYMARCH_2

	// https://www.shadertoy.com/view/XdBBzR
	float smin( float a, float b, float k )
	{
		float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
		return mix( b, a, h ) - k*h*(1.0-h);
	}

	float SDF( vec3 p ){

		vec3 p1 = p + vec3( sin( time ) * 0.1, cos( time ) * 0.1, 0.0 );
		vec3 p2 = p + vec3( sin( time * 1.4 ) * 0.4, cos( time ) * 0.5, 0.0 );
		vec3 p3 = p + vec3( sin( time * 3.0 ) * 0.7, cos( time * 0.8 ) * 0.7, 0.0 );
		vec3 p4 = p + vec3( sin( time * 1.0 ) * 1.0, cos( time * 0.5 ) * 1.0, sin( time * 0.4 ) * 1.0 );
		vec3 p5 = p + vec3( sin( time * 1.6 ) * 1.0, cos( time * 0.4 ) * 1.0, cos( time * 0.3 ) * 1.0 );

		float sp1 = sdSphere( p1, 0.5 );
		float sp2 = sdSphere( p2, 0.3 );
		float sp3 = sdSphere( p3, 0.2 );
		float sp4 = sdSphere( p4, 0.2 );
		float sp5 = sdSphere( p5, 0.3 );

		float d;
		d = min( sp1, 999.0 );
		d = smin( sp2, d, 0.3 );
		d = smin( sp3, d, 0.3 );
		d = smin( sp4, d, 0.3 );
		d = smin( sp5, d, 0.3 );

		return d;
	}

#endif

#ifdef IS_RAYMARCH

	vec3 getNormal( vec3 p ){

		float delta = 0.001;
		vec3 dx = vec3( delta,0.0,0.0 );
		vec3 dy = vec3( 0.0,delta,0.0 );
		vec3 dz = vec3( 0.0,0.0,delta );
		vec3 result;
		result.x = SDF( p + dx ) - SDF( p - dx );
		result.y = SDF( p + dy ) - SDF( p - dy );
		result.z = SDF( p + dz ) - SDF( p - dz );

		return normalize( result );
	}

#endif

void main( void ) {

	vec3 color = vec3( .0 );
	vec2 texUv = vUv2;

	vec2 n = vec2( ( texture2D( uNoiseTex, vec2( vUv2.y * 2.0, time * 3.0 ) ).xy - 0.5 ) * 0.5 );
	n *= vFade;
	n.x -= ( texture2D( uNoiseTex, vec2( vUv2.y * 50.0, time * 3.0 ) ).x - 0.5 ) * 0.05;

	vec2 texUvR = texUv + n;
	vec2 texUvG = texUv + n * 0.5;
	vec2 texUvB = texUv + n * 1.0;

	#ifdef IS_RAYMARCH

		float fov = 50.0;


		#ifdef IS_RAYMARCH_1

			vec3 cPos = vec3( 0.0, 0.0, -time * 10.0 );
			cPos.x = cos(time * 0.5) * 1.0;
			cPos.y = sin(time) * 1.2;
			cPos.z -= n.y * 3.0;

		#endif

		vec2 pos = vUv.xy * 2.0 - 1.0;
		pos.x += n.y * 2.0;
		vec3 ray = normalize( vec3( sin( fov ) * pos.x, sin( fov ) * pos.y, -1.0 ) );

		#ifdef IS_RAYMARCH_2

			vec3 cPos = vec3( 0.0, 0.0, 5.0 );
			mat2 rot = rotate( time );
			cPos.xz *= rot;
			ray.xz *= rot;

		#endif

		float rDistance = 0.0;
		float rLen = 0.0;

		vec3 rPos = cPos;
		float hit = 0.0;

		for( int i = 0; i < 40; i++ ){

			rDistance = SDF( rPos );
			rLen += rDistance;
			rPos = cPos + ray * rLen;

			if( abs( rDistance ) <= 0.01 ){

				vec3 normal = getNormal( rPos );
				float diff = clamp( dot( vec3( 0.5,0.5,0.5 ), normal ), 0.1, 1.0 );

				color = mix( vec3( diff ), normal * 0.5 + 0.5, vInvert * 0.9 );

				hit = 1.0;

				break;

			}

		}

		color = mix( vec3( vInvert ), color, hit );

	#else

		vec4 logo = vec4( 0.0 );
		logo.xw += texture2D( uDisplayTex, texUvR ).xw;
		logo.yw += texture2D( uDisplayTex, texUvG ).yw;
		logo.zw += texture2D( uDisplayTex, texUvB ).zw;
		logo.w /= 3.0;

		color = mix( vec3( 1.0 ), logo.xyz, logo.w );

	#endif

	vec3 noiseColor = vec3( 0.0 ) + random( vUv + mod( time, 1.0 ) + 1000.0 ) * 0.7;
	noiseColor += step( 0.0, sin( time * 3.0 - vUv2.y ) * sin( time * 3.0 - vUv.y * 8.0 )) * 0.1;

	// ノイズとロゴのきりかえ
	float noiseW = smoothstep( 0.00, 0.01, -texture2D( uNoiseTex, vec2( vUv2.y + time * 10.0, 0.0 ) ).x + vBrightness * 1.2 );
	color = mix( color, noiseColor, noiseW );

	// ビカビカ
	color *= step( 0.0, sin( vUv2.y * 5.0 - time * 80.0 ) ) * 0.05 + 0.95;

	// 反転
	color = mix( color, 1.0 - color, vInvert );

	// なみなみ
	color *= 0.78 - sin( vUv.y * 200.0 - time * 10.0 ) * 0.02;

	// 周辺減光的な
	color *= smoothstep( 1.0, 0.3, length( vUv - 0.5 ) );

	gl_FragColor = vec4( color, uSectionVisibility );

}
</document_content>
</document>
<document index="144">
<source>src/ts/MainScene/World/Sections/Section3/Displays/shaders/display.vs</source>
<document_content>
varying vec2 vUv;
varying vec2 vUv2;
varying	float vBrightness;
varying float vFade;

varying vec3 vNormal;
varying vec3 vViewPos;
varying float vInvert;

uniform vec2 uv2;
uniform float time;
uniform sampler2D uNoiseTex;
uniform float uOffset;

#pragma glslify: import('./constants.glsl' )

vec2 spriteUVSelector( vec2 uv, vec2 tile, float frames, float time ) {

	float t = floor(frames * mod( time, 1.0 ) );

	uv.x += mod(t, tile.x);
	uv.y -= floor(t / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

void main( void ) {

	vec3 pos = position;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vUv.y = 1.0 - vUv.y;
	vUv2 = spriteUVSelector( vUv, vec2( 2.0, 4.0 ), 8.0, uOffset / 8.0 );

	vec2 noise = texture2D( uNoiseTex, vec2( time * 0.03 + modelMatrix[3][0] ) ).xy;
	vec2 noiseHigh = texture2D( uNoiseTex, vec2( time * 3.0 + modelMatrix[3][0] ) ).xy;
	vBrightness = smoothstep( 0.55, 0.65, noise.x + noiseHigh.x * 0.08 ) * 0.9;
	vInvert = step( 0.5, noise.y + noiseHigh.y * 0.08 );

	vFade = sin( vBrightness * PI ) + sin( vInvert * PI);

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normalMatrix * normal;
	vViewPos = -mvPosition.xyz;

}
</document_content>
</document>
<document index="145">
<source>src/ts/MainScene/World/Sections/Section3/Lights/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';

import lightVert from './shaders/light.vs';
import lightFrag from './shaders/light.fs';

import wireVert from './shaders/wire.vs';
import wireFrag from './shaders/wire.fs';

export class Lights extends EventEmitter {

	private animator: ORE.Animator;
	private root: THREE.Object3D;
	private commonUniforms: ORE.Uniforms;
	private lightList: THREE.Light[] = [];

	constructor( root: THREE.Object3D, parentUniforms: ORE.Uniforms ) {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uNoiseTex: window.gManager.assetManager.getTex( 'noise' )
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'sec3LightsVisibility',
			initValue: 0,
		 } );

		/*-------------------------------
			Mesh
		-------------------------------*/

		this.root = root;

		this.root.children.forEach( item => {

			let wire = item as THREE.Mesh;

			wire.material = new THREE.ShaderMaterial( {
				vertexShader: wireVert,
				fragmentShader: wireFrag,
				uniforms: ORE.UniformsLib.mergeUniforms( THREE.UniformsUtils.clone( THREE.UniformsLib.lights ), this.commonUniforms, {
				} ),
				transparent: true,
				lights: true,
			} );

			wire.renderOrder = 5;

			let light = wire.children[ 0 ] as THREE.Mesh;

			light.material = new THREE.ShaderMaterial( {
				vertexShader: lightVert,
				fragmentShader: lightFrag,
				uniforms: this.commonUniforms,
				transparent: true,
			} );

			light.renderOrder = 5;

			let adapter = light.children[ 0 ] as THREE.Mesh;

			if ( adapter ) {

				adapter.material = new THREE.ShaderMaterial( {
					vertexShader: lightVert,
					fragmentShader: lightFrag,
					uniforms: this.commonUniforms,
					defines: {
						"IS_ADAPTER": ''
					},
					transparent: true,
				} );

				adapter.renderOrder = 5;

			}

		} );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.root.visible = true;

		this.animator.animate( "sec3LightsVisibility", visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.root.visible = false;

		} );

	}



}

</document_content>
</document>
<document index="146">
<source>src/ts/MainScene/World/Sections/Section3/Lights/shaders/light.fs</source>
<document_content>

varying vec2 vUv;
varying float vBrightness;

uniform float time;
uniform float uTimeMod;
uniform float uVisibility;

#pragma glslify: random = require('./random.glsl' )

#ifdef IS_ADAPTER

	varying vec3 vNormal;
	varying vec4 vWorldPos;
	uniform samplerCube uEnvMap;

#endif

void main( void ) {

	#ifdef IS_ADAPTER

		vec3 normalWorld =  normalize( ( vec4( vNormal, 0.0 ) * viewMatrix ).xyz );
		vec3 viewDirWorld = normalize( vWorldPos.xyz - cameraPosition );

		vec3 refDir = reflect( viewDirWorld, normalWorld );
		refDir.x *= -1.0;

		vec3 envMapColor = textureCube( uEnvMap, refDir ).xyz;
		vec3 color = envMapColor * 0.2;

		gl_FragColor = vec4( color, uVisibility );

		return;

	#else

		vec3 color = vec3( 1.0 ) * vBrightness;

		gl_FragColor = vec4( color, uVisibility );

	#endif

}
</document_content>
</document>
<document index="147">
<source>src/ts/MainScene/World/Sections/Section3/Lights/shaders/light.vs</source>
<document_content>
varying vec2 vUv;
varying vec2 vUv2;
varying	float vBrightness;

uniform vec2 uv2;
uniform float time;

uniform sampler2D uNoiseTex;

#ifdef IS_ADAPTER

	varying vec3 vNormal;
	varying vec4 vWorldPos;

#endif

void main( void ) {

	vec3 pos = position;

	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vUv2 = uv2;

	vec4 noise = texture2D( uNoiseTex, vec2( time * 0.5 + modelMatrix[3][0] ) );

	vBrightness = 0.0;
	vBrightness += smoothstep( 0.0, 0.4, noise.x ) * 0.9;
	vBrightness *= 1.0 - abs( vUv.x - 0.5 ) * 2.0;

	#ifdef IS_ADAPTER

		vNormal = normalMatrix * normal;
		vWorldPos = worldPos;

	#endif

}
</document_content>
</document>
<document index="148">
<source>src/ts/MainScene/World/Sections/Section3/Lights/shaders/wire.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}


/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform float uVisibility;

/*-------------------------------
	Textures
-------------------------------*/

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif
#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

#ifdef IS_REFLECTIONPLANE

	uniform sampler2D reflectionTex;
	uniform vec2 renderResolution;
	uniform vec2 mipMapResolution;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

/*-------------------------------
	Lights
-------------------------------*/

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

/*-------------------------------
	EnvMap
-------------------------------*/

#ifdef USE_ENV_MAP

	uniform sampler2D envMap;
	uniform float envMapIntensity;
	uniform float iblIntensity;
	uniform float maxLodLevel;

	#define ENVMAP_TYPE_CUBE_UV
	#include <cube_uv_reflection_fragment>

#endif

/*-------------------------------
	Reflection
-------------------------------*/

#define REF_MIPMAP_LEVEL 8.0

#ifdef IS_REFLECTIONPLANE

	vec2 getRefMipmapUV( vec2 uv, float level ) {

		vec2 ruv = uv;

		if( level > 0.0 ) {

			ruv.x *= 1.0 / ( 3.0 * ( pow( 2.0, level ) / 2.0 ) );
			ruv.y *= 1.0 / ( pow( 2.0, level ) );
			ruv.y += 1.0 / ( pow( 2.0, level ) );
			ruv.x += 1.0 / 1.5;

		} else {

			ruv.x /= 1.5;

		}

		return ruv;

	}

	vec4 cubic(float v) {
		vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
		vec4 s = n * n * n;
		float x = s.x;
		float y = s.y - 4.0 * s.x;
		float z = s.z - 4.0 * s.y + 6.0 * s.x;
		float w = 6.0 - x - y - z;
		return vec4(x, y, z, w);
	}

	// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
	vec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {
		vec2 invTexSize = 1.0 / textureSize;
		texCoords = texCoords * textureSize - 0.5;
		vec2 fxy = fract(texCoords);
		texCoords -= fxy;
		vec4 xcubic = cubic(fxy.x);
		vec4 ycubic = cubic(fxy.y);
		vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;
		vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
		vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
		offset *= invTexSize.xxyy;
		vec4 sample0 = texture2D(t, offset.xz);
		vec4 sample1 = texture2D(t, offset.yz);
		vec4 sample2 = texture2D(t, offset.xw);
		vec4 sample3 = texture2D(t, offset.yw);
		float sx = s.x / (s.x + s.y);
		float sy = s.z / (s.z + s.w);
		return mix(
		mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
	}

#endif

/*-------------------------------
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;
	uniform float cameraNear;
	uniform float cameraFar;

#endif

#ifdef USE_SHADOWMAP

#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#define SHADOW_SAMPLE_COUNT 4

	vec2 poissonDisk[ SHADOW_SAMPLE_COUNT ];

	void initPoissonDisk( float seed ) {

		float r = 0.1;
		float rStep = (1.0 - r) / float( SHADOW_SAMPLE_COUNT );

		float ang = random( gl_FragCoord.xy * 0.01 + sin( time ) ) * PI2 * 1.0;
		float angStep = ( ( PI2 * 11.0 ) / float( SHADOW_SAMPLE_COUNT ) );

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i++ ) {

			poissonDisk[ i ] = vec2(
				sin( ang ),
				cos( ang )
			) * pow( r, 0.75 );

			r += rStep;
			ang += angStep;
		}

	}

	vec2 compairShadowMapDepth( sampler2D shadowMap, vec2 shadowMapUV, float depth ) {

		if( shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadowMapDepth = unpackRGBAToDepth( texture2D( shadowMap, shadowMapUV ) );

		if( 0.0 >= shadowMapDepth || shadowMapDepth >= 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadow = depth <= shadowMapDepth ? 1.0 : 0.0;

		return vec2( shadow, shadowMapDepth );

	}

	float shadowMapPCF( sampler2D shadowMap, vec4 shadowMapCoord, vec2 shadowSize ) {

		float shadow = 0.0;

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i ++  ) {

			vec2 offset = poissonDisk[ i ] * shadowSize;

			shadow += compairShadowMapDepth( shadowMap, shadowMapCoord.xy + offset, shadowMapCoord.z ).x;

		}

		shadow /= float( SHADOW_SAMPLE_COUNT );

		return shadow;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float bias, vec4 shadowMapCoord ) {

		shadowMapCoord.xyz /= shadowMapCoord.w;
		shadowMapCoord.z += bias - 0.0001;

		initPoissonDisk(time);

		vec2 shadowSize = 1.0 / shadowMapSize;

		return shadowMapPCF( shadowMap, shadowMapCoord, shadowSize );

	}

#endif

/*-------------------------------
	RE
-------------------------------*/

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

float gSchlick( float d, float k ) {

	if( d == 0.0 ) return 0.0;

	return d / ( d * ( 1.0 - k ) + k );

}

float gSmith( float dNV, float dNL, float roughness ) {

	float k = clamp( roughness * sqrt( 2.0 / PI ), 0.0, 1.0 );

	return gSchlick( dNV, k ) * gSchlick( dNL, k );

}

float fresnel( float d ) {

	float f0 = 0.04;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	// diffuse
	vec3 diffuse = lambert( mat.diffuseColor ) * irradiance;

	// specular
	float D = ggx( dNH, mat.roughness );
	float G = gSmith( dNV, dNL, mat.roughness );
	float F = fresnel( dLH );

	vec3 specular = (( D * G * F ) / ( 4.0 * dNL * dNV + 0.0001 ) * mat.specularColor ) * irradiance;

	vec3 c = vec3( 0.0 );
	c += diffuse * ( 1.0 - F ) + specular;

	return c;

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;
	mat.albedo = vec3( 0.2 );
	mat.roughness = 0.5;
	mat.metalness = 0.1;
	mat.opacity = 1.0;
	mat.opacity *= uVisibility;

	// if( mat.opacity < 0.5 ) discard;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	#ifdef USE_NORMAL_MAP

		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );

		#ifdef DOUBLE_SIDED

			tangent *= faceDirection;
			bitangent *= faceDirection;

		#endif

		mat3 vTBN = mat3( tangent, bitangent, geo.normal );

		vec3 mapN = texture2D( normalMap, vUv ).xyz;
		mapN = mapN * 2.0 - 1.0;
		geo.normal = normalize( vTBN * mapN );

	#endif

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Lighting
	-------------------------------*/

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;
				shadow = 1.0;

				#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHTS < NUM_DIR_LIGHT_SHADOWS

					shadow = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

				outColor += RE( geo, mat, light ) * shadow;

			}
		#pragma unroll_loop_end

	#endif

	#if defined( USE_ENV_MAP ) || defined( IS_REFLECTIONPLANE )

		float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
		float EF = fresnel( dNV );

	#endif

	/*-------------------------------
		Environment Lighting
	-------------------------------*/

	#ifdef USE_ENV_MAP

		vec3 refDir = reflect( geo.viewDirWorld, geo.normalWorld );
		refDir.x *= -1.0;

		vec4 envMapColor = textureCubeUV( envMap, geo.normalWorld, 1.0 ) * iblIntensity * envMapIntensity;
		outColor += mat.diffuseColor * envMapColor.xyz * ( 1.0 - mat.metalness );

	#endif

	/*-------------------------------
		Reflection
	-------------------------------*/

	#ifdef IS_REFLECTIONPLANE

		vec2 refUV = gl_FragCoord.xy / renderResolution;

		refUV.x += geo.normal.x * 0.5;

		float l = (mat.roughness ) * 1.6 * REF_MIPMAP_LEVEL;

		float offset1 = floor( l );
		float offset2 = offset1 + 1.0;
		float blend = fract( l );

		vec2 ruv1 = getRefMipmapUV( refUV, offset1 );
		vec2 ruv2 = getRefMipmapUV( refUV, offset2 );

		vec3 ref1 = textureBicubic( reflectionTex, ruv1, mipMapResolution ).xyz;
		vec3 ref2 = textureBicubic( reflectionTex, ruv2, mipMapResolution ).xyz;

		vec3 ref = mat.specularColor * mix( ref1, ref2, blend );

		outColor = mix(
			outColor + ref * mat.metalness,
			ref,
			EF
		);

	#elif defined( USE_ENV_MAP )

		vec3 env = mat.specularColor * textureCubeUV( envMap, refDir, mat.roughness ).xyz * envMapIntensity;

		outColor = mix(
			outColor + env * mat.metalness,
			env,
			EF
		);

	#endif

	/*-------------------------------
		Emission
	-------------------------------*/

	#ifdef USE_EMISSION_MAP

		outColor += LinearTosRGB( texture2D( emissionMap, vUv ) ).xyz;

	#else

		outColor += emission;

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="149">
<source>src/ts/MainScene/World/Sections/Section3/Lights/shaders/wire.vs</source>
<document_content>
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec2 vHighPrecisionZW;

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	vec4 flipedTangent = tangent;
	flipedTangent.w *= -1.0;

	#ifdef FLIP_SIDED
		transformedNormal *= -1.0;
		flipedTangent *= -1.0;
	#endif

	vec3 normal = normalize( transformedNormal );
	vec3 tangent = normalize( ( modelViewMatrix * vec4( flipedTangent.xyz, 0.0 ) ).xyz );
	vec3 biTangent = normalize( cross( normal, tangent ) * flipedTangent.w );

	/*-------------------------------
		Shadow
	-------------------------------*/

	vec4 shadowWorldPos;

	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPos = worldPos + vec4( vec4( transformedNormal, 0.0 ) * modelMatrix ) * directionalLightShadows[ i ].shadowNormalBias;
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPos;

		}
		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vTangent = tangent;
	vBitangent = biTangent;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="150">
<source>src/ts/MainScene/World/Sections/Section3/Sec3Particle/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import particlesVert from './shaders/sec3Particle.vs';
import particlesFrag from './shaders/sec3Particle.fs';

export class Sec3Particle extends THREE.Mesh {

	private animator: ORE.Animator;
	public commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		let num = 100;
		let range = new THREE.Vector3( 7.0, 8.0, 7.0 );

		let offsetPosArray: number[] = [];
		let numArray: number[] = [];

		for ( let i = 0; i < num; i ++ ) {

			offsetPosArray.push(
				Math.random() * range.x,
				Math.random() * range.y,
				Math.random() * range.z,
			);

			numArray.push( i, Math.random() * 0.95 + 0.05 );

		}

		let size = 0.2;
		let originGeo = new THREE.PlaneGeometry( size, size );

		let geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute( 'position', originGeo.getAttribute( 'position' ) );
		geo.setAttribute( 'uv', originGeo.getAttribute( 'uv' ) );
		geo.setIndex( originGeo.getIndex() );

		geo.setAttribute( 'offsetPos', new THREE.InstancedBufferAttribute( new Float32Array( offsetPosArray ), 3 ) );
		geo.setAttribute( 'num', new THREE.InstancedBufferAttribute( new Float32Array( numArray ), 2 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			range: {
				value: range
			},
			uTex: window.gManager.assetManager.getTex( 'sec3Particle' )
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.uVisibility = animator.add( {
			name: 'sec3ParticleVisibility',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: particlesVert,
			fragmentShader: particlesFrag,
			uniforms: uni,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		} );

		super( geo, mat );

		this.renderOrder = 999;

		this.animator = animator;

		this.commonUniforms = uni;
		this.frustumCulled = false;

	}

	public update( deltaTime: number ) {

		this.commonUniforms.time.value += deltaTime * ( this.animator.get<number>( 'particleTimeScale' ) || 1.0 );

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.visible = true;

		this.animator.animate( 'sec3ParticleVisibility', visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="151">
<source>src/ts/MainScene/World/Sections/Section3/Sec3Particle/shaders/sec3Particle.fs</source>
<document_content>
uniform sampler2D uTex;
uniform float uVisibility;
uniform float time;
varying vec2 vUv;
varying vec2 vNum;

//http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main( void ) {

	vec4 color = texture2D( uTex, vUv );

	vec3 colorHSV = rgb2hsv( color.xyz );
	colorHSV.x += time * 0.1 + vNum.y * 0.4;

	color.xyz = hsv2rgb( colorHSV );

	// if( color.x < 0.2 ) discard;

	gl_FragColor = vec4( color );

}
</document_content>
</document>
<document index="152">
<source>src/ts/MainScene/World/Sections/Section3/Sec3Particle/shaders/sec3Particle.vs</source>
<document_content>
attribute vec2 num;
attribute vec3 offsetPos;

uniform float time;
uniform vec3 range;
uniform float contentNum;
uniform float uVisibility;
varying float vAlpha;
varying vec2 vUv;
varying vec2 vNum;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )
#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

vec2 spriteUVSelector( vec2 uv, vec2 tile, float frames, float time ) {

	float t = floor(frames * mod( time, 1.0 ) );

	uv.x += mod(t, tile.x);
	uv.y -= floor(t / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

void main( void ) {

	vec3 oPos = offsetPos;
	float t = time * 0.5;

	vec3 hrange = range / 2.0;
	float center = linearstep( 5.0, 1.0, length( oPos.xz - range.xz / 2.0 ) );
	oPos.y += time * center;
	oPos = mod( oPos, range );
	oPos -= range / 2.0;
	oPos.xz *= rotate( time * center );
	oPos.xz *= 1.0 + (1.0 - uVisibility);

	vec3 pos = position;
	pos *= smoothstep( hrange.y, hrange.y - 0.5, abs( oPos.y ) );
	pos *= num.y;
	pos *= 1.0 + exp( -mod( time * 1.0 + num.y * 2.0, 1.0) * 7.0 ) * 3.0 * num.y;
	// pos.xy *= rotate( exp( -mod( time * 1.0 + num.y, 1.0) * 7.0 ) * TPI );
	pos.xy *= rotate( time * num.y );
	pos += oPos;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = spriteUVSelector( uv, vec2( 6.0, 1.0 ), 6.0, num.x / 4.0 );
	vNum = num;

}
</document_content>
</document>
<document index="153">
<source>src/ts/MainScene/World/Sections/Section3/Wire/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import wireVert from './shaders/wire.vs';
import wireFrag from './shaders/wire.fs';

export class Wire {

	private animator: ORE.Animator;
	private root: THREE.Mesh;
	private commonUniforms: ORE.Uniforms;

	constructor( root: THREE.Mesh, parentUniforms: ORE.Uniforms ) {

		this.root = root;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'wireVisibility',
			initValue: 0
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		this.root.material = new THREE.ShaderMaterial( {
			vertexShader: wireVert,
			fragmentShader: wireFrag,
			uniforms: ORE.UniformsLib.mergeUniforms( THREE.UniformsUtils.clone( THREE.UniformsLib.lights ), this.commonUniforms, {
			} ),
			transparent: true,
			lights: true,
		} );

		this.root.renderOrder = 5;

	}

	public switchVisibility( visibility: boolean ) {

		if ( visibility ) this.root.visible = true;

		this.animator.animate( 'wireVisibility', visibility ? 1 : 0, 1, () => {

			if ( ! visibility ) this.root.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="154">
<source>src/ts/MainScene/World/Sections/Section3/Wire/shaders/wire.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

/*-------------------------------
	Require
-------------------------------*/

#include <packing>

vec2 packing16( float value ) {

	float v1 = value * 255.0;
	float r = floor(v1);

	float v2 = ( v1 - r ) * 255.0;
	float g = floor( v2 );

	return vec2( r, g ) / 255.0;

}


/*-------------------------------
	Requiers
-------------------------------*/

#include <common>
#pragma glslify: random = require('./random.glsl' )

/*-------------------------------
	Material Uniforms
-------------------------------*/

uniform float time;
uniform float uVisibility;

/*-------------------------------
	Textures
-------------------------------*/

#ifdef USE_MAP

	uniform sampler2D map;

#else

	uniform vec3 color;

#endif

#ifdef USE_NORMAL_MAP

	uniform sampler2D normalMap;

#endif

#ifdef USE_ROUGHNESS_MAP

	uniform sampler2D roughnessMap;

#else

	uniform float roughness;

#endif

#ifdef USE_ALPHA_MAP

	uniform sampler2D alphaMap;

#else

	uniform float opacity;

#endif

#ifdef USE_METALNESS_MAP

	uniform sampler2D metalnessMap;

#else

	uniform float metalness;

#endif
#ifdef USE_EMISSION_MAP

	uniform sampler2D emissionMap;

#else

	uniform vec3 emission;

#endif

#ifdef IS_REFLECTIONPLANE

	uniform sampler2D reflectionTex;
	uniform vec2 renderResolution;
	uniform vec2 mipMapResolution;

#endif

/*-------------------------------
	Types
-------------------------------*/

struct Geometry {
	vec3 pos;
	vec3 posWorld;
	vec3 viewDir;
	vec3 viewDirWorld;
	vec3 normal;
	vec3 normalWorld;
};

struct Light {
	vec3 direction;
	vec3 color;
};

struct Material {
	vec3 albedo;
	vec3 diffuseColor;
	vec3 specularColor;
	float metalness;
	float roughness;
	float opacity;
};

/*-------------------------------
	Lights
-------------------------------*/

#if NUM_DIR_LIGHTS > 0

	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};

	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

/*-------------------------------
	EnvMap
-------------------------------*/

#ifdef USE_ENV_MAP

	uniform sampler2D envMap;
	uniform float envMapIntensity;
	uniform float iblIntensity;
	uniform float maxLodLevel;

	#define ENVMAP_TYPE_CUBE_UV
	#include <cube_uv_reflection_fragment>

#endif

/*-------------------------------
	Reflection
-------------------------------*/

#define REF_MIPMAP_LEVEL 8.0

#ifdef IS_REFLECTIONPLANE

	vec2 getRefMipmapUV( vec2 uv, float level ) {

		vec2 ruv = uv;

		if( level > 0.0 ) {

			ruv.x *= 1.0 / ( 3.0 * ( pow( 2.0, level ) / 2.0 ) );
			ruv.y *= 1.0 / ( pow( 2.0, level ) );
			ruv.y += 1.0 / ( pow( 2.0, level ) );
			ruv.x += 1.0 / 1.5;

		} else {

			ruv.x /= 1.5;

		}

		return ruv;

	}

	vec4 cubic(float v) {
		vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
		vec4 s = n * n * n;
		float x = s.x;
		float y = s.y - 4.0 * s.x;
		float z = s.z - 4.0 * s.y + 6.0 * s.x;
		float w = 6.0 - x - y - z;
		return vec4(x, y, z, w);
	}

	// https://stackoverflow.com/questions/13501081/efficient-bicubic-filtering-code-in-glsl
	vec4 textureBicubic(sampler2D t, vec2 texCoords, vec2 textureSize) {
		vec2 invTexSize = 1.0 / textureSize;
		texCoords = texCoords * textureSize - 0.5;
		vec2 fxy = fract(texCoords);
		texCoords -= fxy;
		vec4 xcubic = cubic(fxy.x);
		vec4 ycubic = cubic(fxy.y);
		vec4 c = texCoords.xxyy + vec2 (-0.5, 1.5).xyxy;
		vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
		vec4 offset = c + vec4 (xcubic.yw, ycubic.yw) / s;
		offset *= invTexSize.xxyy;
		vec4 sample0 = texture2D(t, offset.xz);
		vec4 sample1 = texture2D(t, offset.yz);
		vec4 sample2 = texture2D(t, offset.xw);
		vec4 sample3 = texture2D(t, offset.yw);
		float sx = s.x / (s.x + s.y);
		float sy = s.z / (s.z + s.w);
		return mix(
		mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
	}

#endif

/*-------------------------------
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;
	uniform float cameraNear;
	uniform float cameraFar;

#endif

#ifdef USE_SHADOWMAP

#if NUM_DIR_LIGHT_SHADOWS > 0

		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];

		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};

		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];

	#endif

	#define SHADOW_SAMPLE_COUNT 4

	vec2 poissonDisk[ SHADOW_SAMPLE_COUNT ];

	void initPoissonDisk( float seed ) {

		float r = 0.1;
		float rStep = (1.0 - r) / float( SHADOW_SAMPLE_COUNT );

		float ang = random( gl_FragCoord.xy * 0.01 + sin( time ) ) * PI2 * 1.0;
		float angStep = ( ( PI2 * 11.0 ) / float( SHADOW_SAMPLE_COUNT ) );

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i++ ) {

			poissonDisk[ i ] = vec2(
				sin( ang ),
				cos( ang )
			) * pow( r, 0.75 );

			r += rStep;
			ang += angStep;
		}

	}

	vec2 compairShadowMapDepth( sampler2D shadowMap, vec2 shadowMapUV, float depth ) {

		if( shadowMapUV.x < 0.0 || shadowMapUV.x > 1.0 || shadowMapUV.y < 0.0 || shadowMapUV.y > 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadowMapDepth = unpackRGBAToDepth( texture2D( shadowMap, shadowMapUV ) );

		if( 0.0 >= shadowMapDepth || shadowMapDepth >= 1.0 ) {

			return vec2( 1.0, 0.0 );

		}

		float shadow = depth <= shadowMapDepth ? 1.0 : 0.0;

		return vec2( shadow, shadowMapDepth );

	}

	float shadowMapPCF( sampler2D shadowMap, vec4 shadowMapCoord, vec2 shadowSize ) {

		float shadow = 0.0;

		for( int i = 0; i < SHADOW_SAMPLE_COUNT; i ++  ) {

			vec2 offset = poissonDisk[ i ] * shadowSize;

			shadow += compairShadowMapDepth( shadowMap, shadowMapCoord.xy + offset, shadowMapCoord.z ).x;

		}

		shadow /= float( SHADOW_SAMPLE_COUNT );

		return shadow;

	}

	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float bias, vec4 shadowMapCoord ) {

		shadowMapCoord.xyz /= shadowMapCoord.w;
		shadowMapCoord.z += bias - 0.0001;

		initPoissonDisk(time);

		vec2 shadowSize = 1.0 / shadowMapSize;

		return shadowMapPCF( shadowMap, shadowMapCoord, shadowSize );

	}

#endif

/*-------------------------------
	RE
-------------------------------*/

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;

float ggx( float dNH, float roughness ) {

	float a2 = roughness * roughness;
	a2 = a2 * a2;
	float dNH2 = dNH * dNH;

	if( dNH2 <= 0.0 ) return 0.0;

	return a2 / ( PI * pow( dNH2 * ( a2 - 1.0 ) + 1.0, 2.0) );

}

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

float gSchlick( float d, float k ) {

	if( d == 0.0 ) return 0.0;

	return d / ( d * ( 1.0 - k ) + k );

}

float gSmith( float dNV, float dNL, float roughness ) {

	float k = clamp( roughness * sqrt( 2.0 / PI ), 0.0, 1.0 );

	return gSchlick( dNV, k ) * gSchlick( dNL, k );

}

float fresnel( float d ) {

	float f0 = 0.04;

	return f0 + ( 1.0 - f0 ) * pow( 1.0 - d, 5.0 );

}

vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	// diffuse
	vec3 diffuse = lambert( mat.diffuseColor ) * irradiance;

	// specular
	float D = ggx( dNH, mat.roughness );
	float G = gSmith( dNV, dNL, mat.roughness );
	float F = fresnel( dLH );

	vec3 specular = (( D * G * F ) / ( 4.0 * dNL * dNV + 0.0001 ) * mat.specularColor ) * irradiance;

	vec3 c = vec3( 0.0 );
	c += diffuse * ( 1.0 - F ) + specular;

	return c;

}

/*-------------------------------
	Main
-------------------------------*/

void main( void ) {

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;
	mat.albedo = vec3( 0.2 );
	mat.roughness = 0.5;
	mat.metalness = 0.1;
	mat.opacity = 1.0;
	mat.opacity *= uVisibility;

	// if( mat.opacity < 0.5 ) discard;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Geometry
	-------------------------------*/

	float faceDirection = gl_FrontFacing ? 1.0 : -1.0;

	Geometry geo;
	geo.pos = -vViewPos;
	geo.posWorld = vWorldPos;
	geo.viewDir = normalize( vViewPos );
	geo.viewDirWorld = normalize( geo.posWorld - cameraPosition );
	geo.normal = normalize( vNormal ) * faceDirection;

	#ifdef USE_NORMAL_MAP

		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );

		#ifdef DOUBLE_SIDED

			tangent *= faceDirection;
			bitangent *= faceDirection;

		#endif

		mat3 vTBN = mat3( tangent, bitangent, geo.normal );

		vec3 mapN = texture2D( normalMap, vUv ).xyz;
		mapN = mapN * 2.0 - 1.0;
		geo.normal = normalize( vTBN * mapN );

	#endif

	geo.normalWorld = normalize( ( vec4( geo.normal, 0.0 ) * viewMatrix ).xyz );

	/*-------------------------------
		Lighting
	-------------------------------*/

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;
				shadow = 1.0;

				#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHTS < NUM_DIR_LIGHT_SHADOWS

					shadow = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

				outColor += RE( geo, mat, light ) * shadow;

			}
		#pragma unroll_loop_end

	#endif

	#if defined( USE_ENV_MAP ) || defined( IS_REFLECTIONPLANE )

		float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
		float EF = fresnel( dNV );

	#endif

	/*-------------------------------
		Environment Lighting
	-------------------------------*/

	#ifdef USE_ENV_MAP

		vec3 refDir = reflect( geo.viewDirWorld, geo.normalWorld );
		refDir.x *= -1.0;

		vec4 envMapColor = textureCubeUV( envMap, geo.normalWorld, 1.0 ) * iblIntensity * envMapIntensity;
		outColor += mat.diffuseColor * envMapColor.xyz * ( 1.0 - mat.metalness );

	#endif

	/*-------------------------------
		Reflection
	-------------------------------*/

	#ifdef IS_REFLECTIONPLANE

		vec2 refUV = gl_FragCoord.xy / renderResolution;

		refUV.x += geo.normal.x * 0.5;

		float l = (mat.roughness ) * 1.6 * REF_MIPMAP_LEVEL;

		float offset1 = floor( l );
		float offset2 = offset1 + 1.0;
		float blend = fract( l );

		vec2 ruv1 = getRefMipmapUV( refUV, offset1 );
		vec2 ruv2 = getRefMipmapUV( refUV, offset2 );

		vec3 ref1 = textureBicubic( reflectionTex, ruv1, mipMapResolution ).xyz;
		vec3 ref2 = textureBicubic( reflectionTex, ruv2, mipMapResolution ).xyz;

		vec3 ref = mat.specularColor * mix( ref1, ref2, blend );

		outColor = mix(
			outColor + ref * mat.metalness,
			ref,
			EF
		);

	#elif defined( USE_ENV_MAP )

		vec3 env = mat.specularColor * textureCubeUV( envMap, refDir, mat.roughness ).xyz * envMapIntensity;

		outColor = mix(
			outColor + env * mat.metalness,
			env,
			EF
		);

	#endif

	/*-------------------------------
		Emission
	-------------------------------*/

	#ifdef USE_EMISSION_MAP

		outColor += LinearTosRGB( texture2D( emissionMap, vUv ) ).xyz;

	#else

		outColor += emission;

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="155">
<source>src/ts/MainScene/World/Sections/Section3/Wire/shaders/wire.vs</source>
<document_content>
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec2 vHighPrecisionZW;

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

void main( void ) {

	/*-------------------------------
		Position
	-------------------------------*/

	vec3 pos = position;
	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Normal / Tangent
	-------------------------------*/

	vec3 transformedNormal = normalMatrix * normal;
	vec4 flipedTangent = tangent;
	flipedTangent.w *= -1.0;

	#ifdef FLIP_SIDED
		transformedNormal *= -1.0;
		flipedTangent *= -1.0;
	#endif

	vec3 normal = normalize( transformedNormal );
	vec3 tangent = normalize( ( modelViewMatrix * vec4( flipedTangent.xyz, 0.0 ) ).xyz );
	vec3 biTangent = normalize( cross( normal, tangent ) * flipedTangent.w );

	/*-------------------------------
		Shadow
	-------------------------------*/

	vec4 shadowWorldPos;

	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {

			shadowWorldPos = worldPos + vec4( vec4( transformedNormal, 0.0 ) * modelMatrix ) * directionalLightShadows[ i ].shadowNormalBias;
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPos;

		}
		#pragma unroll_loop_end

	#endif

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vNormal = normal;
	vTangent = tangent;
	vBitangent = biTangent;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="156">
<source>src/ts/MainScene/World/Sections/Section3/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Section, ViewingState } from '../Section';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Displays } from './Displays';
import { Lights } from './Lights';
import { BackText } from './BackText';
import { CursorLight } from './CursorLight';
import { Wire } from './Wire';
import { Sec3Particle } from './Sec3Particle';

export class Section3 extends Section {

	private displays?: Displays;
	private lights?: Lights;
	private wire?: Wire;
	private directionLightList: THREE.DirectionalLight[] = [];
	private backText?: BackText;
	private cursorLight: CursorLight;
	private renderer: THREE.WebGLRenderer;
	private particle?: Sec3Particle;

	private info?: ORE.LayerInfo;

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms, renderer: THREE.WebGLRenderer ) {

		super( manager, 'section_3', ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uEnvMap: {
				value: null
			}
		} ) );

		// params

		this.renderer = renderer;
		this.elm = document.querySelector( '.section3' ) as HTMLElement;
		this.ppParam.bloomBrightness = 1.5;
		this.bakuParam.rotateSpeed = 0.0;
		this.cameraSPFovWeight = 18;

		/*-------------------------------
			Light
		-------------------------------*/

		this.light2Data = {
			intensity: 1,
			position: new THREE.Vector3( - 3.0, - 11.0, - 3.0 ),
			targetPosition: new THREE.Vector3( 0, - 11.0, 0 ),
		};

		// cursorLight

		this.cursorLight = new CursorLight();
		this.add( this.cursorLight );

	}

	protected onLoadedGLTF( gltf: GLTF ): void {

		this.add( gltf.scene );

		/*-------------------------------
			Displays
		-------------------------------*/

		this.displays = new Displays( this.getObjectByName( 'Displays' ) as THREE.Object3D, this.commonUniforms );
		this.displays.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Lights
		-------------------------------*/

		this.lights = new Lights( this.getObjectByName( 'Lights' ) as THREE.Object3D, this.commonUniforms );
		this.lights.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Wire
		-------------------------------*/

		this.wire = new Wire( this.getObjectByName( 'Wire' )as THREE.Mesh, this.commonUniforms );
		this.wire.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			BackText
		-------------------------------*/

		this.backText = new BackText( this.getObjectByName( 'BackText' ) as THREE.Mesh, this.commonUniforms );
		this.backText.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Particle
		-------------------------------*/

		let baku = this.getObjectByName( 'Baku' )!;

		this.particle = new Sec3Particle( this.commonUniforms );
		this.particle.switchVisibility( this.sectionVisibility );
		this.particle.position.copy( baku.position );
		this.particle.position.y += 2.8;

		this.add( this.particle );

		if ( this.info ) {

			this.resize( this.info );

		}

	}

	public update( deltaTime: number ) {

		super.update( deltaTime );

		this.cursorLight.update( deltaTime );
		this.cursorLight.intensity = this.animator.get( 'sectionVisibility' + this.sectionName ) || 0;

	}

	public resize( info: ORE.LayerInfo ) {

		super.resize( info );

		this.info = info;

	}

	public switchViewingState( viewing: ViewingState ): void {

		super.switchViewingState( viewing );

		if ( this.backText ) this.backText.switchVisibility( this.sectionVisibility );

		window.cameraController.switchCameraMove( this.sectionVisibility );

		if ( this.lights ) this.lights.switchVisibility( this.sectionVisibility );

		if ( this.wire ) this.wire.switchVisibility( this.sectionVisibility );

		if ( this.displays ) this.displays.switchVisibility( this.sectionVisibility );

		if ( this.particle ) this.particle.switchVisibility( this.sectionVisibility );

	}

	public hover( args: ORE.TouchEventArgs ) {

		this.cursorLight.hover( args );

	}


}

</document_content>
</document>
<document index="157">
<source>src/ts/MainScene/World/Sections/Section4/Peoples/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import comPosition from './shaders/computePosition.glsl';
import comVelocity from './shaders/computeVelocity.glsl';

import peopleVert from './shaders/people.vs';
import peopleFrag from './shaders/people.fs';

declare interface Kernels{
    velocity: ORE.GPUComputationKernel,
    position: ORE.GPUComputationKernel
}

declare interface Datas{
    velocity: ORE.GPUcomputationData,
    position: ORE.GPUcomputationData
}

export class Peoples extends THREE.Mesh {

	private renderer: THREE.WebGLRenderer;
	private animator: ORE.Animator;

	private num: number;

	private gCon: ORE.GPUComputationController;
	private kernels: Kernels;
	private datas: Datas;

	private meshUniforms: ORE.Uniforms;
	private commonUniforms: ORE.Uniforms;

	private avoidRoot: THREE.Object3D;
	private styleIndex: number = 0.0;

	constructor( renderer: THREE.WebGLRenderer, num: number, parentUniforms: ORE.Uniforms, avoidRoot: THREE.Object3D ) {

		let commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			deltaTime: {
				value: 1
			},
			uModelPosition: {
				value: null
			},
			uCursorPos: {
				value: new THREE.Vector3( 999, 999 )
			}
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		commonUniforms.uVisibility = animator.add( {
			name: 'peopleVisibility',
			initValue: 0,
			easing: ORE.Easings.linear,
		} );

		commonUniforms.uJump = animator.add( {
			name: 'peopleAscension',
			initValue: 0,
			easing: ORE.Easings.linear,
		} );

		/*-------------------------------
			CreateTrails
		-------------------------------*/

		// let size = 0.8;
		// let size = 0.7;
		// let size = 0.7;
		let size = 1.3;

		let originGeo = new THREE.PlaneGeometry( size, size );
		originGeo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeTranslation( 0.0, size / 2, 0.0 ) );
		originGeo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeScale( 1.0 * 0.5, 1.0, 1.0 ) );

		let geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute( 'position', originGeo.getAttribute( 'position' ) );
		geo.setAttribute( 'uv', originGeo.getAttribute( 'uv' ) );
		geo.setAttribute( 'normal', originGeo.getAttribute( 'normal' ) );
		geo.setIndex( originGeo.getIndex() );

		//instanecing attribute

		let computUVArray = [];

		for ( let i = 0; i < num; i ++ ) {

			for ( let j = 0; j < num; j ++ ) {

				computUVArray.push( j / ( num - 1 ), i / ( num - 1 ) );

			}

		}

		geo.setAttribute( 'computeUV', new THREE.InstancedBufferAttribute( new Float32Array( computUVArray ), 2 ) );

		let meshUniforms = ORE.UniformsLib.mergeUniforms( commonUniforms, {
			dataPos: {
				value: null
			},
			dataVel: {
				value: null
			},
			tex: window.gManager.assetManager.getTex( 'human' ),
			noiseTex: window.gManager.assetManager.getTex( 'noise' ),
			uPeopleStyle: window.gManager.animator.add( {
				name: 'peopleStyle',
				initValue: [ 1, 0, 0, 0 ],
			} )
		} );

		/*-------------------------------
			Super
		-------------------------------*/

		super( geo, new THREE.ShaderMaterial( {
			vertexShader: peopleVert,
			fragmentShader: peopleFrag,
			uniforms: meshUniforms,
			transparent: true,
			side: THREE.DoubleSide,
		} ) );


		this.castShadow = true;
		this.animator = animator;
		this.renderer = renderer;
		this.num = num;
		this.avoidRoot = avoidRoot;

		this.commonUniforms = commonUniforms;
		this.commonUniforms.uModelPosition.value = this.position;
		this.meshUniforms = meshUniforms;

		this.customDepthMaterial = new THREE.ShaderMaterial( {
			vertexShader: peopleVert,
			fragmentShader: peopleFrag,
			uniforms: meshUniforms,
			side: THREE.DoubleSide,
			defines: {
				DEPTH: ''
			}
		} );

		/*-------------------------------
			GPU Controller
		-------------------------------*/

		let avoidList:{
			position: THREE.Vector3,
			scale: THREE.Vector3,
		}[] = [];

		this.avoidRoot.children.forEach( item => {

			item.visible = false;

			avoidList.push( {
				position: item.position,
				scale: item.scale,
			} );

		} );

		let gpuCommonUniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			uAvoid: {
				value: avoidList
			}
		} );

		this.gCon = new ORE.GPUComputationController( this.renderer, new THREE.Vector2( num, num ) );

		// create computing position kernel

		let posUni = ORE.UniformsLib.mergeUniforms( gpuCommonUniforms, {
			dataPos: { value: null },
			dataVel: { value: null },
		} );

		let posKernel = this.gCon.createKernel( {
			fragmentShader: comPosition,
			uniforms: posUni
		} );

		// create computing velocity kernel

		let velUni = ORE.UniformsLib.mergeUniforms( gpuCommonUniforms, {
			dataPos: { value: null },
			dataVel: { value: null },
		} );

		let velKernel = this.gCon.createKernel( {
			fragmentShader: comVelocity.replace( /AVOID_COUNT/g, avoidList.length.toString() ),
			uniforms: velUni
		} );

		// matomeru

		this.kernels = {
			position: posKernel,
			velocity: velKernel,
		};

		this.datas = {
			position: this.gCon.createData( this.createInitialPositionData() ),
			velocity: this.gCon.createData(),
		};

		this.frustumCulled = false;

		/*-------------------------------
			Cursor
		-------------------------------*/

		window.gManager.eRay.addEventListener( 'hover/CommonGround', ( e ) => {

			let intersection = e.intersection as THREE.Intersection;
			let p = intersection.point;

			this.commonUniforms.uCursorPos.value.copy( this.worldToLocal( new THREE.Vector3( p.x, p.y, p.z ) ) );

		} );

	}

	private createInitialPositionData() {

    	let dataArray: number[] = [];

    	for ( let i = 0; i < this.num; i ++ ) {

			for ( let j = 0; j < this.num; j ++ ) {

				let r = Math.random() * Math.PI * 2.0;

				let radius = 0.0 + Math.random() * 18.0;

				let pos = [
					Math.sin( r ) * radius,
					0.0,
					Math.cos( r ) * radius,
					0,
				];

				pos.forEach( item => {

					dataArray.push( item );

				} );

    		}

    	}

    	let tex = new THREE.DataTexture( new Float32Array( dataArray ), this.num, this.num, THREE.RGBAFormat, THREE.FloatType );
		tex.needsUpdate = true;

		return tex;

	}

	public update( deltaTime: number ) {

		if ( ! this.visible ) return;

		this.commonUniforms.deltaTime.value = deltaTime;

		this.kernels.velocity.uniforms.dataPos.value = this.datas.position.buffer.texture;
		this.kernels.velocity.uniforms.dataVel.value = this.datas.velocity.buffer.texture;
		this.gCon.compute( this.kernels.velocity, this.datas.velocity );

		this.kernels.position.uniforms.dataPos.value = this.datas.position.buffer.texture;
		this.kernels.position.uniforms.dataVel.value = this.datas.velocity.buffer.texture;
		this.gCon.compute( this.kernels.position, this.datas.position );

		this.meshUniforms.dataPos.value = this.datas.position.buffer.texture;
		this.meshUniforms.dataVel.value = this.datas.velocity.buffer.texture;

	}

	private visibility: boolean = false;
	private ascension: boolean = false;

	public switchVisibility( visible: boolean, duration: number ) {

		if ( this.visibility == visible ) return;

		this.animator.animate( 'peopleVisibility', visible ? 1 : 0, duration );

		this.visibility = visible;


	}

	public switchAscension( ascension: boolean, duration: number ) {

		if ( this.ascension == ascension ) return;

		this.animator.animate( 'peopleAscension', ascension ? 1 : 0, duration );
		this.ascension = ascension;

	}

	public jump() {

		let styleArray = [ 0, 0, 0, 0 ];
		this.styleIndex = ( this.styleIndex + 1 ) % styleArray.length;
		styleArray[ this.styleIndex ] = 1.0;

		this.animator.animate( 'peopleStyle', styleArray, 0.2 );

	}

	public updateCursor( pos: THREE.Vector3 ) {

		this.commonUniforms.cursorPos.value.copy( pos );

	}

}

</document_content>
</document>
<document index="158">
<source>src/ts/MainScene/World/Sections/Section4/Peoples/shaders/computePosition.glsl</source>
<document_content>
uniform vec2 dataSize;
uniform sampler2D dataPos;
uniform sampler2D dataVel;

void main() {
	vec2 uv = gl_FragCoord.xy / dataSize.xy;
	vec4 pos = texture2D( dataPos, uv );
	vec4 vel = texture2D( dataVel, uv );

	pos += vel;
	pos.y = max( 0.0, pos.y );

	gl_FragColor = vec4(pos.xyz, mod( pos.w + 0.01, 1.0 ) );
}