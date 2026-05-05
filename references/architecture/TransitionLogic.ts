function() { this.emit( 'end' ) } )
		.pipe( gulp.dest( outDir + '/js/' ) )

	cb();

}

const buildSass = () => {

	return gulp.src( srcDir + '/scss/style.scss' )
		.pipe( plumber( {

			errorHandler: ( err ) => {
			console.log( err.messageFormatted );
			this.emit('end');

		} } ) )
		.pipe( sass() )
		.pipe( autoprefixer( [ 'last 2 versions'] ) )
		.pipe( cssmin() )
		.pipe( gulp.dest( outDir + '/css/' ) )
		.pipe( browserSync.stream() );

}

const copy = ( c ) => {

	gulp.src( [srcDir + '/html/**/*'] ).pipe( gulp.dest( outDir ) );
	gulp.src( [srcDir + '/assets/**/*'] ).pipe( gulp.dest( outDir + '/assets/' ) );

	c();

}

const brSync = () => {

	browserSync.init( {
		server: {
			baseDir: outDir,
			index: 'index.html'
		},
		open: true,
		notify: false,
		ghostMode: false
	} );

}

const clean = ( c ) => {

	del(
		[ outDir ],
		{
			force: true,
		}
	).then( () => {

		c();

	} );

}

const reload = ( cb ) => {

	browserSync.reload();

	cb && cb();

}

const watch = () => {

	gulp.watch( srcDir + '/scss/**/*', gulp.series( buildSass ) );
	gulp.watch( srcDir + '/html/**/*', gulp.series( copy, reload ) );
	gulp.watch( srcDir + '/assets/**/*', gulp.series( copy, reload ) );

}

exports.default = gulp.series(
	clean,
	setDevMode,
	gulp.parallel( buildWebpack, buildSass ),
	copy,
	gulp.parallel( brSync, watch )
);

exports.build = gulp.series(
	clean,
	setPrdMode,
	gulp.parallel( buildWebpack, buildSass ),
	copy,
)

exports.lint = gulp.task( lint );
</document_content>
</document>
<document index="9">
<source>package.json</source>
<document_content>
{
  "name": "next.junni.co.jp",
  "version": "1.0.0",
  "description": "",
  "repository": {
    "type": "git",
    "url": "https://github.com/junni-inc/next.junni.co.jp"
  },
  "scripts": {
    "dev": "npx gulp",
    "build": "npx gulp build"
  },
  "author": "junni",
  "bugs": {
    "url": ""
  },
  "devDependencies": {
    "@babel/core": "^7.16.12",
    "@babel/preset-env": "^7.16.11",
    "@babel/register": "^7.16.9",
    "@types/cannon": "^0.1.8",
    "@types/three": "^0.144.0",
    "@typescript-eslint/eslint-plugin": "^5.10.1",
    "@typescript-eslint/parser": "^5.10.1",
    "browser-sync": "^2.27.7",
    "del": "^6.0.0",
    "eslint": "^8.7.0",
    "eslint-config-mdcs": "^5.0.0",
    "fancy-log": "^2.0.0",
    "glslify-hex": "^2.1.1",
    "glslify-import": "^3.1.0",
    "glslify-loader": "^2.0.0",
    "gulp": "^4.0.2",
    "gulp-autoprefixer": "^8.0.0",
    "gulp-cssmin": "^0.2.0",
    "gulp-eslint": "^6.0.0",
    "gulp-if": "^3.0.0",
    "gulp-plumber": "^1.2.1",
    "gulp-sass": "^5.1.0",
    "raw-loader": "^4.0.2",
    "sass": "^1.49.0",
    "supports-color": "8.1.1",
    "ts-loader": "^9.2.6",
    "typescript": "^4.5.5",
    "webpack": "^5.67.0",
    "webpack-stream": "^7.0.0"
  },
  "dependencies": {
    "@tweakpane/core": "^1.1.0",
    "cannon": "^0.6.2",
    "lethargy": "^1.0.9",
    "three": "^0.145.0",
    "tweakpane": "^3.1.0",
    "wolfy87-eventemitter": "^5.2.9"
  }
}

</document_content>
</document>
<document index="10">
<source>recruit.junni.co.jp.code-workspace</source>
<document_content>
{
	"folders": [
		{
			"path": "."
		}
	],
	"settings": {
		"editor.detectIndentation": false,
		"editor.insertSpaces": false,
		"editor.tabSize": 4,
		"editor.codeActionsOnSave": {
			"source.fixAll.eslint": true
		}
	}
}
</document_content>
</document>
<document index="11">
<source>src/glsl-chunks/atan2.glsl</source>
<document_content>
// https://qiita.com/7CIT/items/ad76cfa6771641951d31

float atan2(in float y, in float x) {
  return x == 0.0 ? sign(y) * 3.1415926535 / 2.0 : atan(y, x);
}

#pragma glslify: export(atan2)
</document_content>
</document>
<document index="12">
<source>src/glsl-chunks/constants.glsl</source>
<document_content>
#define PI 3.14159265359
#define TPI 6.28318530718
#define HPI 1.57079632679

</document_content>
</document>
<document index="13">
<source>src/glsl-chunks/easings.glsl</source>
<document_content>
//  ------

// https://easings.net/

float easeInQuart( float t ) {

	return t * t * t;

}

float easeOutQuart( float t ) {

	return 1.0 - ( --t ) * t * t * t ;

}

float easeInOutQuad( float t ) {

	return t < 0.5 ? 2.0 * t * t : -1.0 + ( 4.0 - 2.0 * t ) * t;

}


float easeInOutQuart( float t ) {

	return t < 0.5 ? 8.0 * t * t * t * t : 1.0 -8.0 * ( --t ) * t * t * t;

}

// ------

float sigmoid( float x ) {

	float weight = 6.0;

	float e1 = exp( -weight * ( 2.0 * x - 1.0 ) );
	float e2 = exp( -weight );

	return ( 1.0 + ( 1.0 - e1 ) / ( 1.0 + e1 ) * ( 1.0 + e2 ) / ( 1.0 - e2 ) ) / 2.0;

}

#pragma glslify: export (sigmoid)
#pragma glslify: export (easeOutQuart)
#pragma glslify: export (easeInOutQuad)
#pragma glslify: export (easeInOutQuart)

