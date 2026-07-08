// src/Experience/World/SplashCube.ts
// Apple Fifth Avenue-style glass cube — IS our Baku.
//
// The cube IS the baku: it stays on all sections, rotating, changing materials
// per section role (GLASS/WIRE/NORMAL). During splash: rotates + edges brighten
// with progress. At 100%: "opener" — faces pulse outward + back (not dissolve).
// After opener: cube continues as baku on all sections.

import * as THREE from 'three'
import { Noise } from '../../Utils/Noise'
import { BakuRole, type BakuMaterialState } from '../../core/types'

export interface BakuMaterialParams {
  color: THREE.Color
  emissive: THREE.Color
  roughness: number
  metalness: number
  role: BakuRole
}

// Transmission is DISABLED on the PARITY path (WebGL2 / WebGLBackend fallback).
// On the PREMIUM path (real WebGPU, see DeviceCapability.isRealWebGPU) we use
// MeshPhysicalNodeMaterial with transmission=1 — true glass refraction.
// The parity path uses opacity-based glass instead — consistent visual parity.
// Env map reflections (from RoomEnvironment PMREM) provide the glass look on
// both paths; the premium path additionally gets worldDNA TSL displacement +
// iridescent shimmer + rim glow.

/** Kept for API compat — Renderer.init() imports this but it's a no-op now.
 *  Transmission is gated by `isRealWebGPU` in SplashCube.buildCube(). */
export function setTransmissionEnabled(_enabled: boolean): void {
  // No-op — transmission is decided at material-creation time in buildCube()
}

/** Rotation per section transition (radians). ~30° = π/6. Persistent —
 *  committed to _idleRotY so the cube stays rotated after each transition. */
const ROT_PER_TRANSITION = Math.PI / 6

export class SplashCube extends THREE.Mesh {
  private faces: THREE.Mesh[] = []
  private faceMaterials: THREE.MeshPhysicalMaterial[] = []
  private edgeLines: THREE.LineSegments[] = []
  private time = 0
  private openerProgress = 0 // 0=closed, 1=fully opened (pulsed out)
  private openerTarget = 0
  private openerPhase: 'idle' | 'opening' | 'closing' | 'done' = 'idle'

