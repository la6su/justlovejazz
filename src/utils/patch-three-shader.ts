/* Patch: Three.js r184 resolveIncludes crash (#29379) */
// THREE.ShaderChunk[name] returns undefined for missing chunks → undefined.replace() crash.
// Fix: get / set rorrect defaults.

import * as THREE from 'three'

// Prevent undefined from ShaderChunk access
const origSc = THREE.ShaderChunk as Record<string, string>

const proxiedSc = new Proxy(origSc, {
  get(target: Record<string, string>, prop: string) {
    const val = target[prop as keyof typeof target]
    // Return empty string instead of undefined to avoid .replace() crash
    return typeof val === 'string' ? val : ''
  },
  has(): boolean { return true }
})

// Replace in THREE
Object.defineProperty(THREE, 'ShaderChunk', {
  value: proxiedSc,
  writable: true,
  configurable: true
})