</document_content>
</document>
<document index="14">
<source>src/glsl-chunks/gaussBlur13.glsl</source>
<document_content>
/*
https://github.com/Jam3/glsl-fast-gaussian-blur

The MIT License (MIT) Copyright (c) 2015 Jam3

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

vec4 blur13(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 / resolution)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 / resolution)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 / resolution)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 / resolution)) * 0.010381362401148057;
  return color;
}

#pragma glslify: export(blur13)

</document_content>
</document>
<document index="15">
<source>src/glsl-chunks/gaussBlur5.glsl</source>
<document_content>
/*
https://github.com/Jam3/glsl-fast-gaussian-blur

The MIT License (MIT) Copyright (c) 2015 Jam3

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  color += texture2D(image, uv) * 0.29411764705882354;
  color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
  color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
  return color;
}

#pragma glslify: export(blur5)

</document_content>
</document>
<document index="16">
<source>src/glsl-chunks/gaussBlur9.glsl</source>
<document_content>
/*
https://github.com/Jam3/glsl-fast-gaussian-blur

The MIT License (MIT) Copyright (c) 2015 Jam3

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
	vec4 color = vec4(0.0);
	vec2 off1 = vec2(1.3846153846) * direction;
	vec2 off2 = vec2(3.2307692308) * direction;
	color += texture2D(image, uv) * 0.2270270270;
	color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
	color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
	color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
	color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
	return color;
}

#pragma glslify: export(blur9)

</document_content>
</document>
<document index="17">
<source>src/glsl-chunks/hsv2rgb.glsl</source>
<document_content>
//https://qiita.com/keim_at_si/items/c2d1afd6443f3040e900

vec3 hsv2rgb( vec3 hsv ){

	return ((clamp(abs(fract(hsv.x+vec3(0,2,1)/3.)*6.-3.)-1.,0.,1.)-1.)*hsv.y+1.)*hsv.z;

}

#pragma glslify: export(hsv2rgb)

</document_content>
</document>
<document index="18">
<source>src/glsl-chunks/noise2D.glsl</source>
<document_content>
//
// Description : Array and textureless GLSL 2D simplex noise function.
//	  Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//	 Lastmod : 20110822 (ijm)
//	 License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//			   Distributed under the MIT License. See LICENSE file.
//			   https://github.com/ashima/webgl-noise
//			   https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise2D(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
					  0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
					 -0.577350269189626,  // -1.0 + 2.0 * C.x
					  0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

#pragma glslify: export(snoise2D)

</document_content>
</document>
<document index="19">
<source>src/glsl-chunks/noise3D.glsl</source>
<document_content>
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//			   noise functions.
//	  Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//	 Lastmod : 20110822 (ijm)
//	 License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//			   Distributed under the MIT License. See LICENSE file.
//			   https://github.com/ashima/webgl-noise
//			   https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
	 return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise3D(vec3 v)
  {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;	  // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
			 i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
		   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
		   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );	// mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
								dot(p2,x2), dot(p3,x3) ) );
  }

#pragma glslify: export(snoise3D)

</document_content>
</document>
<document index="20">
<source>src/glsl-chunks/noise4D.glsl</source>
<document_content>
//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//			   noise functions.
//	  Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//	 Lastmod : 20110822 (ijm)
//	 License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//			   Distributed under the MIT License. See LICENSE file.
//			   https://github.com/ashima/webgl-noise
//			   https://github.com/stegu/webgl-noise
//

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute(vec4 x) {
	 return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) {
	 return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip)
  {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

  return p;
  }

// (sqrt(5) - 1)/4 = F4, used once below
#define F4 0.309016994374947451

float snoise4D(vec4 v)
  {
  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
						0.276393202250021,  // 2 * G4
						0.414589803375032,  // 3 * G4
					   -0.447213595499958); // -1 + 4 * G4

// First corner
  vec4 i  = floor(v + dot(v, vec4(F4)) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
//  i0.x = dot( isX, vec3( 1.0 ) );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  //  x0 = x0 - 0.0 + 0.0 * C.xxxx
  //  x1 = x0 - i1  + 1.0 * C.xxxx
  //  x2 = x0 - i2  + 2.0 * C.xxxx
  //  x3 = x0 - i3  + 3.0 * C.xxxx
  //  x4 = x0 - 1.0 + 4.0 * C.xxxx
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

// Permutations
  i = mod289(i);
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
			 i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
		   + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
		   + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
		   + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));

// Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)			), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
			   + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

  }

#pragma glslify: export(snoise4D)

</document_content>
</document>
<document index="21">
<source>src/glsl-chunks/quaternion2mat4.glsl</source>
<document_content>
mat4 qua2mat( vec4 q ){

	mat4 m = mat4(
		1.0 - 2.0 * pow( q.y, 2.0 ) - 2.0 * pow( q.z, 2.0 ), 2.0 * q.x * q.y + 2.0 * q.w * q.z, 2.0 * q.x * q.z - 2.0 * q.w * q.y, 0.0,
		2.0 * q.x * q.y - 2.0 * q.w * q.z, 1.0 - 2.0 * pow( q.x, 2.0 ) - 2.0 * pow( q.z, 2.0 ), 2.0 * q.y * q.z + 2.0 * q.w * q.x, 0.0,
		2.0 * q.x * q.z + 2.0 * q.w * q.y, 2.0 * q.y * q.z - 2.0 * q.w * q.x, 1.0 - 2.0 * pow( q.x, 2.0 ) - 2.0 * pow( q.y, 2.0 ), 0.0,
		0.0, 0.0, 0.0, 1.0
	);

	return m;

}

#pragma glslify: export(qua2mat)

</document_content>
</document>
<document index="22">
<source>src/glsl-chunks/random.glsl</source>
<document_content>
// https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl

float random(vec2 p){
	return fract(sin(dot(p.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

#pragma glslify: export(random)

</document_content>
</document>
<document index="23">
<source>src/glsl-chunks/rotate.glsl</source>
<document_content>
mat2 rotate(float rad) {
  return mat2(cos(rad), sin(rad), -sin(rad), cos(rad));
}

#pragma glslify: export(rotate)
</document_content>
</document>
<document index="24">
<source>src/glsl-chunks/shader.d.ts</source>
<document_content>
declare module '*.glsl'{
	const value: string;
	export default value;
}
declare module '*.vs'{
	const value: string;
	export default value;
}
declare module '*.fs'{
	const value: string;
	export default value;
}

</document_content>
</document>
<document index="25">
<source>src/glsl-chunks/spriteUVSelector.glsl</source>
<document_content>

vec2 spriteUVSelector( vec2 uv, vec2 tile, float frames, float time ) {

	float t = floor(frames * mod( time, 1.0 ) );

	uv.x += mod(t, tile.x);
	uv.y -= floor(t / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

#pragma glslify: export(spriteUVSelector)
</document_content>
</document>
<document index="26">
<source>src/scss/global/_common.scss</source>
<document_content>
@use "./mixin" as *;

*{
    margin: 0;
	box-sizing: border-box;
}

html,body{
	background-color: #000;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

#canvas{
	width: 100%;
	height: 100%;
	pointer-events: none;
}

[data-media="pc"] {
	@include sp {
		display: none !important;
	}
}

[data-media="sp"] {
	@include pc {
		display: none !important;
	}
}
</document_content>
</document>
<document index="27">
<source>src/scss/global/_index.scss</source>
<document_content>
@forward "mixin";
@forward "common";
</document_content>
</document>
<document index="28">
<source>src/scss/global/_mixin.scss</source>
<document_content>
@use "./variables" as *;

@mixin sp($max-width:$sp-width) {
	@media only screen and(max-width: $max-width) {
		@content;
	}
}

@mixin pc($min-width:$sp-width) {
	@media only screen and(min-width: $min-width) {
		@content;
	}
}

</document_content>
</document>
<document index="29">
<source>src/scss/global/_variables.scss</source>
<document_content>
$width-middle:1200px;
$width-tab:1000px;
$sp-width: 800px;
</document_content>
</document>
<document index="30">
<source>src/scss/pages/home.scss</source>
<document_content>
@use "../global/" as *;
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Sans&family=Noto+Sans+JP&family=Jura&family=Noto+Serif&family=Comfortaa&family=Roboto+Serif:ital,opsz,wght@1,8..144,100&family=Roboto&display=swap');

$notosans: 'Noto Sans JP', 'Noto Sans', sans-serif;
$notoserif: 'Noto Serif', serif;
$bebas: 'Bebas Neue', cursive;
$jura: 'Jura', sans-serif;
$roboto: 'Roboto', sans-serif;;
$robotoSerif: 'Roboto Serif', serif;
$comfortaa: 'Comfortaa', cursive;

.content-wrapper {
	width: 100%;
	position: relative;
}

body {
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.tp-dfwv {
	z-index: 100;
}

.content {
	display: flex;
	width: 100%;
	height: 100%;
	z-index: 1;
	flex-direction: column;
}

.section {
	position: absolute;
	width: 100%;
	height: 100%;
	left: 0;
	top: 0;
	pointer-events: none;

	&[data-visible="true"] {
		pointer-events: auto;
	}

	&-wrap {
		position: relative;
		flex: 1;
		width: 100%;
		height: 100%;

		canvas {
			position: absolute;
			width: 100%;
			height: 100%;
			left: 0;
			top: 0;
			z-index: 0;
		}
	}
}

.header {
	position: relative;
	display: flex;
	width: 100%;
	height: 70px;
	align-items: center;
	justify-content: center;
	z-index: 10;

	@include sp {
		height: 50px;
	}

	&-logo {

		opacity: 0;
		transition: opacity 3.0s;
		transition-delay: 0.5s;

		&[data-visible="true"] {
			opacity: 1;
		}

		svg {
			width: 180px;

			@include sp {
				width: 135px;
			}

		}

	}
}

.footer {
	position: relative;
	width: 100%;
	height: 60px;
	background-color: #000;
	color: #fff;
	padding: 0 6%;

	display: flex;
	align-items: center;
	justify-content: space-between;
	z-index: 10;

	@include sp {
		height: 50px;
		padding: 0 5%;
	}

	&-timeline {

		position: relative;

		display: flex;
		justify-content: space-around;

		opacity: 0;
		transition: opacity 2s;
		width: 20%;
		max-width: 200px;

		@include sp {
			position: relative;
			flex: 1;
			left: unset;
			padding-right: 2vw;
		}

		&[data-visible="true"] {
			opacity: 1;
		}

		&-item {
			width: 20px;
			cursor: pointer;
			position: relative;

			display: flex;
			align-items: center;
			justify-content: center;

			&::before {
				content: "";
				width: 100%;
				padding-top: 100%;
			}

			&::after {
				content: "";
				position: absolute;
				width: 100%;
				height: 100%;
				border-radius: 50% 50%;
				background-color: #fff;
				transform: scale(0.3);
				transition: transform 0.5s ease-out, background-color 0.5s ease-out;
				z-index: 1;
			}

			&[data-state="ready" ] {
				&::after {
					background-color: #555;
				}
			}

			&[data-state="viewing" ] {
				pointer-events: none;
				&::after {
					transform: scale(0.6);
				}
			}

			&:hover {
				&::after {
					transform: scale(0.5);
				}
			}
		}

	}

	&-copyright {
		position: relative;
		opacity: 0;
		transition: opacity 2s;
		text-align: right;
		font-family: $roboto;
		font-size: 8px;
		letter-spacing: 0.2em;
		color: #777;

		&[data-visible="true"] {
			opacity: 1;
		}

		@include sp {
			position: relative;
			font-size: 8px;
			letter-spacing: 0.01em;
			padding-left: 2vw;
			right: 0%;
		}
	}
}

.subtitles {
	position: absolute;
	width: 100%;
	bottom: 60px;
	color: #fff;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	pointer-events: none;

	@include sp {
		bottom: 80px;
	}

	&-text {
		display: inline-block;
		text-align: center;
		user-select: none;


		span {
			background-color: rgba($color: #000000, $alpha: 0.9);
			padding: 5px 10px;
			font-family: $notosans;
			line-height: 2.0em;
			font-size: min( 15px, 2vw );
			box-decoration-break: clone;

			&[data-visible="false"] {
				opacity: 0;
				transition: opacity .5s;
			}

			@include sp {
				font-size: 2.8vw;
			}
		}

	}
}

.section2 {

	pointer-events: none;

	&[data-visible="true"] {
		pointer-events: auto;
	}

	&-head {
		position: absolute;
		width: 40%;
		transform: translateX(-100%) rotate(0);
		left: -2%;
		top: -15vw;

		transition: transform .5s cubic-bezier(.74,-0.02,.94,-0.32);

		[data-visible="true"] &{
			opacity: 1;
			transform: rotate(45deg) translateX(0%);
			transition: transform .7s cubic-bezier(0,1.33,.37,.99);
			transition-delay: 0.7s;

		}

	}

}

.section3 {
	&-message {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		opacity: 0;
		transition: opacity .3s;

		[data-visible="true"] &{
			opacity: 1;
		}

		&-inner {
			position: relative;
			width: 80%;
		}

		&-text {
			color: #fff;
			font-family: $jura;
			font-size: 1.5vw;
			letter-spacing: 0.4em;
			text-align: center;
			width: 100%;

			&.ja {
				font-size: 1.0vw;
				letter-spacing: 1.3vw;
				color: rgba($color: #fff, $alpha: 0.6);
			}

			@include sp {
				font-size: 3.5vw;
			}
		}

		&-deco {
			position: absolute;

			&.deco1 {
				right: 0;
				bottom: -3vw;
			}

			&.deco2 {
				left: 0;
				top: -3vw;
			}
		}
	}
}

.section5 {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	z-index: 0;

	opacity: 0;
	transition: opacity 1.0s;

	&[data-visible="true"] {
		opacity: 1;
		transition-delay: .5s;
	}

	&-content {
		width: 90%;
		max-width: 800px;

		display: flex;
		flex-direction: row-reverse;
		justify-content: space-around;

		&-sp {
			width: 100%;
			max-width: 600px;
			img {
				width: 100%;
			}
		}
	}

	&-text {
		position: relative;
		height: 50vh;
		max-height: 100%;
		writing-mode: vertical-rl;
		display: inline-block;
		padding: 0 10px;
		z-index: 0;

		@include sp {
			padding: 0 3px;
			font-size: 16px;
			letter-spacing: 0.2em;
			height: 50vh;
		}

		@for $i from 0 through 30 {
			&:nth-child(#{$i}) {
				z-index: #{-$i};
			}
		}

		&-inner {
			position: relative;
			display: inline-block;
			padding: 10px 0px;

			span {
				position: relative;
				display: inline-block;
				font-family: $notosans;
				font-size: 17px;
				letter-spacing: 0.35em;
				color: rgba($color: #fff, $alpha: 0.0);

				right: 15px;
				transition: color 2.0s, right 1.0s;

				[data-visible5line="true"] &{
					color: rgba($color: #fff, $alpha: 1.0);
					right: 0px;

					@for $i from 0 through 30 {
						&:nth-child(#{$i}) {
							transition-delay: #{0.2 + $i * 0.06}s;
						}
					}
				}
			}

			&::before {
				content: "";
				position: absolute;
				width: 100%;
				height: 100%;
				left: 0;
				top: 0;
				background-color: rgba($color: #000000, $alpha: 0.4);
				// z-index: 0;

				transform-origin: top;
				transform: scaleY( 0.0 );
				transition: transform 1.5s;

				[data-visible5line="true"] & {
					transform: scaleY( 1.0 );
				}

			}
		}

		&-wrap {

			pointer-events: none;
			user-select: none;

			display: flex;
			flex-direction: row-reverse;

		}


	}
}

.section6 {

	position: relative;

	width: 100%;
	height: 100%;

	&-main {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		opacity: 0;
		transition: opacity 1s;

		[data-visible="true"] & {

			opacity: 1;
			transition-delay: 1s;

		}

		&-head {
			font-family: $robotoSerif;
			font-size: 2.5vw;
			font-weight: normal;
			color: #fff;
			margin-bottom: 50px;
			text-align: center;

			@include sp{
				font-size: 7.0vw;
				line-height: 1.8em;
			}

			#next {
				display: inline;
				opacity: 0;
				transition: opacity 1s;
				transition-delay: 1.5s;

				[data-visible="true"] &{
					opacity: 1;
				}
				span {
					display: inline-block;
				}
			}

		}

		&-link {

			a {
				position: relative;
				display: block;
				text-decoration: none;
				font-family: $robotoSerif;
				font-size: 2.0vw;
				font-weight: 200;
				color: #fff;

				@include sp{
					font-size: 4.7vw;
					line-height: 1.8em;
				}

				.arrow {
					position: absolute;
					left: 104%;
					bottom: 20%;
					max-width: 50%;
					transition: transform .4s;
				}

				&:hover {
					.arrow {
						transform: translateX(5px);
					}
				}
			}
		}
	}

	&-link {
		position: absolute;
		left: 50%;
		bottom: 30px;
		transform: translateX(-50%);

		width: 60%;
		max-width: 300px;

		display: flex;
		justify-content: space-around;
		align-items: center;

		opacity: 0;
		transition: opacity 1s;

		[data-visible="true"] & {

			opacity: 1;
			transition-delay: 1s;

		}

		&-item {
			padding: 0 5px;

			&:nth-child(2) {
				padding: 0px;
			}

			a {
				display: block;

				&:hover {
					svg {
						transform: translateY(-5px);
					}
				}
			}

			svg {
				width: 100%;
				transition: transform .4s;
			}


		}


	}
}

.loading {
	position: absolute;
	width: 100%;
	height: 100%;
	background-color: #000;
	z-index: 100;

	display: flex;
	justify-content: center;
	align-items: center;

	transition: opacity .5s;

	&[data-visible="false"] {
		opacity: 0;
		pointer-events: none;
	}

	&-logo {
		width: 30%;
		max-width: 200px;
		opacity: 1;
		pointer-events: none;
		transition: opacity .5s;

		&[data-visible="false"] {
			opacity: 1;
		}

		svg {
			width: 100%;
		}
	}
}

.intro {

	position: absolute;
	width: 100%;
	height: 100%;

	&-inner {
		position: relative;
		width: 100%;
		height: 100%;

	}

	&-text {

		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;

		display: flex;
		justify-content: center;
		align-items: center;

		pointer-events: none;

		@include pc {
			opacity: 0;
		}

		&-item {
			position: absolute;
			color: #fff;
			font-family: $comfortaa;
			font-size: 20px;
			line-height: 1.5em;
			text-align: center;

			width: 95%;

			opacity: 0;
			transition: opacity 1s;

			&[data-visible="true"] {
				opacity: 1;
			}
		}
	}

	&-skip {
		position: absolute;
		right: 55px;
		bottom: 15px;
		color: #fff;

		transform: translateX(250%);
		transition: transform .8s;

		pointer-events: none;
		-webkit-tap-highlight-color: transparent;

		&[data-skipVisible="true"] {

			transform: translateX(0);
			cursor: pointer;
			pointer-events: auto;

		}

		$this: &;

		@include sp {
			right: 40px;
		}

		&:hover {
			#{$this}-inner {
				@keyframes jump {
					0% {
						transform: translateY(0);
						animation-timing-function: ease-out;
					}
					50% {
						transform: translateY( -10px );
						animation-timing-function: ease-in;
					}
					100% {
						transform: translateY(0);
					}
				}

				animation: jump 0.2s 0s 1 normal;
			}
		}

		&-inner {
			position: relative;
		}

		&-txt {
			position: absolute;
			width: 100%;

			opacity: 0;
			transform: rotate( -45deg ) scale(0);
			transition: opacity .1s, transform .5s cubic-bezier(.4,1.44,.74,1);

			[data-skipVisible="true"] & {

				transition-delay: 1s;
				transform: rotate( 0 ) scale(1);
				opacity: 1;

			}

			&-item {
				position: absolute;
				left: 40%;
				bottom: 100%;

				opacity: 0;

				&.skip {
					[data-skipTxt="skip"] & {
						opacity: 1;
					}
				}

				&.ok {
					[data-skipTxt="ok"] & {
						opacity: 1;
					}
				}

			}
		}

		&-baku {

			transition: transform .5s;

			[data-skipVisible="false"] & {
				transform: scaleX(-1);
			}
		}
	}

}

.scroll {
	position: absolute;
	bottom: 10px;
	width: 100px;
	height: 100px;
	border-radius: 50% 50%;
	// left: 5%;
	left: 50%;

	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
	pointer-events: none;

	transform: translateX(-50%);
	opacity: 0;
	transition: opacity .5s, transform .2s;

	&[data-visible="true"] {
		opacity: 1;
		pointer-events: auto;
	}

	@include pc {
		&:hover {
			transform: translateX(-50%) scale(0.95);
		}
	}

	&[data-visible="false"] {
		transform: translateX(-50%) scale(0.0);
	}

	@include sp {
		width: 72px;
		height: 72px;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
	}

	&-fillCircle {
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: #000;
		transform: translate(-50%, -50%) scale(0);
		border-radius: 50% 50%;
		transition: transform .2s ease-out;

		@include sp {
			display: none;
		}
	}

	$this: &;

	&:hover {
		#{$this}-fillCircle {
			transform: translate(-50%, -50%) scale(2);
		}

	}

	&-circle {
		@keyframes scrollRotate {
			0% {
				transform: rotate(0);
			}
			100% {
				transform: rotate(360deg);
			}
		}

		position: absolute;
		width: 100%;
		height: 100%;
		left: 0;
		top: 0;
		animation: scrollRotate 2s infinite linear;
		pointer-events: none;
	}

	&-btn {
		width: 100%;
		height: 100%;
		background-color: transparent;
		border: none;
		font-size: 11px;
		font-family: $notosans;
		letter-spacing: .2em;
		color: #fff;
		cursor: pointer;
		z-index: 1;

		@include sp {
			font-size: 9px;
		}
	}
}
</document_content>
</document>
<document index="31">
<source>src/scss/style.scss</source>
<document_content>
@use "./global";
@use "./pages/home"
</document_content>
</document>
<document index="32">
<source>src/ts/MainScene/CameraController/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export type CameraTransform = {
	position: THREE.Vector3;
	targetPosition: THREE.Vector3;
	fov: number,
	fovCalculated: number
}

export class CameraController {

	private animator: ORE.Animator;
	private portraitWeight: number = 0;

	// camera

	private camera: THREE.PerspectiveCamera;
	private baseCamera: THREE.PerspectiveCamera;

	// cursor

	private cursorPos: THREE.Vector2;
	public cursorPosDelay: THREE.Vector2;
	private cursorPosDelayVel: THREE.Vector2;

	// state

	private time: number = 0;
	private shakeTime: number = 0;

	private posData = {
		base: {
			pos: new THREE.Vector3( 0, 0, 3.49641 ),
			target: new THREE.Vector3( 0, 0, 0 )
		},
	};

	constructor( obj: THREE.PerspectiveCamera ) {

		this.camera = obj;
		this.baseCamera = new THREE.PerspectiveCamera( 40, 1.0, 0.1, 1000 );

		/*------------------------
			Animator
		------------------------*/

		this.animator = window.gManager.animator;

		this.animator.add( {
			name: 'cameraPos',
			initValue: this.posData.base.pos.clone(),
		} );

		this.animator.add( {
			name: 'cameraTargetPos',
			initValue: this.posData.base.target.clone(),
		} );

		this.animator.add( {
			name: 'cameraFov',
			initValue: 0,
		} );

		this.animator.add( {
			name: 'cameraMoveRange',
			initValue: new THREE.Vector2( 0.1, 0.1 ),
			userData: {
				pane: {}
			}
		} );

		this.animator.add( {
			name: 'cameraShake',
			initValue: 0,
			userData: {
				pane: {
					min: 0,
					max: 1
				}
			}
		} );

		this.animator.add( {
			name: 'cameraShakeTimeScale',
			initValue: 1,
			userData: {
				pane: {
					min: 0,
					max: 10
				}
			}
		} );

		this.animator.add( {
			name: 'cameraFovOffset',
			initValue: 0,
			userData: {
				pane: {
					min: - 50,
					max: 50
				}
			}
		} );

		this.animator.add( {
			name: 'cameraMove',
			initValue: 0,
			userData: {
				pane: {
					min: 0,
					max: 1
				}
			}
		} );

		this.cursorPos = new THREE.Vector2();
		this.cursorPosDelay = new THREE.Vector2();
		this.cursorPosDelayVel = new THREE.Vector2();

	}

	public updateTransform( cameraTransform: CameraTransform ) {

		this.animator.setValue( 'cameraPos', cameraTransform.position );
		this.animator.setValue( 'cameraTargetPos', cameraTransform.targetPosition );
		this.animator.setValue( 'cameraFov', cameraTransform.fov );

		this.camera.fov = cameraTransform.fovCalculated + ( this.animator.get<number>( 'cameraFovOffset' ) || 0 );
		this.camera.updateProjectionMatrix();

	}

	public updateCursor( pos: THREE.Vector2 ) {

		if ( pos.x != pos.x ) return;

		this.cursorPos.set( Math.min( 1.0, Math.max( - 1.0, pos.x ) ), Math.min( 1.0, Math.max( - 1.0, pos.y ) ) );

	}

	public update( deltaTime: number ) {

		deltaTime = Math.min( 0.3, deltaTime ) * 0.3;

		this.time += deltaTime;

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

		let basePos = this.animator.get<THREE.Vector3>( 'cameraPos' ) || new THREE.Vector3();

		let moveRange = this.animator.get( 'cameraMoveRange' ) as THREE.Vector2;

		this.camera.position.set(
			basePos.x + this.cursorPosDelay.x * moveRange.x,
			basePos.y + this.cursorPosDelay.y * moveRange.y,
			basePos.z
		);

		let fovOffset = this.animator.get<number>( 'cameraFovOffset' ) || 0;

		if ( fovOffset > 0 ) {

			this.camera.position.add( new THREE.Vector3( 0.0, 0.0, - fovOffset * 0.05 ).applyQuaternion( this.camera.quaternion ) );

		}

		let cameraMove = this.animator.get<number>( 'cameraMove' ) || 0;

		if ( cameraMove ) {

			let x = Math.sin( this.time ) * 1.5 * cameraMove * 0.0;
			let y = Math.cos( this.time * 1.3 ) * 0.1 * cameraMove;

			this.camera.position.add( new THREE.Vector3( x, y, 0.0 ) );

		}

		/*------------------------
			Target
		------------------------*/

		this.camera.lookAt( this.animator.get<THREE.Vector3>( 'cameraTargetPos' ) || new THREE.Vector3() );

		/*-------------------------------
			Shake
		-------------------------------*/

		let shake = this.animator.get<number>( 'cameraShake' ) || 0;

		if ( shake > 0 ) {

			let timeScale = this.animator.get<number>( 'cameraShakeTimeScale' ) || 1;

			this.shakeTime += deltaTime * timeScale;

			this.camera.applyQuaternion( new THREE.Quaternion().setFromEuler( new THREE.Euler(
				Math.sin( this.shakeTime * 7.0 ) * Math.sin( this.shakeTime * 4.0 ) * 0.1 * shake,
				Math.sin( this.shakeTime * 3.3 ) * Math.sin( this.shakeTime * 5.2 ) * 0.1 * shake,
			) ) );

		}

	}

	public resize( info: ORE.LayerInfo ) {

		this.portraitWeight = info.size.portraitWeight;

	}

	public changeRange( range: THREE.Vector2 ) {

		this.animator.animate( 'cameraMoveRange', range );

	}

	public shake( power: number = 0.15, duration : number = 1.0, shakeTimeScale: number = 8 ) {

		this.animator.setValue( 'cameraShakeTimeScale', shakeTimeScale );

		this.animator.animate( 'cameraShake', power, duration, () => {

			this.animator.setEasing( 'particleTimeScale', ORE.Easings.easeOutCubic );
			this.animator.animate( 'cameraFovOffset', 0, 4 );
			this.animator.animate( 'cameraShake', 0, duration );
			this.animator.animate( 'cameraShakeTimeScale', 2, 4 );

			this.animator.animate( 'particleTimeScale', 1, 4 );

		} );

	}

	public boost( ) {

		this.animator.setEasing( 'particleTimeScale', ORE.Easings.easeOutCubic );

		this.animator.setEasing( 'cameraShake', ORE.Easings.easeInOutCubic );

		this.animator.animate( 'cameraShakeTimeScale', 8, 0.8 );
		this.animator.animate( 'cameraShake', 0.15, 0.8, () => {

			this.animator.setEasing( 'particleTimeScale', ORE.Easings.easeOutCubic );
			this.animator.animate( 'cameraFovOffset', 0, 4 );
			this.animator.animate( 'cameraShake', 0, 2 );
			this.animator.animate( 'cameraShakeTimeScale', 2, 4 );

			this.animator.animate( 'particleTimeScale', 1, 4 );

		} );

	}

	public switchCameraMove( enable: boolean ) {

		this.animator.animate( 'cameraMove', enable ? 1 : 0, 3 );

	}

}