  // Face directions: +X, -X, +Y, -Y, +Z, -Z
  private readonly faceDirs = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ]

  private targetParams: BakuMaterialParams = {
    color: new THREE.Color(0x333333),
    emissive: new THREE.Color(0x111111),
    roughness: 0.1,
    metalness: 0.9,
    role: BakuRole.NORMAL,
  }
  private _currentRole: BakuRole | null = null
  // worldDNA blend state (set by Experience.update every frame)
  private _blendFromColor: THREE.Color = new THREE.Color(0x3a3a5e)
  private _blendToColor: THREE.Color = new THREE.Color(0x3a3a5e)
  private _blendFromEmissive: THREE.Color = new THREE.Color(0x5a5a8a)
  private _blendToEmissive: THREE.Color = new THREE.Color(0x5a5a8a)
  private _blendT: number = 0
  // Pre-allocated scratch vectors — avoid per-face per-frame allocations
  private _tmpFaceOffset: THREE.Vector3 = new THREE.Vector3()

  constructor() {
    // Dummy geometry — we render faces as children, not the mesh itself.
    // Built-in MeshBasicMaterial (NOT NodeMaterial) — reduces uniform group count.
    super(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }))
    this.name = 'baku-cube'
    this.visible = true
    this.buildCube()
  }

  private buildCube(): void {
    const size = 1.6
    const half = size / 2

    // ── Apple Fifth Avenue-style glass cube shader ──
    // Custom ShaderMaterial with:
    //   - borders.glsl: inverted edge mask (smoothstep borders)
    //   - radial-rainbow.glsl: rainbow gradient by angle from center
    //   - env-map reflection: scene.environment sampled via reflect()
    //   - depth-based opacity (faces further from camera more transparent)
    //   - additive blending for glow
    //
    // Works on ALL backends (WebGLRenderer + WebGPURenderer) because it's
    // a regular ShaderMaterial (no TSL nodes).
    const cubeVertexShader = /* glsl */`
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `

    const cubeFragmentShader = /* glsl */`
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      uniform float uTime;
      uniform float uBorderWidth;
      uniform float uReflectionOpacity;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform samplerCube uEnvMap;
      uniform bool uHasEnvMap;
      uniform vec3 uCameraPos;

      const float PI2 = 6.28318530718;

      // borders.glsl — inverted edge mask
      float borders(vec2 uv, float strokeWidth) {
        vec2 bl = smoothstep(vec2(0.0), vec2(strokeWidth), uv);
        vec2 tr = smoothstep(vec2(0.0), vec2(strokeWidth), 1.0 - uv);
        return 1.0 - bl.x * bl.y * tr.x * tr.y;
      }

      // radial-rainbow.glsl — rainbow gradient by angle from center
      vec4 radialRainbow(vec2 st, float tick) {
        vec2 toCenter = vec2(0.5) - st;
        float angle = mod((atan(toCenter.y, toCenter.x) / PI2) + 0.5 + sin(tick * 0.002), 1.0);
        vec4 a = vec4(0.15, 0.58, 0.96, 1.0);
        vec4 b = vec4(0.29, 1.00, 0.55, 1.0);
        vec4 c = vec4(1.00, 0.0, 0.85, 1.0);
        vec4 d = vec4(0.92, 0.20, 0.14, 1.0);
        vec4 e = vec4(1.00, 0.96, 0.32, 1.0);
        float step = 1.0 / 10.0;
        vec4 color = a;
        color = mix(color, b, smoothstep(step * 1.0, step * 2.0, angle));
        color = mix(color, a, smoothstep(step * 2.0, step * 3.0, angle));
        color = mix(color, b, smoothstep(step * 3.0, step * 4.0, angle));
        color = mix(color, c, smoothstep(step * 4.0, step * 5.0, angle));
        color = mix(color, d, smoothstep(step * 5.0, step * 6.0, angle));
        color = mix(color, c, smoothstep(step * 6.0, step * 7.0, angle));
        color = mix(color, d, smoothstep(step * 7.0, step * 8.0, angle));
        color = mix(color, e, smoothstep(step * 8.0, step * 9.0, angle));
        color = mix(color, a, smoothstep(step * 9.0, step * 10.0, angle));
        return color;
      }

      void main() {
        // Screen-space coordinates for rainbow
        vec2 st = vUv;

        // Rainbow stroke color (animated)
        vec4 strokeColor = radialRainbow(st, uTime * 1000.0);

        // Edge borders mask — MUCH wider for visible rainbow edges
        float border = borders(vUv, 0.08);
        float border2 = borders(vUv, 0.15) * 0.5;
        float edgeMask = clamp(border + border2, 0.0, 1.0);

        // Depth-based opacity (faces further from camera more transparent)
        float depth = clamp(smoothstep(-2.0, 2.0, vWorldPos.z - uCameraPos.z), 0.4, 0.9);

        // Reflection: sample env cube map using reflected view direction
        vec3 viewDir = normalize(uCameraPos - vWorldPos);
        vec3 reflectDir = reflect(-viewDir, vNormal);
        vec4 reflection = vec4(0.0);
        if (uHasEnvMap) {
          reflection = textureCube(uEnvMap, reflectDir);
        }
        reflection.a *= uReflectionOpacity * depth;

        // Base glass color with subtle tint
        vec4 glassColor = vec4(uColor, uOpacity * depth);

        // Composite: glass + reflection + rainbow edges
        // Edges use rainbow color with full opacity
        vec4 stroke = strokeColor * edgeMask;
        vec4 finalColor = glassColor + reflection * 0.5;

        // Edges glow on top (additive) — make rainbow prominent
        finalColor.rgb = mix(finalColor.rgb, stroke.rgb, edgeMask * 0.9);
        finalColor.a = max(finalColor.a, edgeMask * 0.8);

        gl_FragColor = finalColor;
      }
    `

    const sharedMat = new THREE.ShaderMaterial({
      vertexShader: cubeVertexShader,
      fragmentShader: cubeFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBorderWidth: { value: 0.008 },
        uReflectionOpacity: { value: 0.3 },
        uColor: { value: new THREE.Color(0x1a2a4a) },
        uOpacity: { value: 0.45 },
        uEnvMap: { value: null },
        uHasEnvMap: { value: false },
        uCameraPos: { value: new THREE.Vector3() },
      },
    })
    this.faceMaterials.push(sharedMat as unknown as THREE.MeshPhysicalMaterial)

    for (let i = 0; i < 6; i++) {
      const dir = this.faceDirs[i]!

      const geo = new THREE.PlaneGeometry(size, size)
      const face = new THREE.Mesh(geo, sharedMat)
      face.userData = { dir: dir.clone(), basePos: dir.clone().multiplyScalar(half) }
      face.position.copy(face.userData.basePos)
      face.lookAt(dir.clone().multiplyScalar(half * 2))
      // Render order: transparent faces need sorted rendering. Set explicit
      // renderOrder so faces render back-to-front for correct alpha blending.
      face.renderOrder = 2

      this.faces.push(face)
      this.add(face)

      // Glowing edge lines — brighten the glass edges for a "framed" look
      const edgeGeo = new THREE.EdgesGeometry(geo)
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xa0b8e0,
        transparent: true,
        opacity: 0.6,
      })
      const edges = new THREE.LineSegments(edgeGeo, edgeMat)
      edges.position.copy(face.position)
      edges.rotation.copy(face.rotation)
      edges.renderOrder = 3
      this.edgeLines.push(edges)
      this.add(edges)
    }
  }

  /** Drive loading progress (0-1). No-op — edge glow was removed for
   *  on-demand rendering. Kept for API compat (main-app calls it). */
  setProgress(_p: number): void {
    // No-op
  }

  /** Trigger the opener — faces pulse outward + back (cube "breathes" open). */
  triggerOpener(): void {
    this.openerPhase = 'opening'
    this.openerTarget = 1
  }

  /** Alias for Experience.update() compatibility (Baku API). */
  updateMaterial(params: BakuMaterialState): void {
    this.targetParams = {
      color: params.color ? new THREE.Color(params.color) : this.targetParams.color,
      emissive: params.emissive ? new THREE.Color(params.emissive) : this.targetParams.emissive,
      roughness: params.roughness ?? this.targetParams.roughness,
      metalness: params.metalness ?? this.targetParams.metalness,
      role: (params.role ?? this.targetParams.role) as BakuRole,
    }
  }

  /** Transition progress (0-1) set by Experience during section change.
   *  0 = idle (static), 0→1 = transitioning to next section.
   *  Drives a one-shot rotation + tilt + drift + scale pulse. */
  private _transitionT = 0
  private _transitionDir = 0 // +1 = next, -1 = prev
  private _idleRotY = 0 // accumulated rotation that stays after transition
  // Previous-frame transition state — used to detect section-commit (the
  // moment nav._progress snaps from ~1 back to 0, dir goes nonzero→0).
  private _prevTransitionT = 0
  private _prevTransitionDir = 0

  /** Called by Experience when a section transition is in progress.
   *  t = 0..1 (transition progress), dir = +1 (next) or -1 (prev). */
  setTransition(t: number, dir: number): void {
    this._transitionT = t
    this._transitionDir = dir
  }

  update(dt: number): void {
    this.time += dt

    // ════════════════════════════════════════════════════════════════════
    // SEAMLESS CINEMATIC TRANSITION
    // ════════════════════════════════════════════════════════════════════
    // Two easing curves drive different aspects of the animation:
    //
    //   tEase = smoothstep(transitionT)  — 0→1 monotonically (persistent)
    //   sinT  = sin(tEase * PI)          — 0→1→0 (transient: 0 at both ends)
    //
    // PERSISTENT effects (rotation Y) use tEase and are COMMITTED to
    // _idleRotY when the transition completes, so the cube stays rotated —
    // no snap-back.
    //
    // TRANSIENT effects (tilt X, drift XY, scale, displacement) use sinT
    // so they are exactly 0 at transition start AND end. When the section
    // commits (transitionT→0), these are already 0 → no jerk.
    //
    // COMMIT DETECTION: nav._progress snaps from ~0.99 to 0 in one frame
    // when the section changes, so transitionDir goes nonzero→0. We detect
    // this (prevDir≠0 && dir==0 && prevT>0.5) and accumulate the rotation.
    // The 0.5 threshold ensures snap-backs (progress<0.5) don't commit.
    // ════════════════════════════════════════════════════════════════════

    // ── Detect transition completion & commit rotation ──
    const committed = this._prevTransitionDir !== 0
      && this._transitionDir === 0
      && this._prevTransitionT > 0.5
    if (committed) {
      this._idleRotY += this._prevTransitionDir * ROT_PER_TRANSITION
    }

    // ── Easing curves ──
    const tEase = this._transitionT * this._transitionT * (3 - 2 * this._transitionT)
    const sinT = Math.sin(tEase * Math.PI) // 0 at t=0 and t=1, 1 at t=0.5
    // Use the direction that's active this frame; on the commit frame,
    // _transitionDir is already 0, so fall back to prevDir for one frame
    // (tEase is 0 on that frame, so the direction doesn't affect the result,
    // but it keeps the code path clean).
    const dir = this._transitionDir || this._prevTransitionDir

    // ════════════════════════════════════════════════════════════════════
    // CINEMATIC MULTI-AXIS MOTION
    // ════════════════════════════════════════════════════════════════════
    // Persistent (commits to _idleRotY):
    //   rotation.y — 30° per transition, accumulates
    //
    // Transient (sinT-scaled → 0 at start AND end, no jerk on commit):
    //   rotation.x — tilt (peaks ~7° at mid)
    //   rotation.z — Dutch roll (peaks ~3.5° at mid — cinematic flair)
    //   position.x — organic drift
    //   position.y — organic drift + upward lift (dir-independent "float")
    //   scale      — breathe (peaks +5% at mid)
    //
    // All transient effects return to exactly 0/1 before the section commits,
    // so the cube settles cleanly into its new idle state with no snap.
    // ════════════════════════════════════════════════════════════════════

    // ── Rotation Y (persistent — commits to _idleRotY) ──
    this.rotation.y = this._idleRotY + dir * tEase * ROT_PER_TRANSITION

    // ── Tilt X (transient — peaks at mid, returns to 0) ──
    this.rotation.x = sinT * 0.12 * dir

    // ── Dutch roll Z (transient — subtle cinematic angle) ──
    this.rotation.z = sinT * 0.06 * dir

    // ── Drift XY + lift (transient — organic, returns to origin) ──
    // X: pure noise drift (directional, peaks at mid)
    // Y: noise drift (directional) + upward lift (dir-independent "float")
    // The lift gives the cube a weightless "rising" feel during transitions.
    this.position.x = Noise.organicValue(this.time, 10, 0.15, 0.08) * sinT * dir
    this.position.y = Noise.organicValue(this.time, 20, 0.18, 0.08) * sinT * dir
    this.position.y += sinT * 0.15 // upward lift (always positive — "floats" up)

    // ── Scale pulse (transient — subtle weight at mid) ──
    this.scale.setScalar(1 + sinT * 0.05)

    // ── Save prev state for next frame's commit detection ──
    this._prevTransitionT = this._transitionT
    this._prevTransitionDir = this._transitionDir

    // ════════════════════════════════════════════════════════════════════
    // OPENER (splash intro only — independent of section transitions)
    // ════════════════════════════════════════════════════════════════════
    if (this.openerPhase !== 'done' || this.openerProgress > 0.01) {
      this.openerProgress += (this.openerTarget - this.openerProgress) * Math.min(1, dt * 4)
      if (this.openerPhase === 'opening' && this.openerProgress > 0.9) {
        this.openerPhase = 'closing'
        this.openerTarget = 0
      } else if (this.openerPhase === 'closing' && this.openerProgress < 0.05) {
        this.openerPhase = 'done'
        this.openerProgress = 0
        // Snap faces EXACTLY back to base positions
        for (let i = 0; i < this.faces.length; i++) {
          const basePos = this.faces[i]!.userData.basePos as THREE.Vector3
          this.faces[i]!.position.copy(basePos)
          this.faces[i]!.rotation.z = 0
          this.edgeLines[i]!.position.copy(basePos)
          this.edgeLines[i]!.rotation.copy(this.faces[i]!.rotation)
        }
      }

      if (this.openerPhase !== 'done') {
        const pulse = this.openerProgress * 0.8
        for (let i = 0; i < this.faces.length; i++) {
          const faceDir = this.faces[i]!.userData.dir as THREE.Vector3
          const basePos = this.faces[i]!.userData.basePos as THREE.Vector3
          this._tmpFaceOffset.copy(faceDir).multiplyScalar(pulse)
          this.faces[i]!.position.copy(basePos).add(this._tmpFaceOffset)
          this.faces[i]!.rotation.z = this.openerProgress * 0.3 * (i % 2 === 0 ? 1 : -1)
          this.edgeLines[i]!.position.copy(this.faces[i]!.position)
          this.edgeLines[i]!.rotation.copy(this.faces[i]!.rotation)
          this.edgeLines[i]!.rotation.z = this.faces[i]!.rotation.z
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // Shader uniforms update — always
    // ════════════════════════════════════════════════════════════════════
    const mat = this.faceMaterials[0] as unknown as { uniforms: Record<string, { value: unknown }> }
    const u = mat.uniforms
    ;(u.uTime!.value as number) = this.time
    // Blend color between sections
    const blendedColor = this._blendFromColor.clone().lerp(this._blendToColor, this._blendT)
    ;(u.uColor!.value as THREE.Color).copy(blendedColor)

    // Apply role/material when role changes
    if (this.targetParams.role !== this._currentRole) {
      this._currentRole = this.targetParams.role
      this.applyRoleAndParams()
    }
  }

  /** Update worldDNA blend state from scroll progress. Called by Experience.update every frame. */
  updateWorldBlend(fromColor: THREE.Color, toColor: THREE.Color, fromEmissive: THREE.Color, toEmissive: THREE.Color, t: number, _fromDisplace: number = 0.05, _toDisplace: number = 0.05): void {
    this._blendFromColor.copy(fromColor)
    this._blendToColor.copy(toColor)
    this._blendFromEmissive.copy(fromEmissive)
    this._blendToEmissive.copy(toEmissive)
    this._blendT = t
  }

  /** Set env map for reflections + camera position for depth-based opacity.
   *  Called by Experience.update each frame. */
  setEnvAndCamera(envMap: THREE.Texture | null, cameraPos: THREE.Vector3): void {
    const mat = this.faceMaterials[0] as unknown as { uniforms: Record<string, { value: unknown }> }
    const u = mat.uniforms
    if (envMap) {
      u.uEnvMap!.value = envMap
      u.uHasEnvMap!.value = true
    } else {
      u.uHasEnvMap!.value = false
    }
    ;(u.uCameraPos!.value as THREE.Vector3).copy(cameraPos)
  }

  private applyRoleAndParams(): void {
    const { color, roughness } = this.targetParams
    // ShaderMaterial — update uniforms directly
    const mat = this.faceMaterials[0] as unknown as { uniforms: Record<string, { value: unknown }> }
    ;(mat.uniforms.uColor!.value as THREE.Color).copy(color)
    // roughness not used in ShaderMaterial (no PBR), but kept for API compat
    void roughness
  }

  dispose(): void {
    for (const face of this.faces) {
      face.geometry.dispose()
    }
    for (const mat of this.faceMaterials) {
      mat.dispose()
    }
    for (const edges of this.edgeLines) {
      edges.geometry.dispose()
      ;(edges.material as THREE.Material).dispose()
    }
    ;(this.geometry as THREE.BufferGeometry).dispose()
    ;(this.material as THREE.Material).dispose()
    this.clear()
  }
}
