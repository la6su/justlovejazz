# ENVIRONMENT — Known Issues & Workarounds

## Chrome WebGPU on Ubuntu/Sway/Wayland + NVIDIA

### Symptom

3D renders at 3-5 FPS in Chrome when accessing `http://localhost:5173/`.
Same code runs at 60 FPS in Firefox, and at 60 FPS in Chrome when accessing
via LAN IP (`http://192.168.x.x:5173/`).

### Root cause

Chrome on Wayland+NVIDIA often cannot activate native Vulkan WebGPU. It
falls back to **ANGLE→OpenGL ES 3.0** WebGPU, which is 5-10× slower.

From `chrome://gpu`:
```
WebGPU: Hardware accelerated (via ANGLE→OpenGL, NOT native Vulkan)
Vulkan: Disabled
Skia Graphite: Disabled
GL implementation: gl=egl-angle, angle=opengl
GL_VERSION: OpenGL ES 3.0 (ANGLE 2.1.27744)
GPU0: NVIDIA RTX 4060 Ti, driver 595.71.05
```

On `localhost`, Chrome selects the slow ANGLE-OpenGL adapter. On remote
origins (LAN IP), Chrome selects a different/faster adapter (exact reason
unclear — likely adapter selection policy differs for trusted vs untrusted
origins).

### Workarounds

**Option 1 — Access via LAN IP (recommended for dev):**
```bash
# On the dev machine:
bun run dev -- --host 0.0.0.0
# Then open http://<your-lan-ip>:5173/ in Chrome
```

**Option 2 — Use Firefox:**
Firefox WebGPU works at full speed on localhost. Enable via `about:config`:
`dom.webgpu.enabled = true` (default on recent Firefox).

**Option 3 — Force Vulkan in Chrome flags:**
- `chrome://flags/#enable-features=Vulkan` → Enabled
- `chrome://flags/#use-vulkan` → Enabled (if present)
- Restart Chrome
- Check `chrome://gpu` — Vulkan should show "Hardware accelerated"

**Option 4 — X11 instead of Wayland:**
Log into an X11 session. Chrome's ANGLE handles NVIDIA better on X11.

### Not a project bug

This is an environment limitation. The project code is correct — it runs
at 60 FPS on:
- Firefox (WebGPU or WebGL2)
- Chrome with native Vulkan WebGPU
- Chrome on X11
- Chrome via LAN IP

The project's WebGPU path uses direct `renderer.render()` (no TSL
post-processing pipeline) specifically to avoid the ANGLE-OpenGL overhead.
See `docs/ARCHITECTURE.md` → "Render path".

## Dev server

```bash
bun run dev -- --host 127.0.0.1    # localhost only
bun run dev -- --host 0.0.0.0       # all interfaces (LAN access)
```

Default port: 5173. HMR configured in `vite.config.ts` with explicit
`server.host` and `hmr.host` to avoid WebSocket mismatch.

## Verification tools

```bash
# Type check
bun run type-check

# Production build
bun run build

# Browser test (requires dev server running)
agent-browser open http://127.0.0.1:5173/
agent-browser console
agent-browser screenshot /tmp/shot.png
z-ai vision -p "Is 3D content visible?" -i /tmp/shot.png
```