</document_content>
</document>
<document index="33">
<source>src/ts/MainScene/ContentSelector/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class Scroller {

	public enable: boolean = true;
	public value: number = 0;

	private commonUniforms: ORE.Uniforms;

	private selectingContentPos: number = 0;
	private touchStartContentPos: number | null = null;
	private moveVelocity: number = 0;

	public currentContent: number = - 1;
	private contentNum: number;

	private animator: ORE.Animator;
	private wheelStop: boolean = false;
	private isAnimating: boolean = false;

	private isTouching: boolean = false;
	private touchStartPos: number = 0;
	private touchMove: number = 0;

	constructor( contentNum: number, parentUniforms: ORE.Uniforms ) {

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.contentNum = contentNum;

		this.animator = window.gManager.animator;
		this.animator.add( {
			name: 'contentSelectorValue',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

	}

	public update( deltaTime: number ) {

		if ( this.isAnimating ) {

			this.value = this.animator.get( 'contentSelectorValue' ) || 0;

		} else if ( this.isTouching ) {

			this.value = this.touchStartPos + this.touchMove;

		} else {

			this.value += this.moveVelocity;

			this.calcVelocity( deltaTime );

		}

		this.commonUniforms.contentNum.value = ( this.contentNum - 1.0 ) - this.value;
		this.commonUniforms.contentFade.value = this.value >= 0 ? ( this.value % 1 ) : 1.0 + this.value % 1;

		this.checkCurrentContent();

	}

	private calcVelocity( deltaTime: number ) {

		this.selectingContentPos = Math.round( this.value );

		if ( this.selectingContentPos == this.touchStartContentPos ) {

			let diff = this.value - this.selectingContentPos;

			if ( Math.abs( diff ) > 0.1 ) {

				this.selectingContentPos += Math.sign( diff );

			}

		}

		this.selectingContentPos = Math.max( 0.0, Math.min( this.contentNum - 1.0, this.selectingContentPos ) );

		let diff = this.selectingContentPos - this.value;
		this.moveVelocity += diff * deltaTime * 0.3;
		this.moveVelocity *= 0.85;

	}

	private checkCurrentContent() {

		let nearest = Math.round( this.value );

		if ( ( 0 <= nearest && nearest < this.contentNum ) && nearest != this.currentContent ) {

			this.currentContent = nearest;

			this.wheelStop = false;

		}

	}

	public setCurrentContent( contentNum: number ) {

		this.value = contentNum;
		this.currentContent = contentNum;

	}

	public catch() {

		if ( ! this.enable ) return;

		this.touchStartPos = this.value;
		this.touchStartContentPos = this.isAnimating ? null : Math.max( 0.0, Math.min( this.contentNum - 1.0, Math.round( this.value ) ) );
		this.touchMove = 0;

		this.isTouching = true;
		this.isAnimating = false;

	}

	public drag( delta: number ) {

		if ( ! this.enable ) return;

		this.touchMove -= delta * 0.0005;

	}

	public release( delta: number ) {

		if ( ! this.enable ) return;

		this.isTouching = false;

		this.moveVelocity -= delta * 0.002;

	}

	public next() {

		if ( ! this.enable ) return;

		if ( this.wheelStop ) return;

		if ( this.move( Math.round( this.value + 1.0 ) ) ) {

			this.isAnimating = false;
			this.moveVelocity += 0.005;

		}

	}

	public prev() {

		if ( ! this.enable ) return;

		if ( this.wheelStop ) return;

		if ( this.move( Math.round( this.value - 1.0 ) ) ) {

			this.isAnimating = false;
			this.moveVelocity -= 0.005;

		}

	}

	private move( value: number ) {

		if ( value < 0 || this.contentNum <= value || Math.round( this.value ) < 0 || Math.round( this.value ) >= this.contentNum ) {

			this.wheelStop = false;
			return true;

		}

		let duration = 3.0;
		this.touchStartContentPos = - 1;
		this.isAnimating = true;
		this.wheelStop = true;
		this.animator.setValue( 'contentSelectorValue', this.value );
		this.animator.animate( 'contentSelectorValue', value, duration, () => {

			this.isAnimating = false;

		} );

	}

}

</document_content>
</document>
<document index="34">
<source>src/ts/MainScene/Footer/index.ts</source>
<document_content>
import EventEmitter from "wolfy87-eventemitter";

export class Footer extends EventEmitter {

	private elm: HTMLElement;
	private copyElm: HTMLElement;

	private timelineElm: HTMLElement;
	private timelineItemElmList: HTMLElement[] = [];

	constructor() {

		super( );

		this.elm = document.querySelector( '.footer' )!;
		this.copyElm = this.elm.querySelector( '.footer-copyright' )!;

		/*-------------------------------
			Timeline
		-------------------------------*/

		this.timelineElm = this.elm.querySelector( '.footer-timeline' )!;

		this.timelineItemElmList = Array.from( this.timelineElm.querySelectorAll( '.footer-timeline-item' ) );
		this.timelineItemElmList.forEach( elm=> {

			elm.addEventListener( 'click', ( e ) => {

				let elm = e.target as HTMLElement;
				let sectionNum = Number( elm.getAttribute( 'data-section' ) );

				if ( sectionNum == sectionNum ) {

					this.emitEvent( 'clickTimeline', [ sectionNum ] );

				}

			} );

		} );


		/*-------------------------------
			Init
		-------------------------------*/

		this.switchCopyVisibility( false );
		this.switchTimelineVisibility( false );

	}

	public switchCopyVisibility( visible: boolean ) {

		this.copyElm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

	}

	public switchTimelineVisibility( visible: boolean ) {

		this.timelineElm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

	}

	public changeTimelineSection( section: number ) {

		this.timelineItemElmList.forEach( elm => {

			let sectionNum = Number( elm.getAttribute( 'data-section' ) );

			let state = 'ready';

			if ( sectionNum == section ) state = 'viewing';
			if ( sectionNum < section ) state = 'passed';

			elm.setAttribute( 'data-state', state );

		} );


	}

}

</document_content>
</document>
<document index="35">
<source>src/ts/MainScene/GlobalManager/AssetManager/VideoTextureLoader/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class VideoTextureLoader extends THREE.EventDispatcher {

	private url: string;
	private subImgURL?: string;
	private loaded: boolean;

	private videoElm: HTMLVideoElement;

	constructor( url: string, imgURL?: string ) {

		super();

		this.url = url;
		this.subImgURL = imgURL;
		this.loaded = false;

		/*-------------------------------
			Load
		-------------------------------*/

		this.videoElm = document.createElement( 'video' ) as HTMLVideoElement;
		this.videoElm.muted = true;
		this.videoElm.autoplay = true;
		this.videoElm.setAttribute( 'playsinline', '' );

		this.videoElm.oncanplay = this.onVideoLoaded.bind( this );
		this.videoElm.oncanplaythrough = this.onVideoLoaded.bind( this );

		this.videoElm.src = this.url + '?v=' + Math.floor( Math.random() * 10000 ).toString();

		this.videoElm.onstalled = ( e ) => {

			this.createImageTexture();

		};

		this.videoElm.load();

	}


	private onVideoLoaded() {

		if ( this.loaded ) return;
		this.loaded = true;

		this.videoElm.play();

		let tex = new THREE.VideoTexture( this.videoElm );
		tex.image.width = tex.image.videoWidth;
		tex.image.height = tex.image.videoHeight;
		tex.wrapS = THREE.ClampToEdgeWrapping;
		tex.wrapT = THREE.ClampToEdgeWrapping;
		tex.needsUpdate = true;

		this.dispatchEvent( {
			type: 'load',
			tex: tex
		} );

		let duration = ( this.videoElm.duration - 0.5 );

		tex.onUpdate = () => {

			// repeat

			if ( this.videoElm.currentTime >= duration ) {

				this.videoElm.currentTime = 0;
				this.videoElm.play();

			}

		};

		document.addEventListener( 'visibilitychange', () => {

			setTimeout( () => {

				this.videoElm.play();

			}, 500 );

		} );

	}

	public createImageTexture() {

		if ( this.subImgURL ) {

			let loader = new THREE.TextureLoader();
			loader.crossOrigin = 'use-credentials';

			loader.load( this.subImgURL, ( tex ) => {

				this.dispatchEvent( {
					type: 'load',
					texture: tex
				} );

			} );

		}

	}

	public switchPlay( play: boolean ) {

		if ( play ) {

			this.videoElm.play();

		} else {

			this.videoElm.pause();

		}

	}

}

</document_content>
</document>
<document index="36">
<source>src/ts/MainScene/GlobalManager/AssetManager/index.ts</source>
<document_content>
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VideoTextureLoader } from './VideoTextureLoader';

export declare interface AssetManagerTexture {
	value: any;
	videoTexLoader?: VideoTextureLoader;
}

export declare interface AssetManagerAssetData {
	name: string;
	path: string;
	type: 'gltf' | 'tex' | 'videoTex';
	subImgPath?: string;
	timing?: 'pre' | 'must' | 'sub';
	onLoad?: ( value: any ) => void
}
export declare interface AssetManagerParams {
	assets: AssetManagerAssetData[];
}
export class AssetManager extends THREE.EventDispatcher {

	private textures: {[key:string]: AssetManagerTexture };
	private gltfs: {[key:string]: GLTF }

	private preLoadManager: THREE.LoadingManager;
	private mustLoadManager: THREE.LoadingManager;
	private subLoadManager: THREE.LoadingManager;

	constructor( ) {

		super();

		this.textures = {};
		this.gltfs = {};


		this.preLoadManager = new THREE.LoadingManager( undefined, ( url, loaded, total ) => {

			this.processEvent( 'processPreAssets', loaded, total );

		} );

		this.mustLoadManager = new THREE.LoadingManager( undefined, ( url, loaded, total ) => {

			this.processEvent( 'processMustAssets', loaded, total );

		} );

		this.subLoadManager = new THREE.LoadingManager( undefined, ( url, loaded, total ) => {

			this.processEvent( 'processSubAssets', loaded, total );

		} );

	}

	public async load( params: AssetManagerParams ) {

		params.assets.forEach( item => {

			if ( item.type == 'tex' || item.type == 'videoTex' ) {

				this.textures[ item.name ] = { value: null };

			}

		} );

		await this.loadAssets( params.assets.filter( item => item.timing == 'pre' ), this.preLoadManager );
		this.dispatchEvent( { type: 'loadPreAssets' } );

		await this.loadAssets( params.assets.filter( item => item.timing == 'must' || item.timing == undefined ), this.mustLoadManager );
		this.dispatchEvent( { type: 'loadMustAssets' } );

		await this.loadAssets( params.assets.filter( item => item.timing == 'sub' ), this.subLoadManager );
		this.dispatchEvent( { type: 'loadSubAssets' } );

	}

	private loadAssets( assets: AssetManagerAssetData[], manager: THREE.LoadingManager ) {

		let tex = assets.filter( item => item.type == 'tex' );
		let videoTex = assets.filter( item => item.type == 'videoTex' );
		let gltf = assets.filter( item => item.type == 'gltf' );

		/*-------------------------------
			Load Texture
		-------------------------------*/

		let texLoader = new THREE.TextureLoader( manager );

		tex.forEach( item => {

			texLoader.load( item.path, ( t ) => {

				this.textures[ item.name ].value = t;

				if ( item.onLoad ) {

					item.onLoad( t );

				}

			} );

		} );

		/*-------------------------------
			Load Video Texture
		-------------------------------*/

		videoTex.forEach( item => {

			let loader = new VideoTextureLoader( item.path, item.subImgPath );

			loader.addEventListener( 'load', ( e ) => {

				this.textures[ item.name ].value = e.tex;

				if ( item.onLoad ) {

					item.onLoad( e.tex );

				}

			} );

		} );

		/*-------------------------------
			Load glTF
		-------------------------------*/

		let gltfLoader = new GLTFLoader( manager );

		gltf.forEach( item => {

			gltfLoader.load( item.path, ( gltf ) => {

				this.gltfs[ item.name ] = gltf;

				if ( item.onLoad ) {

					item.onLoad( gltf );

				}

			} );

		} );

		/*-------------------------------
			Loading Finish
		-------------------------------*/

		let promise = new Promise( ( resolve ) => {

			manager.onLoad = () => {

				resolve( null );

			};

			if ( tex.length == 0 && gltf.length == 0 ) {

				setTimeout( () => {

					manager.onLoad();

				}, 0 );

			}

		} );

		return promise;

	}

	private processEvent( type: string, loaded: number, total: number ) {

		this.dispatchEvent( { type: type, value: loaded / total } );

	}

	public getTex( name: string ): AssetManagerTexture {

		let texture = this.textures[ name ];

		if ( ! texture ) {

			console.warn( 'texture: ' + name + ' is not exist.' );

			this.textures[ name ] = { value: null };

		}

		return this.textures[ name ];

	}

	public getGltf( name: string ): GLTF | undefined {

		let gltf = this.gltfs[ name ];

		if ( ! gltf ) {

			console.warn( 'gltf: ' + name + ' is not exist.' );

		}

		return gltf;

	}

}

</document_content>
</document>
<document index="37">
<source>src/ts/MainScene/GlobalManager/EasyRaycaster/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class EasyRaycaster extends THREE.EventDispatcher {

	private raycaster: THREE.Raycaster;
	public touchableObjects: THREE.Object3D[];

	/*-------------------------------
		Hover
	-------------------------------*/
	private hoverMemObj: THREE.Object3D | HTMLElement | null;

	/*-------------------------------
		Click
	-------------------------------*/
	private clickStart: number;
	private touchStartObj: THREE.Object3D | HTMLElement | null;

	constructor() {

		super();

		this.raycaster = new THREE.Raycaster();
		this.touchableObjects = [];
		this.hoverMemObj = null;
		this.touchStartObj = null;
		this.clickStart = 0;

	}

	private dispatchMouseEvent( type: 'enter' | 'out' | 'hover' | 'click', name: string, intersection?: THREE.Intersection ) {

		this.dispatchEvent( {
			type: type,
			intersection: intersection
		} );

		this.dispatchEvent( {
			type: type + '/' + name,
			intersection: intersection
		} );

	}

	public getIntersection( cursor: THREE.Vector2, camera: THREE.Camera, objects: THREE.Object3D[] ) {

		this.raycaster.setFromCamera( cursor, camera );

		let intersection = this.raycaster.intersectObjects( objects );

		for ( let i = 0; i < intersection.length; i ++ ) {

			if ( intersection[ i ].object.visible ) return intersection[ i ];

		}

		return null;

	}

	public update( cursor: THREE.Vector2, camera: THREE.Camera ) {

		let intersection = this.getIntersection( cursor, camera, this.touchableObjects );

		if ( intersection ) {

			if ( this.hoverMemObj ) {

				if ( 'isObject3D' in this.hoverMemObj ) {

					if ( intersection.object.uuid == this.hoverMemObj.uuid ) {

						this.dispatchMouseEvent( 'hover', intersection.object.name, intersection );

					} else {

						this.dispatchMouseEvent( 'out', this.hoverMemObj.name );
						this.dispatchMouseEvent( 'enter', intersection.object.name, intersection );

					}

				}

			} else {

				this.dispatchMouseEvent( 'enter', intersection.object.name, intersection );

			}

			this.hoverMemObj = intersection.object;

		} else {

			if ( this.hoverMemObj ) {

				if ( 'isObject3D' in this.hoverMemObj ) {

					this.dispatchMouseEvent( 'out', this.hoverMemObj.name );

				}

			}

		}

		this.hoverMemObj = intersection && intersection.object || null;

		return [];

	}

	public touchStart( cursor: THREE.Vector2, camera: THREE.Camera ) {

		let intersection = this.getIntersection( cursor, camera, this.touchableObjects );

		if ( intersection ) {

			this.clickStart = new Date().getTime();
			this.touchStartObj = intersection.object;

		}

	}

	public touchEnd( cursor: THREE.Vector2, camera: THREE.Camera ) {

		let intersection = this.getIntersection( cursor, camera, this.touchableObjects );

		if ( intersection && this.touchStartObj ) {

			let diff = new Date().getTime() - this.clickStart;

			if ( 'isObject3D' in this.touchStartObj ) {

				if ( intersection.object.uuid == this.touchStartObj.uuid && diff < 300 ) {

					this.dispatchMouseEvent( 'click', intersection.object.name, intersection );

				}

			}

		}

	}

}

</document_content>
</document>
<document index="38">
<source>src/ts/MainScene/GlobalManager/index.ts</source>
<document_content>
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';

import { AssetManager } from './AssetManager';
import { EasyRaycaster } from './EasyRaycaster';
import { Pane } from 'tweakpane';

export class GlobalManager extends EventEmitter {

	public eRay: EasyRaycaster;
	public assetManager: AssetManager;
	public animator: ORE.Animator;

	private pane: Pane;

	constructor( ) {

		super();

		window.gManager = this;

		this.eRay = new EasyRaycaster();

		this.assetManager = new AssetManager();

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = new ORE.Animator();

		// pane

		this.pane = new Pane();
		this.pane.hidden = true;

		this.animator.addEventListener( 'added', ( e ) => {

			let opt = e.variable.userData && e.variable.userData.pane;

			let variable = this.animator.dataBase[ e.varName ];

			if ( ! Array.isArray( variable ) && opt ) {

				this.pane.addInput( this.animator.dataBase, e.varName, opt );

			}

		} );

		window.addEventListener( 'keydown', ( e ) => {

			if ( e.key == 'n' ) {

				// this.pane.hidden = ! this.pane.hidden;

			}

		} );

	}

	public update( deltaTime: number ) {

		this.animator.update( deltaTime );

		this.pane.refresh();

	}

}


</document_content>
</document>
<document index="39">
<source>src/ts/MainScene/Header/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class Header {

	private elm: HTMLElement;
	private logoElm: HTMLElement;

	constructor() {

		this.elm = document.querySelector( '.header' )!;
		this.logoElm = this.elm.querySelector( '.header-logo' )!;

		this.switchLogoVisibility( false );

	}

	public switchLogoVisibility( visible: boolean ) {

		this.logoElm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

	}

}

</document_content>
</document>
<document index="40">
<source>src/ts/MainScene/Loading/index.ts</source>
<document_content>
export class Loading {

	private elm: HTMLElement;
	private logoElm: HTMLElement;

	constructor() {

		this.elm = document.querySelector( '.loading' )!;
		this.logoElm = document.querySelector( '.loading-logo' )!;

		this.switchVisibility( true );
		this.switchLogoVisibility( false );

	}

	public switchVisibility( visible: boolean ) {

		this.elm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

	}

	public switchLogoVisibility( visible: boolean ) {

		this.logoElm.setAttribute( 'data-visible', visible ? 'true' : 'false' );

	}

}

</document_content>
</document>
<document index="41">
<source>src/ts/MainScene/NoiseText/index.ts</source>
<document_content>

export class NoiseText {

	public elm: HTMLElement;
	public text: string = '';
	public noise: string = ' ';

	public tickRate: number = 10;
	private startTime: number = 0;
	private duration : number = 0;

	private interval: number | null = null;

	public onFinishAnimation?: () => void;
	public onFinishHide?: () => void;

	constructor( elm: HTMLElement ) {

		this.elm = elm;

	}

	public show( text: string, duration: number = 1, tickRate?: number, callback?: () => void ) {

		this.text = text;

		this.stopAnimation();

		this.startTime = new Date().getTime();
		this.elm.innerText = '';
		this.visible = true;
		this.elm.setAttribute( 'data-visible', 'true' );

		this.duration = duration;
		this.onFinishAnimation = callback;

		if ( tickRate ) {

			this.tickRate = tickRate;

		}

		this.interval = window.setInterval( () => {

			this.draw();

		}, this.tickRate );


	}

	public hide( ) {

		this.stopAnimation();

		this.elm.setAttribute( 'data-visible', 'false' );

		this.startTime = new Date().getTime();
		this.visible = false;

		setTimeout( () => {

			if ( this.onFinishHide ) {

				this.onFinishHide();

			}

		}, 500 );


	}

	public clear() {

		this.elm.innerHTML = '';

	}

	private draw() {

		let currentTime = new Date().getTime();
		let time = ( currentTime - this.startTime ) / 1000;

		let st = Math.min( 1.0, time / this.duration );

		let fixedLength = st * this.text.length;
		let randomLength = Math.min( 3, this.text.length - fixedLength );

		let text = '';

		for ( let i = 0; i < fixedLength; i ++ ) {

			text += this.text[ i ];

		}

		for ( let i = 0; i < randomLength; i ++ ) {

			text += this.noise[ Math.floor( Math.random() * ( this.noise.length - 1.0 ) ) ];

		}

		this.elm.innerHTML = text;

		if ( time >= this.duration ) {

			if ( this.onFinishAnimation ) {

				this.onFinishAnimation();

			}

			this.stopAnimation();

		}

	}

	private stopAnimation() {

		if ( this.interval === null ) return;

		window.clearInterval( this.interval );

		this.interval = null;

	}

	public set visible( value: boolean ) {

		this.elm.setAttribute( 'data-visible', value ? "true" : "false" );

	}

}

</document_content>
</document>
<document index="42">
<source>src/ts/MainScene/RenderPipeline/MipMapGeometry.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class MipmapGeometry extends THREE.BufferGeometry {

	public count: number = 0;

	constructor( count: number = 7 ) {

		super();

		this.count = count;

		let posArray = [];
		let uvArray = [];
		let indexArray = [];

		let p = new THREE.Vector2( 0, 0 );
		let s = 1.0;

		// posArray.push( p.x, p.y, 0 );
		// posArray.push( p.x + s, p.y, 0 );
		// posArray.push( p.x + s, p.y - s, 0 );
		// posArray.push( p.x, p.y - s, 0 );

		// uvArray.push( 0.0, 1.0 );
		// uvArray.push( 1.0, 1.0 );
		// uvArray.push( 1.0, 0.0 );
		// uvArray.push( 0.0, 0.0 );

		// indexArray.push( 0, 2, 1, 0, 3, 2 );

		// p.set( s, 0 );

		for ( let i = 0; i < count; i ++ ) {

			posArray.push( p.x,		p.y,		0 );
			posArray.push( p.x + s, p.y,		0 );
			posArray.push( p.x + s, p.y - s,	0 );
			posArray.push( p.x,		p.y - s, 	0 );

			uvArray.push( 0.0, 1.0 );
			uvArray.push( 1.0, 1.0 );
			uvArray.push( 1.0, 0.0 );
			uvArray.push( 0.0, 0.0 );

			let indexOffset = ( i + 0.0 ) * 4;
			indexArray.push( indexOffset + 0, indexOffset + 2, indexOffset + 1, indexOffset + 0, indexOffset + 3, indexOffset + 2 );

			p.x += s;
			p.y = p.y - s;

			s *= 0.5;

		}

		let posAttr = new THREE.BufferAttribute( new Float32Array( posArray ), 3 );
		let uvAttr = new THREE.BufferAttribute( new Float32Array( uvArray ), 2 );
		let indexAttr = new THREE.BufferAttribute( new Uint16Array( indexArray ), 1 );

		let gs = 1;
		posAttr.applyMatrix4( new THREE.Matrix4().makeScale( ( 1.0 / 1.0 ), gs, gs ) );
		posAttr.applyMatrix4( new THREE.Matrix4().makeTranslation( - 1.0, 1.0, 0 ) );

		this.setAttribute( 'position', posAttr );
		this.setAttribute( 'uv', uvAttr );
		this.setIndex( indexAttr );

	}

}

</document_content>
</document>
<document index="43">
<source>src/ts/MainScene/RenderPipeline/shaders/bloomBlur.fs</source>
<document_content>
// https://qiita.com/aa_debdeb/items/26ab808de6745611df53

varying vec2 vUv;
uniform sampler2D backbuffer;
uniform vec2 resolution;

uniform bool direction;
uniform float blurRange;

#pragma glslify: blur13 = require( './gaussBlur13.glsl' )


// Gaussianブラーの重み
uniform float[GAUSS_WEIGHTS] uWeights;

void main(void) {
  vec2 coord = vec2(gl_FragCoord.xy);
  vec2 size = resolution;

  vec3 sum = uWeights[0] * texture2D(backbuffer, vUv).rgb;

  for (int i = 1; i < GAUSS_WEIGHTS; i++) {
    vec2 offset = (direction ? vec2(i, 0) : vec2(0, i)) * blurRange;
    sum += uWeights[i] * texture2D(backbuffer, vUv + offset / resolution).rgb;
    sum += uWeights[i] * texture2D(backbuffer, vUv - offset / resolution).rgb;
  }
  gl_FragColor = vec4(sum, 1.0);
}
</document_content>
</document>
<document index="44">
<source>src/ts/MainScene/RenderPipeline/shaders/bloomBright.fs</source>
<document_content>
uniform sampler2D sceneTex;
uniform vec2 resolution;
varying vec2 vUv;

uniform float threshold;

void main() {
  vec3 c = texture2D(sceneTex, vUv).xyz;
  vec3 f;
  f.x = max(0.0, c.x - threshold);
  f.y = max(0.0, c.y - threshold);
  f.z = max(0.0, c.z - threshold);

  gl_FragColor = vec4(vec3(c) * f, 1.0);
}
</document_content>
</document>
<document index="45">
<source>src/ts/MainScene/RenderPipeline/shaders/composite.fs</source>
<document_content>
varying vec2 vUv;
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
	#pragma unroll_loop_end

	color *= mix( 1.0, smoothstep( 2.0, 0.8, length( cuv ) ), uVignet );

	gl_FragColor = vec4( color, 1.0 );

}
</document_content>
</document>
<document index="46">
<source>src/ts/MainScene/RenderPipeline/shaders/smaa_blendingWeightCalculation.fs</source>
<document_content>

varying vec2 vUv;
varying vec4 vOffset[3];
varying vec2 vPixcoord;

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

    } else {

        vec2 uv = gl_FragCoord.xy / dataSize.xy;
        vec2 bUV = ( gl_FragCoord.xy - vec2( 1.0, 0.0 ) ) / dataSize.xy;

        vec3 pos = texture2D( uPosDataTex, uv ).xyz;
        vec3 beforePos = texture2D( uPosDataTex, bUV ).xyz;

		float blend = 0.0;
		blend += uMaterial[0] * 0.4;
		blend += uMaterial[1] * 0.2;
		blend += uMaterial[2] * 0.3;
		blend += uMaterial[4] * 0.1;
		blend += uMaterial[5] * 0.2;

		vec3 newPos = mix(beforePos, pos, blend);

		// sec4 床むりやりやぞ

		newPos -= -12.0;
		newPos.y *= 1.0 - 0.1 * uMaterial[3];
		newPos += -12.0;

		// sec5 ノイズ

		newPos.xyz += ( texture2D( uNoiseTex, pos.xy * 0.02 ).xyz - 0.50 ) * 0.05 * uMaterial[4];

		// sec6 進むやつ

		newPos += uMaterial[5] * vec3( 0.1, -.06, 0.1 );

        gl_FragColor = vec4(newPos,1.0);
    }
}
</document_content>
</document>
<document index="73">
<source>src/ts/MainScene/World/Ground/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { PowerReflectionMesh } from 'power-mesh';

import groundFrag from './shaders/ground.fs';

export class Ground extends PowerReflectionMesh {

	private animator: ORE.Animator;

	constructor( mesh: THREE.Mesh, parentUniforms: ORE.Uniforms ) {

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uIllustTex: window.gManager.assetManager.getTex( 'groundIllust' ),
			uGridTex: window.gManager.assetManager.getTex( 'groundGrid' ),
			uRandomTex: window.gManager.assetManager.getTex( 'random' ),
			uNoiseTex: window.gManager.assetManager.getTex( 'noise' ),
		} );

		uni.uColor = animator.add( {
			name: 'groundColor',
			initValue: new THREE.Vector3( 0.0, 0.0, 0.0 ),
			easing: ORE.Easings.easeOutCubic
		} );

		uni.uVisibleIllust = animator.add( {
			name: 'groundIllustVisibility',
			initValue: 0,
			easing: ORE.Easings.linear
		} );

		uni.uVisibleGrid = animator.add( {
			name: 'groundGridVisibility',
			initValue: 0,
		} );

		uni.uReflection = animator.add( {
			name: 'groundReflection',
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		uni.uVisibility = animator.add( {
			name: 'groundVisibility',
			initValue: 1.0,
		} );

		super( mesh, {
			uniforms: uni,
			fragmentShader: groundFrag,
			transparent: true,
		}, true );

		mesh.position.y = this.position.y;
		this.resize( new THREE.Vector2( 1024, 1024 ) );

		this.animator = animator;
		this.receiveShadow = true;
		this.renderOrder = 0;

		window.gManager.eRay.touchableObjects.push( this );

		// @ts-ignore
		this.isSkinnedMesh = false;

	}

	private timer: number | null = null;

	public changeSection( sectionIndex: number ) {

		let reflection = 0.0;
		let color = new THREE.Vector3();
		let visible = false;
		let illustVisibility = false;

		if ( sectionIndex == 2.0 ) {

			reflection = 1;

		}

		if ( sectionIndex == 3.0 ) {

			color.setScalar( 0.95 );
			illustVisibility = true;

		}

		if ( sectionIndex >= 2.0 && sectionIndex <= 3.0 ) {

			visible = true;

		}

		if ( visible ) this.visible = true;

		// material

		this.animator.animate( 'groundReflection', reflection );
		this.animator.animate( 'groundColor', color );

		// illust

		this.animator.animate( 'groundGridVisibility', illustVisibility ? 1 : 0, 1.5 );

		if ( this.timer ) {

			window.clearTimeout( this.timer );

		}

		this.timer = window.setTimeout( () => {

			this.animator.animate( 'groundIllustVisibility', illustVisibility ? 1 : 0, illustVisibility ? 2 : 1 );

			this.timer = null;

		}, illustVisibility ? 500 : 0 );

		// visibility

		this.animator.animate( 'groundVisibility', visible ? 1 : 0, 1, () => {

			this.visible = visible;

		} );

	}

}

</document_content>
</document>
<document index="74">
<source>src/ts/MainScene/World/Ground/shaders/ground.fs</source>
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
</document_content>
</document>
<document index="159">
<source>src/ts/MainScene/World/Sections/Section4/Peoples/shaders/computeVelocity.glsl</source>
<document_content>
uniform float time;
uniform float seed;
uniform float deltaTime;

uniform vec2 dataSize;
uniform sampler2D dataPos;
uniform sampler2D dataVel;
uniform vec3 uModelPosition;
uniform float uJumping;
uniform float uTextSwitch;
uniform vec3 uCursorPos;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: atan2 = require('./atan2.glsl' )
#pragma glslify: snoise = require('./noise4D.glsl' )
#pragma glslify: random = require('./random.glsl' )

struct AvoidObj {
	vec3 position;
	vec3 scale;
};

uniform AvoidObj uAvoid[AVOID_COUNT];

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

void main() {

    vec2 uv = gl_FragCoord.xy / dataSize.xy;
    vec3 pos = texture2D( dataPos, uv ).xyz;
    vec3 vel = texture2D( dataVel, uv ).xyz;
    float idParticle = uv.y * dataSize.x + uv.x;

	// noise的な動き

    float scale = 0.7 + sin( time ) * 0.1;
	vec3 p = scale * pos.xyz;
	p.z += uv.y * 100.0;

    vel.xz += vec2(
      snoise( vec4( p, 7.225 + time * 0.5 )  ),
      snoise( vec4( p, 3.553 + time * 0.5 )  )
    ) * deltaTime * 2.0;

	// 避け

	AvoidObj avoid;
	vec3 avoidVel = vec3( 0.0 );
	vec2 avoidDiff = vec2( 0.0 );

	#pragma unroll_loop_start
	for ( int i = 0; i < AVOID_COUNT; i ++ ) {

		avoid = uAvoid[ UNROLLED_LOOP_INDEX ];
		avoidDiff = pos.xz - (avoid.position.xz - uModelPosition.xz);
		avoidDiff /= avoid.scale.xz;
		avoidVel.xz += smoothstep( 0.5, 0.4, length( avoidDiff ) + uv.y * 0.05 ) * ( avoidDiff ) * ( 1.0 - uJumping);

	}
	#pragma unroll_loop_end

	vel += avoidVel;

	// 中央へ寄る (なんかほっとくと右下行くから補正かけてる)
	vec2 centerGravity = vec2( 0.0 ) - pos.xz - vec2( 1.2, 4.0 );
	vel.xz += ( centerGravity ) * length(centerGravity) * 0.00003;

	vel.xz = normalize( vel.xz ) * 0.02;

	// 衝撃波

	float wave = smoothstep( 0.9, 1.0, sin( linearstep( 0.0, 1.0, -length( pos.xz ) * 0.1 + uTextSwitch * 3.0) * PI - uv.x * 1.0 ) );
	wave *= 0.8 + max( 0.0, 1.0 - length( pos.xz ) * 0.1 ) * 0.5;
	vel += normalize( pos ) * 0.08 * wave;

	// 重力 / 衝撃波

	if( p.y <= 0.0 ) {

		vel.y = 0.0;

	} else {

		vel.y -= 1.0 * deltaTime;

	}

	vel.y += wave * 0.05;

	// マウスを避ける

	vec2 diffCursor = pos.xz - uCursorPos.xz;
	vel.xz += smoothstep( 2.0, 0.0, length( diffCursor ) ) * diffCursor * 0.1;

    gl_FragColor = vec4( vel.xyz, 1.0 );

}
</document_content>
</document>
<document index="160">
<source>src/ts/MainScene/World/Sections/Section4/Peoples/shaders/people.fs</source>
<document_content>
uniform sampler2D tex;
uniform sampler2D noiseTex;

uniform float uSectionVisibility;
uniform float time;
uniform float uPeopleStyle[4];

varying vec2 vBaseUV;
varying vec2 vUv;
varying float vAlpha;
varying float vType;
varying vec2 vComputeUV;

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#endif

#include <packing>

#pragma glslify: random = require('./random.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )

void main( void ) {

	vec4 human = texture2D( tex, vUv );

	if( human.w < 0.5 ) {

		discard;

	}

	float rnd = ( 0.5 + vComputeUV.y * 0.5 );
	vec2 cUv = ( vBaseUV - 0.5 ) * 2.0;
	float wave = vBaseUV.y * 80.0;

	vec2 tile = mod( vBaseUV * 8.0, vec2( 2.0, 2.0 ) );
	vec2 floorTile = floor( tile );

	vec3 col1 = vec3( 1.0, 1.0, 1.0 );
	vec3 col2 = mix( vec3( 0.0, 0.7, 1.0), vec3( 1.0, 1.0, 1.0 ), step( 0.35, length( mod(vBaseUV * rotate( 0.5 ) * 7.0, vec2( 1.0, 1.0 ) ) - 0.5 ) ) );
	vec3 col3 = mix( vec3( 0.8, 0.0, 0.0 ), vec3( 1.0 ), step( sin( wave ), 0.0 ) );
	vec3 col4 = floorTile.x == floorTile.y ? vec3( 1.0 ) : vec3( 0.0, 0.5, 0.0 );

	vec3 col = vec3(0.0);
	// col += col1 * 0.0; //* uPeopleStyle[0];
	// col += col2 * 1.0; //* uPeopleStyle[1];
	// col += col3 * 0.0; //* uPeopleStyle[2];
	// col += col4 * 0.0; //* uPeopleStyle[3];


	col += col1 * uPeopleStyle[0];
	col += col2 * uPeopleStyle[1];
	col += col3 * uPeopleStyle[2];
	col += col4 * uPeopleStyle[3];

	human.xyz = mix( human.xyz, col, step( 0.5, human.x - human.y ) );

	/*-------------------------------
		Depth
	-------------------------------*/

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	// col.w *= vAlpha * uSectionVisibility;

	human.xyz *= 1.0 - random(gl_FragCoord.xy * 0.001) * 0.08;

	gl_FragColor = human;

}
</document_content>
</document>
<document index="161">
<source>src/ts/MainScene/World/Sections/Section4/Peoples/shaders/people.vs</source>
<document_content>
attribute vec4 tangent;
attribute vec2 computeUV;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying float vAlpha;
varying float vType;

uniform float time;

uniform float uVisibility;
uniform float uJump;
uniform float uSectionViewing;
uniform sampler2D dataPos;
uniform sampler2D dataVel;
uniform float aboutOffset;
uniform vec2 dataSize;
uniform float uTextSwitch;

varying vec2 vBaseUV;
varying vec2 vComputeUV;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: atan2 = require('./atan2.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )
#pragma glslify: hsv2rgb = require('./hsv2rgb.glsl' )

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;

#endif


float easeOutQuart( float t ) {

	return t < 0.5 ? 2.0 * t * t : -1.0 + ( 4.0 - 2.0 * t ) * t;

}

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>

mat3 makeRotationDir( vec3 direction, vec3 up ) {
	vec3 xaxis = normalize( cross( up, direction ) );
	vec3 yaxis = normalize( cross( direction, xaxis ) );

	return mat3(
		xaxis.x, yaxis.x, direction.x,
		xaxis.y, yaxis.y, direction.y,
		xaxis.z, yaxis.z, direction.z
	);

}

vec2 spriteUVSelector( vec2 uv, vec2 tile, float frames, float time, float offset ) {

	float t = floor(frames * mod( time, 1.0 ) );
	t += offset;

	uv.x += mod(t, tile.x);
	uv.y -= floor(t / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

void main( void ) {

	vAlpha = 1.0 - easeOutQuart( linearstep( 0.0, 1.0, -computeUV.x + ( 1.0 - uVisibility) * 2.0 ) );
	float posYOffset = easeOutQuart( linearstep( 0.0, 1.0, -computeUV.x + uJump * 2.0 ) );

	vec4 vel = texture2D( dataVel, computeUV );

	/*-------------------------------
		Position
	-------------------------------*/

    vec3 p = position;
	p *= (vAlpha);
	p.xz *= rotate( posYOffset * 5.0);

	vec4 posData = texture2D( dataPos, computeUV );
    vec3 pos = vec3( 0.0 );
	pos.xyz = posData.xyz;
	// pos.y += sin( linearstep( 0.0, 1.0, -length( pos.xz ) * 0.1 + uTextSwitch * 3.0 + computeUV.x * 0.2 ) * PI ) * 0.5;
	pos.y += (posYOffset) * 9.0 * computeUV.y;
	pos.xz *= rotate( sin(computeUV.y * 20.0 + time * 0.6 + posYOffset ) * posYOffset * 0.2 );

	vec4 worldPos = modelMatrix * vec4( p + pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	float offset = abs(vel.x) > 0.005 ? 16.0 : 0.0;

	vUv = spriteUVSelector( vUv, vec2( 16.0, 2.0 ), 16.0, time + computeUV.x, offset );
	vBaseUV = uv;
	vBaseUV.y *= 1.5;
	vBaseUV.y -= 0.42;

	if( offset > 0.0 && vel.x < 0.0 ) {
		vUv.x = 1.0 - vUv.x;
	}

	vNormal = normal;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vType = posData.w * 0.0;
	vType = 0.0;
	vComputeUV = computeUV;

	#ifdef DEPTH

		vHighPrecisionZW = gl_Position.zw;

	#endif

}
</document_content>
</document>
<document index="162">
<source>src/ts/MainScene/World/Sections/Section4/TileText/TileTextMesh/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import tileTextVert from './shaders/tileText.vs';
import tileTextFrag from './shaders/tileText.fs';

import { TileTextInfo } from '..';

export class TileTextMesh extends THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> {

	private animator: ORE.Animator;

	public size: THREE.Vector2;
	private uniforms: ORE.Uniforms;
	private bgMesh: THREE.Mesh;
	private animatorId?: string;

	constructor( char: string, info: TileTextInfo, texture: THREE.Texture, height: number = 1, uniforms?: ORE.Uniforms, animatorId?: string, materialOption?: THREE.ShaderMaterialParameters ) {

		if ( animatorId === undefined ) {

			animatorId = ( Math.random() * 10000 ).toString();

		}

		let uni = ORE.UniformsLib.mergeUniforms( uniforms, {
			uTile: {
				value: info.tile
			},
			uTextSelector: {
				value: info.charList.split( '' ).findIndex( item => item == char )
			},
			uTex: {
				value: texture
			},
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.uVisibility = animator.add( {
			name: 'tileTextVisibility' + animatorId,
			initValue: 0,
			// easing: ORE.Easings.easeOutCubic
		} );

		/*-------------------------------
			Mesh
		-------------------------------*/

		let size = new THREE.Vector2( height, height );
		let geo = new THREE.PlaneGeometry( size.x, size.y );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: tileTextVert,
			fragmentShader: tileTextFrag,
			transparent: true,
			side: THREE.DoubleSide,
			uniforms: uni,
			...materialOption,
		} );

		super( geo, mat );

		this.animatorId = animatorId;
		this.animator = window.gManager.animator;

		this.size = new THREE.Vector2( size.x * 0.7, size.y );

		if ( char == 'i' ) {

			this.size.x *= 0.6;

		}

		this.uniforms = uni;

		// depth

		// this.customDepthMaterial = new THREE.ShaderMaterial( {
		// 	vertexShader: tileTextVert,
		// 	fragmentShader: tileTextFrag,
		// 	uniforms: uni,
		// 	defines: {
		// 		IS_DEPTH: '',
		// 	}
		// } );

		// this.castShadow = true;

		// bgMesh

		this.bgMesh = new THREE.Mesh( geo, new THREE.ShaderMaterial( {
			vertexShader: tileTextVert,
			fragmentShader: tileTextFrag,
			transparent: true,
			uniforms: uni,
			defines: {
				IS_BG: ''
			},
			...materialOption,
		} ) );

		this.bgMesh.position.set( 0, 0, - 0.15 );
		this.add( this.bgMesh );

	}

	public show( duration: number = 0.5 ) {

		this.animator.animate( 'tileTextVisibility' + this.animatorId, 1, duration );

	}

	public dispose( duration: number = 0.5 ) {

		this.animator.animate( 'tileTextVisibility' + this.animatorId, 2, duration, () => {

			if ( this.parent ) {

				this.geometry.dispose();
				this.material.dispose();
				( this.bgMesh.material as THREE.ShaderMaterial ).dispose();

				this.parent.remove( this );

			}

		} );

	}

}

</document_content>
</document>
<document index="163">
<source>src/ts/MainScene/World/Sections/Section4/TileText/TileTextMesh/shaders/tileText.fs</source>
<document_content>
uniform sampler2D uTex;
uniform float uTileTextGroupVisibility;
varying vec2 vUv;

#include <packing>

#ifdef IS_DEPTH

	varying vec2 vHighPrecisionZW;

#endif

void main( void ) {

	vec4 col = texture2D( uTex, vUv );

	if( col.w < 0.5 ) discard;

	#ifdef IS_DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	#ifdef IS_BG

		gl_FragColor = vec4( 0.0, 0.0, 0.0, uTileTextGroupVisibility );
		return;

	#else

		if( col.x > 0.0 ) {

			gl_FragColor = vec4( 1.0, 1.0, 1.0, uTileTextGroupVisibility );
			return;

		} else if( col.y > 0.0 ) {

			gl_FragColor = vec4( 0.0, 0.0, 0.0, uTileTextGroupVisibility );
			return;

		} else if( col.z > 0.0 ) {

			gl_FragColor = vec4( 0.0, 0.0, 0.0, uTileTextGroupVisibility );
			return;

		}

	#endif

	discard;

}
</document_content>
</document>
<document index="164">
<source>src/ts/MainScene/World/Sections/Section4/TileText/TileTextMesh/shaders/tileText.vs</source>
<document_content>
uniform vec2 uTile;
uniform float uTextSelector;
uniform float uVisibility;
uniform float uTileTextGroupVisibility;
uniform float time;

varying vec2 vUv;

#pragma glslify: import('./constants.glsl' )

#ifdef IS_DEPTH

	varying vec2 vHighPrecisionZW;

#endif

vec2 spriteUVSelector( vec2 uv, vec2 tile, float selector ) {

	uv.x += mod(selector, tile.x);
	uv.y -= floor(selector / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

#pragma glslify: rotate = require('./rotate.glsl' )

void main( void ) {

	vec3 pos = position;

	float invTileTextVisibility = 1.0 - uTileTextGroupVisibility;
	pos.y += invTileTextVisibility;

	pos.xy *= rotate( -uVisibility * TPI );
	pos.y += sin( - time + modelViewMatrix[3][0] ) * 0.2;

	pos *= uVisibility;

	if( uVisibility > 1.0 ) {

		pos *= 1.0 - ( uVisibility - 1.0 );

	}


	float jump = clamp( mod(uVisibility, 1.0), 0.0, 1.0 );

	pos.y += sin( jump * PI );
	pos.y += ( 1.0 - uVisibility );

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = spriteUVSelector( uv, uTile, uTextSelector);

	#ifdef IS_DEPTH

		vHighPrecisionZW = gl_Position.zw;

	#endif

}
</document_content>
</document>
<document index="165">
<source>src/ts/MainScene/World/Sections/Section4/TileText/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { TileTextMesh } from './TileTextMesh';

export type TileTextInfo = {
	tile: THREE.Vector2,
	charList: string;
}

export class TileText extends THREE.Object3D {

	private animator: ORE.Animator;

	private commonUniforms: ORE.Uniforms;
	private meshList: TileTextMesh[] = [];
	private totalTextMeshWidth: number = 0.0;

	private materialOption?: THREE.ShaderMaterialParameters;

	constructor( parentUniforms?: ORE.Uniforms, materialOption?: THREE.ShaderMaterialParameters ) {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.animator = window.gManager.animator;

		this.commonUniforms.uTileTextGroupVisibility = this.animator.add( {
			name: 'visibility' + this.uuid,
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		this.meshList = [];

		this.materialOption = materialOption;

	}

	public async setText( text: string ) {

		this.meshList.forEach( ( textMesh, index ) => {

			setTimeout( () => {

				textMesh.dispose();

			}, 100 * index );

		} );

		this.meshList.length = 0;
		this.totalTextMeshWidth = 0;

		/*-------------------------------
			Create MSDF Mesh
		-------------------------------*/

		let [ fontData, texture ] = await this.load( 'gumball' );

		text.split( '' ).forEach( ( char, index ) => {

			if ( char != '_' ) {

				let textMesh = new TileTextMesh( char, fontData, texture, 1.0, this.commonUniforms, undefined, this.materialOption );
				this.add( textMesh );
				this.meshList.push( textMesh );
				this.totalTextMeshWidth += textMesh.size.x;

				setTimeout( () => {

					textMesh.show();

				}, 70 * index );

			}

		} );

		let offset = 0;

		this.meshList.forEach( textMesh => {

			let size = textMesh.size.x;

			offset += size / 2;

			textMesh.position.x = offset - this.totalTextMeshWidth / 2;

			offset += size / 2;

		} );

	}

	private async load( fontName: string ) {

		let prmFontData = new Promise<any>( resolve => {

			resolve( {
				tile: new THREE.Vector2( 8, 8 ),
				charList: "abcdefghijklmnopqrstuvwxyz"
			} );

		} );

		let loader = new THREE.TextureLoader();
		let prmTexture = new Promise<THREE.Texture>( ( resolve ) => {

			loader.load( './assets/fonts/' + fontName + '.png', tex => {

				tex.magFilter = THREE.NearestFilter;
				tex.minFilter = THREE.NearestFilter;
				resolve( tex );

			} );

		} );

		return Promise.all( [ prmFontData, prmTexture ] );

	}

	public switchVisiblity( visible: boolean ) {

		if ( visible ) this.visible = true;

		this.animator.animate( 'visibility' + this.uuid, visible ? 1 : 0, 1.0, () => {

			if ( ! visible ) this.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="166">
<source>src/ts/MainScene/World/Sections/Section4/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import { Section, ViewingState } from '../Section';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Peoples } from './Peoples';

import textVert from './shaders/text.vs';
import textFrag from './shaders/text.fs';

import makingVert from './shaders/making.vs';

import { TileText } from './TileText';

export class Section4 extends Section {

	private renderer: THREE.WebGLRenderer;
	private peoples?: Peoples;

	private title?: TileText;
	private word?: TileText;

	private light?: THREE.DirectionalLight;

	private textIndex: number = 0;
	private textList: string[] = [
		'surprise',
		"emotion",
		"story",
		"awesome"
	];

	// layout

	private baseCameraTarget: THREE.Vector3 = new THREE.Vector3();
	private layoutContorllerList: ORE.LayoutController[] = [];
	private info: ORE.LayerInfo | null = null;

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms, renderer: THREE.WebGLRenderer ) {

		super( manager, 'section_4', parentUniforms );

		this.renderer = renderer;

		this.bakuParam.materialType = 'line';
		this.ppParam.vignet = 1.5;
		this.cameraSPFovWeight = 5;

		// params

		this.elm = document.querySelector( '.section4' ) as HTMLElement;

		this.commonUniforms.uTextSwitch = this.animator.add( {
			name: 'sec4TextSwtich',
			initValue: 0,
			easing: ORE.Easings.linear
		} );

		/*-------------------------------
			Light1
		-------------------------------*/

		this.light1Data = {
			position: new THREE.Vector3( 10.7, 15.5, 18.7 ),
			targetPosition: new THREE.Vector3(
				- 1.2926819324493408,
				- 12.504984855651855,
				13.764548301696777
			),
			intensity: 1
		};

		this.light2Data = {
			position: new THREE.Vector3( 5.0, 10.7, 20 ),
			targetPosition: new THREE.Vector3( - 1.7, - 6.7, 12 ),
			intensity: 0.2
		};

	}

	protected onLoadedGLTF( gltf: GLTF ): void {

		let scene = gltf.scene;
		this.add( scene );

		/*-------------------------------
			Shadow
		-------------------------------*/

		let text = scene.getObjectByName( 'Making' ) as THREE.Object3D;
		text.children.forEach( item => {

			let mesh = item as THREE.Mesh;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			let uni = ORE.UniformsLib.mergeUniforms( this.commonUniforms, THREE.UniformsUtils.clone( THREE.UniformsLib.lights ), {
				uMatCapTex: window.gManager.assetManager.getTex( 'matCapOrange' ),
				shadowLightModelViewMatrix: {
					value: new THREE.Matrix4()
				},
				shadowLightProjectionMatrix: {
					value: new THREE.Matrix4()
				},
				shadowLightDirection: {
					value: new THREE.Vector3()
				},
				shadowLightCameraClip: {
					value: new THREE.Vector2()
				},
				shadowMap: {
					value: null
				},
				shadowMapSize: {
					value: new THREE.Vector2()
				},
				shadowMapResolution: {
					value: new THREE.Vector2()
				},
				cameraNear: {
					value: 0.01
				},
				cameraFar: {
					value: 1000.0
				},
			} );

			let defines: any = {};
			if ( mesh.name == 'Sapuraizu' ) {

				defines[ "MAIN" ] = '';

			}

			mesh.material = new THREE.ShaderMaterial( {
				vertexShader: textVert,
				fragmentShader: textFrag,
				uniforms: uni,
				lights: true,
				defines
			} );

			mesh.customDepthMaterial = new THREE.ShaderMaterial( {
				vertexShader: textVert,
				fragmentShader: textFrag,
				uniforms: uni,
				lights: true,
				defines: {
					DEPTH: ""
				}
			} );

		} );

		/*-------------------------------
			Ground
		-------------------------------*/

		let ground = this.getObjectByName( 'Ground' ) as THREE.Mesh<any, THREE.MeshStandardMaterial>;
		ground.material.visible = false;

		/*-------------------------------
			Peoples
		-------------------------------*/

		this.peoples = new Peoples( this.renderer, 26, this.commonUniforms, ground.getObjectByName( 'Avoids' ) as THREE.Object3D );
		this.peoples.switchVisibility( this.sectionVisibility, 2 );
		this.peoples.position.y += 0.5;
		ground.add( this.peoples );

		/*-------------------------------
			Text
		-------------------------------*/

		// title

		this.title = new TileText( this.commonUniforms, {
			vertexShader: makingVert
		} );

		this.title.position.set( - 2.8, 3.5, - 0.7 );
		this.title.scale.setScalar( 0.9 );
		this.title.setText( 'making' );
		this.title.switchVisiblity( this.sectionVisibility );
		ground.add( this.title );

		this.layoutContorllerList.push( new ORE.LayoutController( this.title, {
			position: new THREE.Vector3( 3.4, 0.0, - 0.8 ),
			scale: 1.0
		} ) );

		// words

		this.word = new TileText( this.commonUniforms );
		this.word.position.set( 2.0, 3.0, 3.5 );
		this.word.scale.setScalar( 0.9 );
		this.word.switchVisiblity( this.sectionVisibility );
		this.word.setText( this.textList[ 0 ] );
		this.textIndex = 1;
		ground.add( this.word );

		this.layoutContorllerList.push( new ORE.LayoutController( this.word, {
			position: new THREE.Vector3( - 4.2, 0.0, 1.9 ),
			scale: 0.9
		} ) );

		/*-------------------------------
			Layout
		-------------------------------*/

		this.baseCameraTarget.copy( this.cameraTransform.targetPosition );

		// resize

		if ( this.info ) {

			this.resize( this.info );

		}

	}

	public resize( info: ORE.LayerInfo ): void {

		super.resize( info );

		this.info = info;

		this.cameraTransform.targetPosition.copy( this.baseCameraTarget.clone().add( new THREE.Vector3( - 0.2, 0.0, 1.0 ).multiplyScalar( info.size.portraitWeight ) ) );

		this.layoutContorllerList.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

	}

	public update( deltaTime: number ): void {

		if ( this.peoples ) {

			this.peoples.update( deltaTime );

		}

		if ( this.light ) {

			this.light.intensity = this.animator.get( 'sectionVisibility' + this.sectionName ) || 0;

		}

	}

	public switchViewingState( viewing: ViewingState ): void {

		super.switchViewingState( viewing );

		if ( this.peoples ) {

			let passed = viewing == 'passed';

			this.peoples.switchVisibility( this.sectionVisibility, passed ? 2 : 1.5 );
			this.peoples.switchAscension( passed, passed ? 2 : 1.5 );

		}

		if ( this.title ) this.title.switchVisiblity( this.sectionVisibility );
		if ( this.word ) this.word.switchVisiblity( this.sectionVisibility );

	}

	public switchText() {

		setTimeout( () => {

			if ( this.peoples ) this.peoples.jump();

		}, 400 );

		this.animator.setValue( 'sec4TextSwtich', 0 );
		this.animator.animate( 'sec4TextSwtich', 1, 1 );

		if ( this.word ) {

			this.word.setText( this.textList[ this.textIndex ] );

		}

		this.textIndex = ( this.textIndex + 1 ) % this.textList.length;

	}

}

</document_content>
</document>
<document index="167">
<source>src/ts/MainScene/World/Sections/Section4/shaders/making.fs</source>
<document_content>

uniform float time;
uniform sampler2D uMatCapTex;

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;
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
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;
	uniform float cameraNear;
	uniform float cameraFar;

#endif

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

/*-------------------------------
	RE
-------------------------------*/

vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	vec3 color = mix( #000, vec3( 0.8 ), dNL + random(gl_FragCoord.xy * 0.001) * 0.15 );

	// #ifdef MAIN

		// color *= sin( geo.posWorld.y * 40.0 + time * 0.0 ) * 0.5 + 0.5;

	// #endif


	return color;

}

void main( void ) {

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;
	mat.albedo = vec3( 1.0 );
	mat.opacity = 1.0;

	mat.roughness = 0.0;
	mat.metalness = 0.0;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

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

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;
				shadow = 1.0;

				#if defined( USE_SHADOWMAP ) &&  UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS

					shadow = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

				outColor += RE( geo, mat, light ) * shadow;

			}
		#pragma unroll_loop_end

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="168">
<source>src/ts/MainScene/World/Sections/Section4/shaders/making.vs</source>
<document_content>
uniform vec2 uTile;
uniform float uTextSelector;
uniform float uVisibility;
uniform float uTileTextGroupVisibility;
uniform float time;

varying vec2 vUv;

#pragma glslify: import('./constants.glsl' )

#ifdef IS_DEPTH

	varying vec2 vHighPrecisionZW;

#endif

vec2 spriteUVSelector( vec2 uv, vec2 tile, float selector ) {

	uv.x += mod(selector, tile.x);
	uv.y -= floor(selector / tile.x);

	uv.y -= 1.0;
	uv /= tile;
	uv.y += 1.0;

	return uv;

}

#pragma glslify: rotate = require('./rotate.glsl' )

void main( void ) {

	vec3 pos = position;

	float invTileTextVisibility = 1.0 - uTileTextGroupVisibility;
	pos.y += invTileTextVisibility;

	pos.y += sin( - time + modelViewMatrix[3][0] ) * 0.2;
	pos *= uVisibility;


	if( uVisibility > 1.0 ) {

		pos *= 1.0 - ( uVisibility - 1.0 );

	}


	float jump = clamp( mod(uVisibility, 1.0), 0.0, 1.0 );

	pos.y += sin( jump * PI );

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = spriteUVSelector( uv, uTile, uTextSelector);

	#ifdef IS_DEPTH

		vHighPrecisionZW = gl_Position.zw;

	#endif

}
</document_content>
</document>
<document index="169">
<source>src/ts/MainScene/World/Sections/Section4/shaders/text.fs</source>
<document_content>

uniform float time;
uniform sampler2D uMatCapTex;

varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vViewPos;
varying vec3 vWorldPos;
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
	Shadow
-------------------------------*/

#ifdef DEPTH

	varying vec2 vHighPrecisionZW;
	uniform float cameraNear;
	uniform float cameraFar;

#endif

vec3 lambert( vec3 diffuseColor ) {

	return diffuseColor / PI;

}

/*-------------------------------
	RE
-------------------------------*/

vec3 RE( Geometry geo, Material mat, Light light) {

	vec3 lightDir = normalize( light.direction );
	vec3 halfVec = normalize( geo.viewDir + lightDir );

	float dLH = clamp( dot( lightDir, halfVec ), 0.0, 1.0 );
	float dNH = clamp( dot( geo.normal, halfVec ), 0.0, 1.0 );
	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float dNL = clamp( dot( geo.normal, lightDir), 0.0, 1.0 );

	vec3 irradiance = light.color * dNL;

	vec3 color = mix( #000, vec3( 0.8 ), dNL + random(gl_FragCoord.xy * 0.001) * 0.15 );

	// #ifdef MAIN

		// color *= sin( geo.posWorld.y * 40.0 + time * 0.0 ) * 0.5 + 0.5;

	// #endif


	return color;

}

void main( void ) {

	#ifdef DEPTH

		float fragCoordZ = 0.5 * vHighPrecisionZW.x / vHighPrecisionZW.y + 0.5;
		gl_FragColor = packDepthToRGBA( fragCoordZ );
		return;

	#endif

	/*-------------------------------
		Material
	-------------------------------*/

	Material mat;
	mat.albedo = vec3( 1.0 );
	mat.opacity = 1.0;

	mat.roughness = 0.0;
	mat.metalness = 0.0;

	mat.diffuseColor = mix( mat.albedo, vec3( 0.0, 0.0, 0.0 ), mat.metalness );
	mat.specularColor = mix( vec3( 1.0, 1.0, 1.0 ), mat.albedo, mat.metalness );

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

	// output
	vec3 outColor = vec3( 0.0 );
	float outOpacity = mat.opacity;

	Light light;

	#if NUM_DIR_LIGHTS > 0

		float shadow;

		#pragma unroll_loop_start
			for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

				light.direction = directionalLights[ i ].direction;
				light.color = directionalLights[ i ].color;
				shadow = 1.0;

				#if defined( USE_SHADOWMAP ) &&  UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS

					shadow = getShadow( directionalShadowMap[ i ], directionalLightShadows[ i ].shadowMapSize, directionalLightShadows[ i ].shadowBias, vDirectionalShadowCoord[ i ] );

				#endif

				outColor += RE( geo, mat, light ) * shadow;

			}
		#pragma unroll_loop_end

	#endif

	gl_FragColor = vec4( outColor, outOpacity );

}
</document_content>
</document>
<document index="170">
<source>src/ts/MainScene/World/Sections/Section4/shaders/text.vs</source>
<document_content>
attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
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
	vec3 normal = normalize( transformedNormal );

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
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="171">
<source>src/ts/MainScene/World/Sections/Section5/Grid/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import gridVert from './shaders/grid.vs';
import gridfs from './shaders/grid.fs';

export class Grid extends THREE.LineSegments {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	private animatorId: string;

	constructor( parentUniforms?: ORE.Uniforms ) {

		let range = new THREE.Vector3( 5.0, 5.0, 8.0 );
		let resScale = 3.0;
		let res = new THREE.Vector3( range.x * resScale, range.y * resScale, range.z * resScale * 0.4 );

		let animatorId = Math.floor( Math.random() * 10000 ).toString();

		let offsetPosArray: number[] = [];
		let numArray: number[] = [];

		for ( let i = 0; i < res.z; i ++ ) {

			for ( let j = 0; j < res.y; j ++ ) {

				for ( let k = 0; k < res.x; k ++ ) {

					offsetPosArray.push(
						k / res.x * range.x,
						j / res.y * range.y,
						i / res.z * range.z,
					);

					numArray.push( i );

				}

			}

		}

		// let originGeo = new THREE.BoxGeometry( 0.01, 0.01, 0.01 );

		let geo = new THREE.InstancedBufferGeometry();

		// geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [
		// 	- scale - scale * 0.1, 0.0, 0.0,
		// 	scale + scale * 0.1, 0.0, 0.0,
		// 	0.0, scale, 0.0,
		// 	0.0, - scale, 0.0,
		// 	0.0, 0.0, scale,
		// 	0.0, 0.0, - scale,
		// ] ), 3 ) );

		let scale = 0.2;
		let offset = 0.15;
		let boxSize = 0.002;

		geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( [
			offset, 0.0, 0.0,
			offset + scale, 0.0, 0.0,
			- offset, 0.0, 0.0,
			- offset - scale, 0.0, 0.0,

			0.0, offset, 0.0,
			0.0, offset + scale, 0.0,
			0.0, - offset, 0.0,
			0.0, - offset - scale, 0.0,

			// 0.0, 0.0, offset,
			// 0.0, 0.0, offset + scale,
			// 0.0, 0.0, - offset,
			// 0.0, 0.0, - offset - scale,

			// - boxSize, - boxSize, - boxSize,
			// boxSize, - boxSize, - boxSize,
			// - boxSize, boxSize, - boxSize,
			// boxSize, boxSize, - boxSize,

			// - boxSize, - boxSize, boxSize,
			// boxSize, - boxSize, boxSize,
			// - boxSize, boxSize, boxSize,
			// boxSize, boxSize, boxSize,

			// - boxSize, - boxSize, - boxSize,
			// boxSize, - boxSize, - boxSize,
			// - boxSize, boxSize, - boxSize,
			// boxSize, boxSize, - boxSize,

			// - boxSize, - boxSize, boxSize,
			// boxSize, - boxSize, boxSize,
			// - boxSize, boxSize, boxSize,
			// boxSize, boxSize, boxSize,

		] ), 3 ) );
		geo.setIndex( new THREE.BufferAttribute( new Uint8Array( [
			0, 1, 2, 3, 4, 5, 6, 7//, 8, 9, 10, 11,
			// 12, 13, 14, 15,
			// 16, 17, 18, 19,
			// 12, 16, 16, 18, 18, 14, 14, 12,
			// 13, 17, 17, 19, 19, 15, 15, 13
		] ), 1 ) );

		geo.setAttribute( 'offsetPos', new THREE.InstancedBufferAttribute( new Float32Array( offsetPosArray ), 3 ) );
		geo.setAttribute( 'num', new THREE.InstancedBufferAttribute( new Float32Array( numArray ), 1 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			range: {
				value: range
			},
			total: {
				value: res
			},
			noiseTex: window.gManager.assetManager.getTex( 'noise' )
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.visibility = animator.add( {
			name: 'windVisibility' + animatorId,
			initValue: 1,
		} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: gridVert,
			fragmentShader: gridfs,
			uniforms: uni,
			side: THREE.DoubleSide,
			depthTest: false,
			blending: THREE.AdditiveBlending
		} );

		super( geo, mat );

		this.commonUniforms = uni;
		this.animator = animator;
		this.animatorId = animatorId;

		/*-------------------------------
			Dispose
		-------------------------------*/

		const onDispose = () => {

			geo.dispose();
			mat.dispose();

			this.removeEventListener( 'dispose', onDispose );

		};

		this.addEventListener( 'dispose', onDispose );

	}

	public switchVisibility( visible: boolean, duration: number = 1 ) {

		if ( visible ) this.visible = true;

		this.animator.animate( 'windVisibility' + this.animatorId, visible ? 1 : 0, duration, () => {

			if ( ! visible ) this.visible = false;

		} );

	}

	public dispose() {

		this.dispatchEvent( { type: 'dispose' } );

	}

}

</document_content>
</document>
<document index="172">
<source>src/ts/MainScene/World/Sections/Section5/Grid/shaders/grid.fs</source>
<document_content>
uniform sampler2D tex;
uniform sampler2D texBlur;

varying float vNum;
varying float vAlpha;
varying vec2 vUv;

void main( void ) {

	vec4 col = vec4( 1.0 );
	col.w *= 0.15 * vAlpha;

	gl_FragColor = col;

}
</document_content>
</document>
<document index="173">
<source>src/ts/MainScene/World/Sections/Section5/Grid/shaders/grid.vs</source>
<document_content>
attribute vec3 offsetPos;
attribute float num;
uniform float time;
uniform vec3 range;
uniform float contentNum;
uniform float particleSize;
uniform float visibility;
uniform float total;

uniform sampler2D noiseTex;

varying float vNum;
varying vec2 vUv;
varying float vAlpha;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )
#pragma glslify: spriteUVSelector = require('./spriteUVSelector.glsl' )

void main( void ) {

	vec3 oPos = offsetPos;
	float t = time * 0.5;
	float n = num / total;
	vec4 noise = texture2D( noiseTex, vec2( n * 1.2 ) );
	vec3 pos = position;

	vec3 hrange = range / 2.0;
	oPos = mod( oPos, range );
	oPos -= hrange;

	vAlpha = 1.0;
	vAlpha *= visibility;

	pos += oPos;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vAlpha *= ( 1.0 * (smoothstep( -10.0, 0.0, mvPosition.z ) ) );



}
</document_content>
</document>
<document index="174">
<source>src/ts/MainScene/World/Sections/Section5/Outro/index.ts</source>
<document_content>
export class Outro {

	private elm: HTMLElement;

	private textElmWrapList: HTMLElement[];

	constructor( ) {

		this.elm = document.querySelector( '.section5-content' ) as HTMLElement;
		this.textElmWrapList = Array.from( this.elm.querySelectorAll( '.section5-text-wrap' ) );

		let textInnerList = Array.from( this.elm.querySelectorAll( '.section5-text-inner' ) );

		textInnerList.forEach( item => {

			let str = item.innerHTML;
			item.innerHTML = '';

			str.split( "" ).forEach( char => {

				item.innerHTML += '<span>' + char + '</span>';

			} );

		} );

	}

	private timeoutList: number[] = [];

	public switchVisibility( visible: boolean ) {

		let waitSum = 0.0;

		this.timeoutList.forEach( item => {

			window.clearTimeout( item );

		} );

		if ( visible ) {

			for ( let i = 0; i < this.textElmWrapList.length; i ++ ) {

				let elm = this.textElmWrapList[ i ];

				let itemList = Array.from( elm.querySelectorAll( '.section5-text' ) );

				this.timeoutList.push( window.setTimeout( () => {

					for ( let j = 0; j < itemList.length; j ++ ) {

						let item = itemList[ j ];

						this.timeoutList.push( window.setTimeout( () => {

							item.setAttribute( 'data-visible5line', 'true' );

						}, 200 * j ) );

					}

				}, waitSum ) );

				waitSum += itemList.length * 200 + 400;

			}

		} else {

			let items = Array.from( this.elm.querySelectorAll( '.section5-text' ) );

			items.forEach( item => {

				item.setAttribute( 'data-visible5line', "false" );

			} );

		}

	}



}

</document_content>
</document>
<document index="175">
<source>src/ts/MainScene/World/Sections/Section5/TextRing/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import textRingVert from './shaders/textRing.vs';
import textRingFrag from './shaders/textRing.fs';

export class TextRing extends THREE.Mesh {

	private commonUniforms: ORE.Uniforms;
	private animator: ORE.Animator;

	constructor( parentUniforms: ORE.Uniforms ) {

		let res = 4;

		let numArray: number[] = [];
		let rndArray: number[] = [];
		let posArray: number[] = [];
		let indexArray: number[] = [];
		let uvArray: number[] = [];

		let radius = 0.6;
		let height = 0.048;

		for ( let i = 0; i <= res; i ++ ) {

			let theta = i / res * Math.PI * 2.0 + Math.PI / 4.0;

			let x = Math.cos( theta ) * radius;
			let y = Math.sin( theta ) * radius;

			posArray.push( x, y, height / 2 );
			posArray.push( x, y, - height / 2 );

			if ( i < res ) {

				indexArray.push( i * 2.0 + 0.0 );
				indexArray.push( i * 2.0 + 1.0 );
				indexArray.push( ( i + 1 ) * 2.0 );

				indexArray.push( i * 2.0 + 1.0 );
				indexArray.push( ( i + 1 ) * 2.0 + 1.0 );
				indexArray.push( ( i + 1 ) * 2.0 + 0.0 );

			}

			let uvx = i / res * 5.0;

			uvArray.push( uvx, 1.0 );
			uvArray.push( uvx, 0.0 );

		}

		let num = 100.0;

		for ( let i = 0; i < num; i ++ ) {

			numArray.push( i );
			rndArray.push( Math.random(), Math.random(), Math.random() );

		}

		let geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( posArray ), 3 ) );
		geo.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( uvArray ), 2 ) );
		geo.setIndex( new THREE.BufferAttribute( new Uint8Array( indexArray ), 1 ) );

		geo.setAttribute( 'num', new THREE.InstancedBufferAttribute( new Float32Array( numArray ), 1 ) );
		geo.setAttribute( 'rnd', new THREE.InstancedBufferAttribute( new Float32Array( rndArray ), 3 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			total: {
				value: res
			},
			noiseTex: window.gManager.assetManager.getTex( 'noise' ),
			tex: window.gManager.assetManager.getTex( 'outro' ),
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.uVisibility = animator.add( {
			name: 'sec5TextRingVisibility',
			initValue: 1,
			easing: ORE.Easings.linear
		} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: textRingVert,
			fragmentShader: textRingFrag,
			uniforms: uni,
			side: THREE.DoubleSide,
			transparent: true,
		} );

		super( geo, mat );

		this.commonUniforms = uni;
		this.animator = animator;
		this.renderOrder = 10;

		/*-------------------------------
			Dispose
		-------------------------------*/

		const onDispose = () => {

			geo.dispose();
			mat.dispose();

			this.removeEventListener( 'dispose', onDispose );

		};

		this.addEventListener( 'dispose', onDispose );

	}

	private timer: number | null = null;

	public switchVisibility( visible: boolean ) {

		if ( this.timer != null ) {

			window.clearTimeout( this.timer );

		}

		this.timer = window.setTimeout( () => {

			if ( visible ) this.visible = true;

			this.animator.animate( 'sec5TextRingVisibility', visible ? 1 : 0, visible ? 2 : 0.5, () => {

				if ( ! visible ) this.visible = false;

			} );

		}, ( visible ? 0.5 : 0.0 ) * 1000 );

	}

	public dispose() {

		this.dispatchEvent( { type: 'dispose' } );

	}


}

</document_content>
</document>
<document index="176">
<source>src/ts/MainScene/World/Sections/Section5/TextRing/shaders/textRing.fs</source>
<document_content>
uniform sampler2D tex;

varying float vAlpha;
varying vec2 vUv;

void main( void ) {


	vec4 color = vec4( 1.0 );
	color.w *= texture2D( tex, vUv ).w;

	if( color.w < 0.2 ) discard;

	color.w *= vAlpha * 0.3;

	gl_FragColor = vec4( color );

}
</document_content>
</document>
<document index="177">
<source>src/ts/MainScene/World/Sections/Section5/TextRing/shaders/textRing.vs</source>
<document_content>
attribute float num;
attribute vec3 rnd;

varying vec2 vUv;
varying float vAlpha;

uniform float time;
uniform float uVisibility;

#pragma glslify: rotate = require('./rotate.glsl' )
#pragma glslify: import('./constants.glsl' )

float easeInOutQuad( float t ) {

	return t < 0.5 ? 2.0 * t * t : -1.0 + ( 4.0 - 2.0 * t ) * t;

}

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

void main( void ) {

	float offsetPos =  ( mod(num - time * rnd.x, 100.0 )- 50.0 ) * 0.03 ;



	vec3 pos = position;
	float v = easeInOutQuad( smoothstep( 0.0, 1.0, -rnd.x + uVisibility * 2.0 ) );
	pos.xyz *= (0.6 + rnd.y * 0.4) + (1.0 - v) * 0.2;
	pos.z += offsetPos;
	// pos.xy *= rotate( time * 0.2 + v * 0.3 + offsetPos * 0.2 );
	// pos.xy *= rotate( num * 1.1 + time * 0.2 + v * 0.3 );

	vAlpha = v * smoothstep( 1.5, 0.0, abs(offsetPos) ) * rnd.y;

	float ex = mod( uv.x + time * 0.5, 1.0 );
	// vAlpha *= exp( -ex * 8.5 ) * ex * 23.0;
	// vAlpha *= exp( -ex * 10.0 );

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vUv.y += mod(num, 8.0) + 8.0;
	vUv.y /= 16.0;
	vUv.x -= time * rnd.z * 0.1;

}
</document_content>
</document>
<document index="178">
<source>src/ts/MainScene/World/Sections/Section5/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import { Section, ViewingState } from '../Section';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextRing } from './TextRing';
import { Grid } from './Grid';
import { Outro } from './Outro';

export class Section5 extends Section {

	private textring: TextRing;
	private grid: Grid;
	private outro: Outro;

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms ) {

		super( manager, 'section_5', parentUniforms );

		// params

		this.elm = document.querySelector( '.section5' ) as HTMLElement;

		this.bakuParam.materialType = 'dark';
		this.bakuParam.rotateSpeed = 0.18;
		this.ppParam.bloomBrightness = 1.0;
		this.ppParam.vignet = 1.0;
		this.cameraRange.set( 0.02, 0.02 );

		/*-------------------------------
			Lights
		-------------------------------*/

		this.light1Data = {
			position: new THREE.Vector3( 10.7, 15.5, 18.7 ),
			targetPosition: new THREE.Vector3(
				- 1.2926819324493408,
				- 12.504984855651855,
				13.764548301696777
			),
			intensity: 0
		};

		this.light2Data = {
			position: new THREE.Vector3( 5.0, - 10.7, 20 ),
			targetPosition: new THREE.Vector3( - 1.7, - 6.7, 12 ),
			intensity: 0.5,
		};

		/*-------------------------------
			TextRing
		-------------------------------*/

		this.textring = new TextRing( this.commonUniforms );
		this.textring.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Grid
		-------------------------------*/

		this.grid = new Grid( this.commonUniforms );
		this.grid.switchVisibility( this.sectionVisibility );

		/*-------------------------------
			Outro
		-------------------------------*/

		this.outro = new Outro();

	}

	protected onLoadedGLTF( gltf: GLTF ): void {

		let scene = gltf.scene;

		this.add( scene );

		// baku

		let baku = this.getObjectByName( 'Baku' ) as THREE.Object3D;

		// textring

		baku.add( this.textring );

		// grid

		baku.add( this.grid );

	}

	public update( deltaTime: number ): void {

		if ( this.sectionVisibility ) {
			// this.bakuTransform.rotation.multiply( new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3( 0.0, 0.0, 1.0 ), deltaTime * 0.1 ) );
		}

		let baku = this.getObjectByName( 'Baku' ) as THREE.Object3D;

		if ( baku ) {


			baku.rotateZ( - deltaTime * 0.1 );


		}

	}

	private outroTextTimer: number | null = null;

	public switchViewingState( viewing: ViewingState ): void {

		super.switchViewingState( viewing );

		this.textring.switchVisibility( this.sectionVisibility );
		this.grid.switchVisibility( this.sectionVisibility );

		if ( this.outroTextTimer ) {

			window.clearTimeout( this.outroTextTimer );
			this.outroTextTimer = null;

		}

		this.outroTextTimer = window.setTimeout( () => {

			this.outro.switchVisibility( this.sectionVisibility );
			this.outroTextTimer = null;

		}, this.sectionVisibility ? 100 : 0 );

	}

}

</document_content>
</document>
<document index="179">
<source>src/ts/MainScene/World/Sections/Section6/Comrades/Comrade/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import { PowerMesh } from 'power-mesh';

import comradeFrag from './shaders/comrade.fs';
import bakuVert from './shaders/comrade.vs';

export class Comrade {

	private animator: ORE.Animator;

	private root: THREE.Object3D;
	private animationMixer: THREE.AnimationMixer;
	private animations: THREE.AnimationClip[] = [];

	private mesh: PowerMesh;
	private commonUniforms: ORE.Uniforms;
	private action?: THREE.AnimationAction;

	constructor( root: THREE.Object3D, origin: THREE.Object3D, animations: THREE.AnimationClip[], parentUniforms: ORE.Uniforms, colorNum: number ) {

		this.root = root;
		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uTex: {
				value: null
			},
		} );


		let clonedRoot = SkeletonUtils.clone( origin );
		clonedRoot.position.set( 0, 0, 0 );

		let clonedBone = clonedRoot.getObjectByName( "ComradeBone" ) as THREE.SkinnedMesh;
		clonedBone.position.set( 0, - 0.5, 0 );

		let clonedMesh = clonedRoot.getObjectByName( "Comrades_Origin" ) as THREE.SkinnedMesh;

		/*-------------------------------
			Texture
		-------------------------------*/

		let loader = new THREE.TextureLoader();

		loader.load( './assets/textures/baku/baku_' + colorNum + '.jpg', ( tex ) => {

			this.commonUniforms.uTex.value = tex;

		} );

		/*-------------------------------
			Animtor
		-------------------------------*/

		this.animator = window.gManager.animator;

		this.commonUniforms.uVisibility = this.animator.add( {
			name: 'comradeVisibility' + this.root.uuid,
			initValue: 0,
			easing: ORE.Easings.easeOutCubic
		} );

		this.mesh = new PowerMesh( clonedMesh, {
			fragmentShader: comradeFrag,
			vertexShader: bakuVert,
			uniforms: this.commonUniforms,
		}, true );

		this.root.add( clonedRoot );

		/*-------------------------------
			Animatinon
		-------------------------------*/

		this.animationMixer = new THREE.AnimationMixer( this.root );
		this.animations = animations;

		let clip = this.animations.find( clip => clip.name == 'ComradeAction' );

		if ( clip ) {

			let action = this.animationMixer.clipAction( clip );

			if ( action ) {

				this.action = action;

				this.action.timeScale = 0.8 + Math.random() * 0.2;

				this.action.time = Math.random() * 3.0;

				action.play();

			}

		}

		this.root.visible = false;

	}

	public update( deltaTime: number ) {

		// 無理やりループ
		if ( this.action && this.action.time > 3.6666666666666665 ) {

			this.action.time = 0;

		}

		this.animationMixer.update( deltaTime );

		// this.root.rotation.z += deltaTime * 0.2;

	}

	private timer: number | null = null;

	public switchVisibility( visible: boolean ) {

		if ( this.timer != null ) {

			window.clearTimeout( this.timer );

		}

		if ( visible ) {

			this.root.visible = true;

		}

		this.timer = window.setTimeout( () => {

			this.animator.animate( 'comradeVisibility' + this.root.uuid, visible ? 1 : 0, 3, () => {

				if ( ! visible ) {

					this.root.visible = false;

				}

			} );

		}, 500 * Math.random() );

	}


}

</document_content>
</document>
<document index="180">
<source>src/ts/MainScene/World/Sections/Section6/Comrades/Comrade/shaders/comrade.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vTangent;
varying vec3 vBitangent;

uniform sampler2D uTex;

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

	vec4 color = texture2D( uTex, vUv );
	mat.albedo = color.xyz;
	mat.opacity = color.w;

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
		リムライト
	-------------------------------*/

	float dNV = clamp( dot( geo.normal, geo.viewDir ), 0.0, 1.0 );
	float EF = fresnel( dNV );
	outColor += EF;

	outColor += mat.albedo *( 0.65 + EF);

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
<document index="181">
<source>src/ts/MainScene/World/Sections/Section6/Comrades/Comrade/shaders/comrade.vs</source>
<document_content>
uniform float uVisibility;

attribute vec4 tangent;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vViewPos;
varying vec3 vWorldPos;
varying vec2 vHighPrecisionZW;

#ifdef IS_LINE

	uniform float uLine;

#endif

#define linearstep(edge0, edge1, x) min(max(((x) - (edge0)) / ((edge1) - (edge0)), 0.0), 1.0)

/*-------------------------------
	ShadowMap
-------------------------------*/

#include <shadowmap_pars_vertex>
#include <skinning_pars_vertex>

#pragma glslify: rotate = require('./rotate.glsl' )

float easeOutBack(float x) {

	float c1 = 1.70158;
	float c3 = c1 + 1.0;

	return 1.0 + c3 * pow(x - 1.0, 3.0) + c1 * pow(x - 1.0, 2.0);

}

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

	#include <skinning_vertex>

	vec3 pos = transformed;
	float visibility = (1.0 - easeOutBack(linearstep( 0.0, 1.5, +(pos.z - 2.0) + uVisibility * 4.0 ))) * 2.0;
	pos.xy *= rotate( visibility );

	float invUVisibility = (1.0 - uVisibility );
	pos.xy *= max( 0.0, 1.0 - visibility );
	pos.xy *= rotate( invUVisibility * 3.0 );
	pos.zy += invUVisibility * 2.0 ;

	vec4 worldPos = modelMatrix * vec4( pos, 1.0 );
	vec4 mvPosition = viewMatrix * worldPos;

	gl_Position = projectionMatrix * mvPosition;

	/*-------------------------------
		Varying
	-------------------------------*/

	vUv = uv;
	vUv.y = 1.0 - vUv.y;
	vNormal = normal;
	vTangent = tangent;
	vBitangent = biTangent;
	vViewPos = -mvPosition.xyz;
	vWorldPos = worldPos.xyz;
	vHighPrecisionZW = gl_Position.zw;

}
</document_content>
</document>
<document index="182">
<source>src/ts/MainScene/World/Sections/Section6/Comrades/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';
import { Comrade } from './Comrade';

export class Comrades extends EventEmitter {

	private commonUniforms: ORE.Uniforms;
	public root: THREE.Object3D;
	private origin: THREE.SkinnedMesh;
	private comradeList: Comrade[] = [];

	constructor( root: THREE.Object3D, origin: THREE.SkinnedMesh, animations: THREE.AnimationClip[], parentUniforms: ORE.Uniforms ) {

		super();

		this.root = root;
		this.origin = origin;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.root.children.forEach( ( item, index ) => {

			let comrade = new Comrade( item, this.origin, animations, this.commonUniforms, ( index ) % 6 );

			this.comradeList.push( comrade );

		} );

		this.origin.visible = false;

	}

	public update( deltaTime: number ) {

		for ( let i = 0; i < this.comradeList.length; i ++ ) {

			this.comradeList[ i ].update( deltaTime );

		}

	}

	public switchVisibility( visible: boolean ) {

		this.comradeList.forEach( item => {

			item.switchVisibility( visible );

		} );

	}

}

</document_content>
</document>
<document index="183">
<source>src/ts/MainScene/World/Sections/Section6/Next/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

export class Next {

	private time: number = 0.0;
	private elm: HTMLElement;
	private spanElmList: HTMLSpanElement[];

	constructor( ) {

		this.elm = document.querySelector( '#next' )!;

		let str = this.elm.innerText;

		this.elm.innerHTML = '';

		str.split( "" ).forEach( char => {

			this.elm.innerHTML += '<span>' + char + '</span>';

		} );

		this.spanElmList = Array.from( this.elm.querySelectorAll( 'span' ) );


	}

	public update( deltaTime: number ) {

		this.time += deltaTime;

		this.spanElmList.forEach( ( item, index ) => {

			item.style.color = 'hsl(' + ( this.time * 0.2 % 1.0 - ( index * 0.05 ) ) * 360 + 'deg, 80%, 50%)';

		} );



	}

}

</document_content>
</document>
<document index="184">
<source>src/ts/MainScene/World/Sections/Section6/Particle/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import particlesVert from './shaders/particle.vs';
import particlesFrag from './shaders/particle.fs';

export class Particle extends THREE.Points {

	private animator: ORE.Animator;
	public commonUniforms: ORE.Uniforms;

	constructor( parentUniforms?: ORE.Uniforms ) {

		let num = 300;
		let range = new THREE.Vector3( 30.0, 20, 20 );

		let offsetPosArray: number[] = [];
		let numArray: number[] = [];

		for ( let i = 0; i < num; i ++ ) {

			offsetPosArray.push(
				Math.random() * range.x,
				Math.random() * range.y,
				Math.random() * range.z,
			);

			numArray.push( i );

		}

		let geo = new THREE.BufferGeometry();
		geo.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( offsetPosArray ), 3 ) );
		geo.setAttribute( 'num', new THREE.BufferAttribute( new Float32Array( numArray ), 1 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			range: {
				value: range
			},
			particleSize: {
				value: 0.1
			},
			time: {
				value: 0
			}
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.uVisibility = animator.add( {
			name: 'sec6ParticleVisibility',
			initValue: 0,
		} );

		animator.add( {
			name: 'particleTimeScale',
			initValue: 0,
		} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: particlesVert,
			fragmentShader: particlesFrag,
			uniforms: uni,
			transparent: true,
			blending: THREE.AdditiveBlending,
		} );

		super( geo, mat );

		this.animator = animator;

		this.commonUniforms = uni;

	}

	public update( deltaTime: number ) {

		this.commonUniforms.time.value += deltaTime * ( this.animator.get<number>( 'particleTimeScale' ) || 1.0 );

	}

	public resize( layerInfo: ORE.LayerInfo ) {

		this.commonUniforms.particleSize.value = layerInfo.size.canvasSize.y / 200;

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.visible = true;

		this.animator.animate( 'sec6ParticleVisibility', visible ? 1 : 0, 1, () => {

			if ( ! visible ) this.visible = false;

		} );

	}

	private boosting: boolean = false;

	public boost() {

		if ( this.boosting ) return;

		this.boosting = true;

		this.animator.setEasing( 'particleTimeScale', ORE.Easings.easeOutCubic );

		this.animator.animate( 'cameraFovOffset', 15, 1 );
		this.animator.animate( 'cameraShake', 0.15, 0.8 );
		this.animator.animate( 'cameraShakeTimeScale', 8, 0.8 );

		this.animator.animate( 'particleTimeScale', 10, 2, () => {

			this.boostCancel();

		} );

	}

	public boostCancel() {

		if ( ! this.boosting ) return;

		this.boosting = false;

		this.animator.setEasing( 'particleTimeScale', ORE.Easings.easeOutCubic );
		this.animator.animate( 'cameraFovOffset', 0, 4 );
		this.animator.animate( 'cameraShake', 0, 2 );
		this.animator.animate( 'cameraShakeTimeScale', 2, 4 );

		this.animator.animate( 'particleTimeScale', 1, 4 );

	}

}

</document_content>
</document>
<document index="185">
<source>src/ts/MainScene/World/Sections/Section6/Particle/shaders/particle.fs</source>
<document_content>
varying float vNum;
varying float vAlpha;

uniform float uVisibility;

void main( void ) {

	vec2 uv = gl_PointCoord.xy;

	vec2 cuv = uv * 2.0 - 1.0;

	if( step( 0.5, length( cuv ) ) == 1.0 ) {

		discard;

	}

	gl_FragColor = vec4( vec3( 1.0 ), uVisibility );

}
</document_content>
</document>
<document index="186">
<source>src/ts/MainScene/World/Sections/Section6/Particle/shaders/particle.vs</source>
<document_content>
attribute float num;
uniform float time;
uniform vec3 range;
uniform float contentNum;
uniform float particleSize;
varying float vNum;
varying float vAlpha;

void main( void ) {

	vec3 pos = position;
	float t = time * 0.5;

	pos += vec3(
		t * 4.0 + sin( t + ( position.y + position.z ) * 10.0 ) * 0.3,
		0.0,
		0.0
	);

	vec3 hrange = range / 2.0;

	pos = mod( pos, range );
	pos -= range / 2.0;

	vAlpha = smoothstep( hrange.z, hrange.z - 0.5, abs( pos.z ) );
	vAlpha *= smoothstep( hrange.y, hrange.y - 0.5, abs( pos.y ) );

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
	gl_PointSize = ( 5.0 * (smoothstep( -10.0, 0.0, mvPosition.z ) + 0.1 ) ) * particleSize;

	vNum = num;

}
</document_content>
</document>
<document index="187">
<source>src/ts/MainScene/World/Sections/Section6/Road/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import roadVert from './shaders/road.vs';
import roadFrag from './shaders/road.fs';

export class Road extends THREE.Mesh {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		let size = new THREE.Vector2( 100.0, 4.0 );

		let geo = new THREE.PlaneGeometry( size.x, size.y, 50.0, 1.0 );
		geo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeRotationX( - Math.PI / 2.0 ) );
		geo.getAttribute( 'position' ).applyMatrix4( new THREE.Matrix4().makeTranslation( - size.x / 2.5, - 3.0, 0.0 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		let animator = window.gManager.animator;

		uni.uVisibility = animator.add( {
			name: 'roadVisibility',
			initValue: 0,
		} );

		let mat = new THREE.ShaderMaterial( {
			fragmentShader: roadFrag,
			vertexShader: roadVert,
			uniforms: uni,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		} );

		super( geo, mat, );

		this.animator = animator;
		this.commonUniforms = uni;

	}

	public switchVisibility( visible: boolean ) {

		if ( visible ) this.visible = true;

		this.animator.animate( 'roadVisibility', visible ? 1 : 0.0, 1.0, () => {

			if ( ! visible ) this.visible = false;

		} );

	}

}

</document_content>
</document>
<document index="188">
<source>src/ts/MainScene/World/Sections/Section6/Road/shaders/road.fs</source>
<document_content>
varying vec2 vUv;
varying vec3 vColor;

uniform float time;
uniform float uVisibility;

void main( void ) {

	vec3 color = vColor;

	gl_FragColor = vec4( color, uVisibility );

}
</document_content>
</document>
<document index="189">
<source>src/ts/MainScene/World/Sections/Section6/Road/shaders/road.vs</source>
<document_content>
varying vec2 vUv;
varying vec3 vColor;

uniform float time;

void main( void ) {

	vec3 pos = position;
	pos.z *= uv.x;
	pos.z += sin( uv.x * 5.0 - time ) * (uv.x) * 2.0;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vUv = uv;
	vColor = vec3( smoothstep( 0.0, 1.0, 1.0 - vUv.x ) );

}
</document_content>
</document>
<document index="190">
<source>src/ts/MainScene/World/Sections/Section6/Wind/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import windVert from './shaders/wind.vs';
import windFrag from './shaders/wind.fs';

export class Wind extends THREE.Mesh {

	private animator: ORE.Animator;
	private commonUniforms: ORE.Uniforms;
	private animatorId: string;

	constructor( parentUniforms?: ORE.Uniforms ) {

		let num = 20;
		let range = new THREE.Vector3( 50, 10, 10 );

		let animatorId = Math.floor( Math.random() * 10000 ).toString();

		let offsetPosArray: number[] = [];
		let numArray: number[] = [];

		for ( let i = 0; i < num; i ++ ) {

			offsetPosArray.push(
				Math.random() * range.x,
				Math.random() * range.y,
				Math.random() * range.z,
			);

			numArray.push( i );

		}

		let originGeo = new THREE.PlaneGeometry( 5.0, 0.01, 10.0, 1.0 );

		let geo = new THREE.InstancedBufferGeometry();
		geo.setAttribute( 'position', originGeo.getAttribute( 'position' ) );
		geo.setAttribute( 'uv', originGeo.getAttribute( 'uv' ) );
		geo.setAttribute( 'normal', originGeo.getAttribute( 'normal' ) );
		geo.setIndex( originGeo.getIndex() );

		geo.setAttribute( 'offsetPos', new THREE.InstancedBufferAttribute( new Float32Array( offsetPosArray ), 3 ) );
		geo.setAttribute( 'num', new THREE.InstancedBufferAttribute( new Float32Array( numArray ), 1 ) );

		let uni = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			range: {
				value: range
			},
			total: {
				value: num
			},
			noiseTex: window.gManager.assetManager.getTex( 'noise' )
		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		let animator = window.gManager.animator;

		uni.uVisibility = animator.add( {
			name: 'windVisibility' + animatorId,
			initValue: 1,
			userData: {
				pane: {}
			}
		} );

		let mat = new THREE.ShaderMaterial( {
			vertexShader: windVert,
			fragmentShader: windFrag,
			uniforms: uni,
			side: THREE.DoubleSide,
			depthTest: false,
			blending: THREE.AdditiveBlending
		} );

		super( geo, mat );

		this.commonUniforms = uni;
		this.animator = animator;
		this.animatorId = animatorId;

		/*-------------------------------
			Dispose
		-------------------------------*/

		const onDispose = () => {

			geo.dispose();
			mat.dispose();

			this.removeEventListener( 'dispose', onDispose );

		};

		this.addEventListener( 'dispose', onDispose );

	}

	public switchVisibility( visible: boolean, duration: number = 1 ) {

		if ( visible ) this.visible = true;

		this.animator.animate( 'windVisibility' + this.animatorId, visible ? 1 : 0, duration, () => {

			if ( ! visible ) this.visible = false;

		} );

	}

	public dispose() {

		this.dispatchEvent( { type: 'dispose' } );

	}

}

</document_content>
</document>
<document index="191">
<source>src/ts/MainScene/World/Sections/Section6/Wind/shaders/wind.fs</source>
<document_content>
uniform sampler2D tex;
uniform sampler2D texBlur;

varying float vNum;
varying float vAlpha;
varying vec2 vUv;

void main( void ) {

	vec4 col = vec4( 1.0 );
	col.w *= 0.2;
	col.w *= vAlpha;


	gl_FragColor = col;

}
</document_content>
</document>
<document index="192">
<source>src/ts/MainScene/World/Sections/Section6/Wind/shaders/wind.vs</source>
<document_content>
attribute vec3 offsetPos;
attribute float num;
uniform float time;
uniform vec3 range;
uniform float contentNum;
uniform float particleSize;
uniform float uVisibility;
uniform float total;

uniform sampler2D noiseTex;

varying float vNum;
varying vec2 vUv;
varying float vAlpha;

#pragma glslify: import('./constants.glsl' )
#pragma glslify: rotate = require('./rotate.glsl' )
#pragma glslify: spriteUVSelector = require('./spriteUVSelector.glsl' )

void main( void ) {

	vec3 oPos = offsetPos;
	float t = time * 0.5;
	float n = num / total;
	vec4 noise = texture2D( noiseTex, vec2( n * 1.2 ) );
	vec3 pos = position;

	oPos += vec3(
		t * 30.0 + sin( t + ( oPos.y + oPos.z * 0.1 ) * 2.0 ) * 0.5,
		sin( oPos.x * 100.0 + oPos.z * 10.0) * 1.0,
		0.0
	);

	vec3 hrange = range / 2.0;

	oPos = mod( oPos, range );
	oPos -= hrange;

	vAlpha = smoothstep( hrange.z, hrange.z - 0.5, abs( oPos.z ) );
	vAlpha *= smoothstep( hrange.y, hrange.y - 0.5, abs( oPos.y ) );

	vAlpha *= uVisibility;

	pos += oPos;
	pos.y += texture2D( noiseTex, vec2(pos.x * 0.007 + oPos.y) ).x * 1.0;

	vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
	gl_Position = projectionMatrix * mvPosition;

	vNum = num;
	vUv = spriteUVSelector( uv, vec2( 4.0, 4.0 ), 10.0, num / 10.0 );

}
</document_content>
</document>
<document index="193">
<source>src/ts/MainScene/World/Sections/Section6/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import { Section, ViewingState } from '../Section';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Comrades } from './Comrades';
import { Wind } from './Wind';
import { Particle } from './Particle';
import { Road } from './Road';
import { Next } from './Next';

export class Section6 extends Section {

	private info: ORE.LayerInfo | null = null;
	private comrades?: Comrades;
	private wind?: Wind;
	private particle?: Particle;
	private road?: Road;

	// sp

	private cameraBasePos: THREE.Vector3 | null = null;
	private layoutControllerList: ORE.LayoutController[] = [];

	// next

	private next: Next;

	constructor( manager: THREE.LoadingManager, parentUniforms: ORE.Uniforms ) {

		super( manager, 'section_6', parentUniforms );

		this.elm = document.querySelector( '.section6' );

		this.bakuParam.materialType = 'normal';
		this.ppParam.bloomBrightness = 2.0;
		this.trailDepth = 0.96;

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = window.gManager.animator;

		/*-------------------------------
			Lights
		-------------------------------*/

		this.light1Data = {
			position: new THREE.Vector3( - 10.7, 1.5, 18.7 ),
			targetPosition: new THREE.Vector3(
				- 1.2926819324493408,
				- 12.504984855651855,
				13.764548301696777
			),
			intensity: 1
		};

		this.light2Data = {
			position: new THREE.Vector3( 5.0, - 10.7, 20 ),
			targetPosition: new THREE.Vector3( - 1.7, - 6.7, 12 ),
			intensity: 0,
		};

		/*-------------------------------
			Next
		-------------------------------*/

		this.next = new Next();

	}

	protected onLoadedGLTF( gltf: GLTF ): void {

		let scene = gltf.scene;
		this.add( scene );

		/*-------------------------------
			Comrades
		-------------------------------*/

		this.comrades = new Comrades( this.getObjectByName( 'Comrades' ) as THREE.Object3D, this.getObjectByName( "Comrades_Origin_Wrap" ) as THREE.SkinnedMesh, gltf.animations, this.commonUniforms );
		this.comrades.switchVisibility( this.sectionVisibility );

		this.layoutControllerList.push( new ORE.LayoutController( this.comrades.root.getObjectByName( 'Comrade_1' )!, {
			position: new THREE.Vector3( - 1.0, - 2.5, 0.5 )
		} ) );


		this.layoutControllerList.push( new ORE.LayoutController( this.comrades.root.getObjectByName( 'Comrade_2' )!, {
			position: new THREE.Vector3( 3.5, - 1.5, 0.5 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.comrades.root.getObjectByName( 'Comrade_3' )!, {
			position: new THREE.Vector3( - 1.0, 2.0, 0.8 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.comrades.root.getObjectByName( 'Comrade_4' )!, {
			position: new THREE.Vector3( - 1.0, 8.0, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.comrades.root.getObjectByName( 'Comrade_5' )!, {
			position: new THREE.Vector3( 0.0, 2.0, 0.0 )
		} ) );

		this.layoutControllerList.push( new ORE.LayoutController( this.comrades.root.getObjectByName( 'Comrade_6' )!, {
			position: new THREE.Vector3( 0.0, 2.0, 0.0 )
		} ) );

		/*-------------------------------
			Wind
		-------------------------------*/

		this.wind = new Wind( this.commonUniforms );
		this.wind.quaternion.copy( ( this.getObjectByName( 'Baku' ) as THREE.Object3D ).quaternion );
		this.wind.position.copy( ( this.getObjectByName( 'Baku' ) as THREE.Object3D ).position );
		this.wind.rotateY( Math.PI / 2 );
		this.wind.frustumCulled = false;
		this.wind.switchVisibility( this.sectionVisibility );
		this.add( this.wind );

		/*-------------------------------
			Paritcle
		-------------------------------*/

		this.particle = new Particle( this.commonUniforms );
		this.particle.quaternion.copy( ( this.getObjectByName( 'Baku' ) as THREE.Object3D ).quaternion );
		this.particle.position.copy( ( this.getObjectByName( 'Baku' ) as THREE.Object3D ).position );
		this.particle.rotateY( Math.PI / 2 );
		this.particle.switchVisibility( this.sectionVisibility );
		this.add( this.particle );

		/*-------------------------------
			Road
		-------------------------------*/

		this.road = new Road( this.commonUniforms );
		this.road.quaternion.copy( ( this.getObjectByName( 'Baku' ) as THREE.Object3D ).quaternion );
		this.road.position.copy( ( this.getObjectByName( 'Baku' ) as THREE.Object3D ).position );
		this.road.rotateY( Math.PI / 2 );
		this.road.switchVisibility( this.sectionVisibility );
		this.add( this.road );

		/*-------------------------------
			Camera base
		-------------------------------*/

		this.cameraBasePos = this.cameraTransform.position.clone();

		// resize

		if ( this.info ) {

			this.resize( this.info );

		}

	}

	private speed: number = 0.0;

	public wheel( e: WheelEvent ) {

		if ( this.sectionVisibility && e.deltaY > 0 ) {

			if ( this.particle ) this.particle.boost();

		}

	}

	public update( deltaTime: number ): void {

		this.next.update( deltaTime );

		if ( this.comrades ) this.comrades.update( deltaTime );

		if ( this.particle ) this.particle.update( deltaTime );

	}

	public switchViewingState( viewing: ViewingState ): void {

		super.switchViewingState( viewing );

		if ( this.particle ) {

			if ( this.particle ) this.particle.switchVisibility( this.sectionVisibility );

			if ( this.sectionVisibility ) {

				this.particle.boost();

			} else {

				this.particle.boostCancel();

			}

		}

		if ( this.wind ) this.wind.switchVisibility( this.sectionVisibility );
		if ( this.comrades ) this.comrades.switchVisibility( this.sectionVisibility );
		if ( this.road ) this.road.switchVisibility( this.sectionVisibility );

	}

	public resize( info: ORE.LayerInfo ) {

		super.resize( info );

		this.info = info;

		if ( this.particle ) {

			this.particle.resize( info );

		}

		if ( this.cameraBasePos ) {

			this.cameraTransform.position.copy( this.cameraBasePos.clone().add( new THREE.Vector3( info.size.portraitWeight * 1.0, 0.0, 0.0 ) ) );

		}

		this.layoutControllerList.forEach( item => {

			item.updateTransform( info.size.portraitWeight );

		} );

	}

}

</document_content>
</document>
<document index="194">
<source>src/ts/MainScene/World/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Section1 } from './Sections/Section1';
import { Section2 } from './Sections/Section2';
import { BakuTransform, Section } from './Sections/Section';
import { Section3 } from './Sections/Section3';
import { Section4 } from './Sections/Section4';
import { Baku } from './Baku';
import { Section5 } from './Sections/Section5';
import { Intro } from './Intro';
import { Section6 } from './Sections/Section6';
import { BG } from './BG';
import { Ground } from './Ground';
import { Lights } from './Lights';
import { DrawTrail } from './DrawTrail';
import { CameraTransform } from '../CameraController';

export class World extends THREE.Object3D {

	private scene: THREE.Scene;
	private commonUniforms: ORE.Uniforms;

	private lights: Lights;

	// manager

	private manager: THREE.LoadingManager;

	// bg

	public bg: BG;

	// ground

	public ground: Ground;

	// intro

	public intro: Intro;

	// section

	public sections: Section[] = [];
	public section1: Section1;
	public section2: Section2;
	public section3: Section3;
	public section4: Section4;
	public section5: Section5;
	public section6: Section6;

	// baku

	private baku: Baku;

	// trail

	public trail?: DrawTrail;

	// state

	public loaded: boolean = false;
	public splashed: boolean = false;

	constructor( renderer: THREE.WebGLRenderer, scene: THREE.Scene, parentUniforms: ORE.Uniforms ) {

		super();

		this.scene = scene;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
			uEnvMap: {
				value: null
			}
		} );

		/*-------------------------------
			Manager
		-------------------------------*/

		this.manager = new THREE.LoadingManager(
			() => {

			},
			( url, loaded, total ) => {

				let percentage = loaded / total;

				if ( percentage == 1.0 ) {

					this.loaded = true;

					/*-------------------------------
						コンパイル走るといいな～
					-------------------------------*/

					let camera = new THREE.OrthographicCamera( - 100, 100, 100, - 100, 0.01, 1000.0 );
					camera.position.set( 0, 0, 500 );

					let visibility: boolean[] = [];

					this.sections.forEach( section => {

						visibility.push( section.visible );
						section.visible = true;

					} );

					renderer.render( this.scene, camera );

					this.sections.forEach( section => {

						visibility.push( section.visible );
						section.visible = visibility.shift() || false;

					} );

					// -----------------------------------

					this.dispatchEvent( {
						type: 'load',
					} );

				}

				this.intro.updateLoadState( percentage );

				this.dispatchEvent( {
					type: 'loadProgress',
					percentage
				} );

			}
		);

		/*-------------------------------
			Lights
		-------------------------------*/

		this.lights = new Lights( this.scene );

		/*-------------------------------
			BG
		-------------------------------*/

		this.bg = new BG( this.commonUniforms );
		this.scene.add( this.bg );

		/*-------------------------------
			Ground
		-------------------------------*/

		this.ground = new Ground( this.scene.getObjectByName( 'CommonGround' ) as THREE.Mesh, this.commonUniforms );

		/*-------------------------------
			Intro
		-------------------------------*/

		this.intro = new Intro( renderer, this.scene.getObjectByName( 'Intro' ) as THREE.Object3D, this.commonUniforms );

		/*-------------------------------
			Baku
		-------------------------------*/

		this.baku = new Baku( this.manager, this.commonUniforms );
		this.add( this.baku );

		window.setInterval( () => {

			if ( this.section4.sectionVisibility ) {

				this.baku.jump();

			}

		}, 3500 );

		/*-------------------------------
			Trail
		-------------------------------*/

		let trailAssets = this.scene.getObjectByName( 'TrailAssets' ) as THREE.Object3D;

		if ( ! window.isSP ) {

			this.trail = new DrawTrail( renderer, trailAssets, this.commonUniforms );
			this.trail.position.set( 0, 0, 0 );
			this.trail.frustumCulled = false;
			this.add( this.trail );

		} else {

			trailAssets.visible = false;

		}

		/*-------------------------------
			Sections
		-------------------------------*/

		this.section1 = new Section1( this.manager, this.commonUniforms );
		this.add( this.section1 );
		this.section1.wall.setTex( this.intro.renderTarget.texture );
		this.sections.push( this.section1 );

		this.section2 = new Section2( this.manager, this.commonUniforms );
		this.add( this.section2 );
		this.sections.push( this.section2 );

		this.section3 = new Section3( this.manager, this.commonUniforms, renderer );
		this.add( this.section3 );
		this.sections.push( this.section3 );

		this.section4 = new Section4( this.manager, this.commonUniforms, renderer );
		this.add( this.section4 );
		this.sections.push( this.section4 );

		this.baku.addEventListener( 'jump', () => {

			setTimeout( () => {

				this.section4.switchText();
				window.cameraController.shake( 0.08, 0.3, 7 );

			}, 700 );

		} );

		this.section5 = new Section5( this.manager, this.commonUniforms );
		this.add( this.section5 );
		this.sections.push( this.section5 );

		this.section6 = new Section6( this.manager, this.commonUniforms );
		this.add( this.section6 );
		this.sections.push( this.section6 );

		this.baku.onLoaded = () => {

			this.section2.setSceneTex( this.baku.sceneRenderTarget.texture );

			if ( this.trail ) {

				this.trail.setSceneTex( this.baku.sceneRenderTarget.texture );

			}

		};

		/*-------------------------------
			EnvMap
		-------------------------------*/

		let cubemapLoader = new THREE.CubeTextureLoader();
		cubemapLoader.load( [
			'/assets/envmap/sec2/px.png',
			'/assets/envmap/sec2/nx.png',
			'/assets/envmap/sec2/py.png',
			'/assets/envmap/sec2/ny.png',
			'/assets/envmap/sec2/pz.png',
			'/assets/envmap/sec2/nz.png',
		], ( tex ) => {

			this.commonUniforms.uEnvMap.value = tex;

		} );


	}

	public changeSection( sectionIndex: number ) {

		let viewingIndex = 0;

		this.sections.forEach( ( item, index ) => {

			if ( index > sectionIndex ) {

				item.switchViewingState( 'ready' );

			} else if ( index < sectionIndex ) {

				item.switchViewingState( 'passed' );

			} else {

				item.switchViewingState( 'viewing' );

				viewingIndex = index;

			}

		} );

		let section = this.sections[ viewingIndex ];

		// light

		this.lights.changeSection( section );

		// baku

		this.baku.changeRotateSpeed( section.bakuParam.rotateSpeed );
		this.baku.changeMaterial( section.bakuParam.materialType );
		this.baku.changeSectionAction( section.sectionName );

		//  bg

		this.bg.changeSection( sectionIndex );

		// ground

		this.ground.changeSection( sectionIndex );

		// trail

		if ( this.trail ) this.trail.changeMaterial( sectionIndex );

		return section;

	}

	public updateTransform( scrollValue: number ) {

		let index = Math.max( 0.0, Math.min( this.sections.length - 1, Math.floor( scrollValue ) ) );
		let t = scrollValue % 1;

		let from = this.sections[ index ];
		let to = this.sections[ index + 1 ] || from;

		//  cameraTransform

		let cameraTransform: CameraTransform = {
			position: from.cameraTransform.position.clone().lerp( to.cameraTransform.position, t ),
			targetPosition: from.cameraTransform.targetPosition.clone().lerp( to.cameraTransform.targetPosition, t ),
			fov: 0,
			fovCalculated: from.cameraTransform.fovCalculated + ( to.cameraTransform.fovCalculated - from.cameraTransform.fovCalculated ) * t,
		};

		// bakuTransform

		let bakuTransform: BakuTransform = {
			position: from.bakuTransform.position.clone().lerp( to.bakuTransform.position, t ),
			rotation: from.bakuTransform.rotation.clone().slerp( to.bakuTransform.rotation, t ),
			scale: from.bakuTransform.scale.clone().lerp( to.bakuTransform.scale, t ),
		};

		this.baku.position.copy( bakuTransform.position );
		this.baku.scale.copy( bakuTransform.scale );
		this.baku.quaternion.copy( bakuTransform.rotation );

		return {
			cameraTransform,
			bakuTransform
		};

	}

	public update( deltaTime: number ) {

		this.intro.update( deltaTime );

		this.sections.forEach( item => {

			item.update( deltaTime );

		} );

		this.baku.update( deltaTime );

		this.lights.update( deltaTime );

		if ( this.trail ) this.trail.update( deltaTime );

	}

	public resize( info: ORE.LayerInfo ) {

		if ( this.trail ) this.trail.resize( info );

		this.intro.resize( info );

		this.baku.resize( info );

		this.sections.forEach( item => {

			item.resize( info );

		} );

	}

	public splash( camera: THREE.PerspectiveCamera ) {

		if ( this.splashed ) return;

		this.splashed = true;
		this.section1.wall.init( camera );
		this.section1.splash();

		this.baku.show();

		setTimeout( () => {

			this.section1.switchViewingState( "viewing" );

		}, 500 );

		setTimeout( () => {

			this.section1.wall.dispose();

		}, 1500 );


	}

	public cancelIntro() {

		if ( this.splashed ) return;

		this.splashed = true;
		this.intro.skip();
		this.section1.wall.dispose();
		this.section1.splash();
		this.baku.show( 0 );


	}

}

</document_content>
</document>
<document index="195">
<source>src/ts/MainScene/index.ts</source>
<document_content>
import * as THREE from 'three';
import * as ORE from 'ore-three';

import { GlobalManager } from './GlobalManager';
import { RenderPipeline } from './RenderPipeline';
import { CameraController } from './CameraController';
import { World } from './World';
import { Scroller } from './Scroller';
import { Subtitles } from './Subtitle';
import { Header } from './Header';
import { Footer } from './Footer';
import { Loading } from './Loading';

import { Lethargy } from 'lethargy';
import { Scroll } from './Scroll';

export class MainScene extends ORE.BaseLayer {

	private gManager?: GlobalManager;
	private animator?: ORE.Animator;
	private renderPipeline?: RenderPipeline;
	private cameraController?: CameraController;
	private scroller: Scroller;

	// content

	private world?: World;
	private subtitles: Subtitles;
	private header: Header;
	private footer: Footer;
	private loading: Loading;

	// wheel

	private lethargy: any;
	private memDelta: number = 0.0;
	private riseDelta: boolean = false;

	// wrapper

	private contentWrapperElm: HTMLElement;

	// scroll

	private scroll: Scroll;

	// state

	private raycasterWorldPos: THREE.Vector3 = new THREE.Vector3();

	constructor( param: ORE.LayerParam ) {

		super( param );

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			uTimeMod: {
				value: 0
			}
		} );

		/*-------------------------------
			ContentWrapper
		-------------------------------*/

		this.contentWrapperElm = document.querySelector( '.content-wrapper' )!;

		/*-------------------------------
			Scroller
		-------------------------------*/

		this.scroller = new Scroller();

		this.scroller.addListener( 'changeSelectingSection', ( sectionIndex: number ) => {

			if ( this.world ) {

				let section = this.world.changeSection( sectionIndex );

				this.subtitles.changeSection( sectionIndex );

				if ( this.cameraController ) this.cameraController.changeRange( section.cameraRange );

				if ( this.renderPipeline ) this.renderPipeline.updateParam( section.ppParam );

				if ( this.animator ) this.animator.animate( 'trailCursorDepth', section.trailDepth );

				this.footer.changeTimelineSection( sectionIndex + 1 );

				document.body.setAttribute( 'data-section', ( sectionIndex + 1 ).toString() );

				window.gManager.emitEvent( 'sectionChange', [ section.sectionName ] );

			}

			if ( sectionIndex > 0 ) {

				this.scroll.switchVisible( false );

			}


		} );

		this.lethargy = new Lethargy();

		//  scroll button

		this.scroll = new Scroll();

		this.scroll.addListener( 'click', () => {

			this.scroll.switchVisible( false );
			this.scroller.move( 1 );

		} );

		/*-------------------------------
			Subtitles
		-------------------------------*/

		this.subtitles = new Subtitles();
		window.subtitles = this.subtitles;

		/*-------------------------------
			Header
		-------------------------------*/

		this.header = new Header();

		/*-------------------------------
			Footer
		-------------------------------*/

		this.footer = new Footer();

		this.footer.addListener( 'clickTimeline', ( section: number ) => {

			this.scroller.move( section - 1.0, 2.0 );

		} );

		/*-------------------------------
			Loading
		-------------------------------*/

		this.loading = new Loading();

	}

	onBind() {

		super.onBind( );

		this.gManager = new GlobalManager();

		this.gManager.assetManager.load( { assets: [
			{ name: 'commonScene', path: './assets/scene/common.glb', type: "gltf", timing: 'must' },
			{ name: 'logo', path: './assets/textures/junni_logo.png', type: 'tex', timing: 'must' },
			{ name: 'sec2BGText', path: './assets/textures/sec2-bg-text.png', type: 'tex', timing: 'must', onLoad( value: THREE.Texture ) {

				value.wrapS = THREE.RepeatWrapping;
				value.wrapT = THREE.RepeatWrapping;

			} },
			{ name: 'introText', path: './assets/textures/intro-text.png', type: 'tex', timing: 'must' },
			{ name: 'topLogo', path: './assets/textures/top_logo.png', type: 'tex', timing: 'must' },
			{ name: 'matCap', path: './assets/textures/matcap.png', type: 'tex', timing: 'must' },
			{ name: 'matCapOrange', path: './assets/textures/matcap_orange.png', type: 'tex', timing: 'must' },
			{ name: 'noise', path: './assets/textures/noise.png', type: 'tex', timing: 'sub', onLoad( value: THREE.Texture ) {

				value.wrapS = THREE.RepeatWrapping;
				value.wrapT = THREE.RepeatWrapping;

			}, },
			{ name: 'display', path: './assets/textures/display.png', type: 'tex', timing: 'sub' },
			{ name: 'human', path: './assets/textures/humans/human.png', type: 'tex', timing: 'sub' },
			{ name: 'outro', path: './assets/textures/outro-text.png', type: 'tex', timing: 'sub', onLoad: ( tex: THREE.Texture ) => {

				tex.wrapS = THREE.RepeatWrapping;

			} },
			{ name: 'lensDirt', path: './assets/textures/lens-dirt.png', type: 'tex', timing: 'sub', onLoad: ( tex: THREE.Texture ) => {

				tex.wrapS = THREE.RepeatWrapping;

			} },
			{ name: 'groundIllust', path: './assets/textures/illust.jpg', type: 'tex', timing: 'sub', onLoad: ( tex: THREE.Texture ) => {

				tex.wrapS = THREE.RepeatWrapping;
				tex.wrapT = THREE.RepeatWrapping;

			} },
			{ name: 'groundGrid', path: './assets/textures/grid.jpg', type: 'tex', timing: 'sub', onLoad: ( tex: THREE.Texture ) => {

				tex.wrapS = THREE.RepeatWrapping;
				tex.wrapT = THREE.RepeatWrapping;

			} },
			{ name: 'random', path: './assets/textures/random.png', type: 'tex', timing: 'sub', onLoad: ( tex: THREE.Texture ) => {

				tex.wrapS = THREE.RepeatWrapping;
				tex.wrapT = THREE.RepeatWrapping;
				tex.minFilter = THREE.NearestFilter;
				tex.magFilter = THREE.NearestFilter;

			} },
			{ name: 'signpen', path: './assets/textures/signpen.png', type: 'tex', timing: 'sub' },
			{ name: 'sec3Particle', path: './assets/textures/pattern.jpg', type: 'tex', timing: 'sub' },
		] } );

		this.gManager.assetManager.addEventListener( 'loadMustAssets', ( e ) => {

			let gltf = window.gManager.assetManager.getGltf( 'commonScene' );

			if ( gltf ) {

				this.scene.add( gltf.scene );

			}

			this.initScene();

			this.onResize();


		} );

		/*-------------------------------
			Animator
		-------------------------------*/

		this.animator = this.gManager.animator;

		this.animator.add( {
			name: 'trailCursorDepth',
			initValue: 0.97
		} );

		/*-------------------------------
			CameraController
		-------------------------------*/

		this.cameraController = new CameraController( this.camera );
		window.cameraController = this.cameraController;

		/*-------------------------------
			Raycaster
		-------------------------------*/

		this.gManager.eRay.addEventListener( 'hover', ( e ) => {

			this.raycasterWorldPos.copy( e.intersection.point );

		} );

	}

	private initScene() {

		/*-------------------------------
			RenderPipeline
		-------------------------------*/

		if ( this.renderer ) {

			this.renderer.shadowMap.enabled = true;

			this.renderPipeline = new RenderPipeline( this.renderer, this.commonUniforms );

		}

		/*-------------------------------
			World
		-------------------------------*/

		if ( this.renderer ) {

			this.world = new World( this.renderer, this.scene, this.commonUniforms );
			this.scene.add( this.world );

			this.world.changeSection( 0 );
			this.world.addEventListener( 'load', () => {

				this.loading.switchVisibility( false );

			} );

			this.world.intro.addListener( 'showImaging', () => {

				this.header.switchLogoVisibility( true );

			} );

			this.world.intro.addListener( 'finish', () => {

				this.splash();

			} );

			this.scroller.changeSectionNum( this.world.sections.length );

		}

	}

	public animate( deltaTime: number ) {

		deltaTime = Math.min( 0.1, deltaTime );

		this.commonUniforms.uTimeMod.value = this.time % 1;

		this.scroller.update( deltaTime );

		if ( this.gManager ) {

			this.gManager.update( deltaTime );

		}

		if ( this.cameraController ) {

			this.cameraController.update( deltaTime );

		}

		if ( this.world ) {

			let transform = this.world.updateTransform( this.scroller.value );

			this.world.update( deltaTime );

			if ( this.cameraController ) {

				this.cameraController.updateTransform( transform.cameraTransform );

			}

		}

		if ( this.renderPipeline ) {

			if ( this.world && ! this.world.intro.finished ) {

				this.renderPipeline.render( this.world.intro.scene, this.world.intro.camera );
				return;

			}

			this.renderPipeline.render( this.scene, this.camera );

		}

	}

	public onResize() {

		this.contentWrapperElm.style.height = window.innerHeight + 'px';

		super.onResize();

		if ( this.cameraController ) {

			this.cameraController.resize( this.info );

		}

		if ( this.renderPipeline ) {

			this.renderPipeline.resize( this.info );

		}

		if ( this.world ) {

			this.world.resize( this.info );

		}

	}

	public onHover( args: ORE.TouchEventArgs ) {

		if ( args.position.x != args.position.x ) return;

		if ( this.gManager ) {

			this.gManager.eRay.update( args.screenPosition, this.camera );

		}

		if ( this.cameraController ) {

			this.cameraController.updateCursor( args.screenPosition );

		}

		if ( this.world ) {

			let depth = 0.97;

			if ( this.animator ) depth = this.animator.get( 'trailCursorDepth' )!;

			let cursorWorldPos = new THREE.Vector3( args.screenPosition.x, args.screenPosition.y, depth ).unproject( this.camera );

			if ( cursorWorldPos.x != cursorWorldPos.x ) return;

			this.world.intro.hover( args );
			this.world.section1.hover( args, this.camera );
			this.world.section2.hover( args, this.camera );
			this.world.section3.hover( args );

			if ( this.world.trail ) this.world.trail.updateCursorPos( cursorWorldPos, this.raycasterWorldPos );

		}

	}

	private optimizedWheel( event: WheelEvent ) {

		if ( this.world && this.world.splashed ) {

			this.scroller.addVelocity( event.deltaY * 0.00005 );
			this.world.section6.wheel( event );

		}

	}

	public onWheel( event: WheelEvent ): void {

		if ( this.lethargy.check( event ) !== false ) {

			this.optimizedWheel( event );

		} else {

			let d = event.deltaY - this.memDelta;

			if ( Math.abs( d ) > 50 ) {

				this.memDelta = d;
				this.optimizedWheel( event );
				this.riseDelta = true;

			} else if ( d == 0 ) {

				if ( this.riseDelta ) {

					this.optimizedWheel( event );

				}

			} else if ( d < 0 ) {

				this.riseDelta = false;

			}


			this.memDelta = ( event.deltaY );

		}

	}

	public onTouchStart( args: ORE.TouchEventArgs ) {

		if ( this.world && this.world.splashed ) {

			this.scroller.catch();

		}

	}

	public onTouchMove( args: ORE.TouchEventArgs ) {

		if ( this.world && this.world.splashed ) {

			this.scroller.drag( args.delta.y );

		}

	}

	public onTouchEnd( args: ORE.TouchEventArgs ) {

		if ( this.world && this.world.splashed ) {

			this.scroller.release( args.delta.y * 2.0 );

		}

	}

	private splash() {

		if ( this.world ) {

			this.world.splash( this.camera );

		}

		this.showHeaderFooter();

		setTimeout( () => {

			this.scroll.switchVisible( true );

		}, 1000 );

	}

	private showHeaderFooter() {

		this.header.switchLogoVisibility( true );
		this.footer.switchCopyVisibility( true );
		this.footer.switchTimelineVisibility( true );

	}


}

</document_content>
</document>
<document index="196">
<source>src/ts/global.d.ts</source>
<document_content>
declare module 'lethargy';

</document_content>
</document>
<document index="197">
<source>src/ts/main.ts</source>
<document_content>
import * as ORE from 'ore-three';
import { MainScene } from './MainScene';

import { GlobalManager } from './MainScene/GlobalManager';
import { AssetManager } from './MainScene/GlobalManager/AssetManager';
import { Subtitles } from './MainScene/Subtitle';
import { CameraController } from './MainScene/CameraController';

declare global {
	interface Window {
		gManager: GlobalManager;
		assetManager: AssetManager;
		subtitles: Subtitles;
		cameraController: CameraController;
		isIE: boolean;
		isSP: boolean;
		mainScene: MainScene;
	}
}