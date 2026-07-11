# SANDBOX — Dev-server & browser verify in the GLM sandbox

> Operational runbook for running `vite dev` + Agent Browser verification
> inside the GLM-5.2 cloud sandbox. Every rule below was paid for in failed
> verify loops ("vite died between commands", "browser can't reach localhost",
> "Enter button never activated"). This is **environment** knowledge, not code
> rules — code rules live in [RULES.md](RULES.md).

## TL;DR — the one command that works

Run dev-server + browser verify in a **single Bash tool call** with a large
timeout. Background processes do NOT survive between Bash calls in this sandbox.

```bash
cd /home/z/justlovejazz
pkill -f "vite" 2>/dev/null; sleep 1          # 1. clean slate
nohup ./node_modules/.bin/vite --host > /tmp/jlz-dev.log 2>&1 &  # 2. start
VPID=$!
for i in $(seq 1 10); do curl -s -o /dev/null http://127.0.0.1:5173/ 2>/dev/null && break; sleep 1; done  # 3. wait ready
agent-browser open http://21.0.4.229:5173/   # 4. LAN IP, NOT localhost
agent-browser wait 15000                     # 5. wait for 3D lazy load
agent-browser eval "(()=>{...})()"           # 6. verify state via eval
agent-browser close
kill $VPID 2>/dev/null
```

All of steps 1-6 MUST be in one Bash call. Splitting them across calls = vite
dies, browser loses connection, verify fails.

## The 5 gotchas (all observed, all fixed)

### 1. Background processes die between Bash calls

`nohup cmd &`, `setsid`, `disown` — none of them keep vite alive across
separate Bash tool invocations. The process is killed when the Bash session
that spawned it ends.

**Fix:** do start + verify + cleanup in ONE Bash call. If you need a long
verify, set the Bash `timeout` high (up to 600000ms) and keep everything in
one script.

### 2. Browser cannot reach localhost / 127.0.0.1

`agent-browser open http://localhost:5173/` and `http://127.0.0.1:5173/` both
fail with `ERR_CONNECTION_REFUSED`. The headless Chrome runs in a separate
network namespace from the shell.

**Fix:** use the LAN IP. Discover it with `hostname -I` or `ip addr show eth0`
— in this sandbox it's `21.0.4.229`. So:
```bash
agent-browser open http://21.0.4.229:5173/
```
`curl` from the shell CAN reach 127.0.0.1 — only the browser can't.

### 3. `allowedHosts` blocks JS modules when accessed via IP

`vite.config.ts` ships with `server.allowedHosts: ['project.6la.ru']` (RULES
§42-43 — needed for the Caddy reverse proxy in production). When the browser
hits vite via the LAN IP, vite rejects the dynamic `import()` of `entry-app.ts`
with "Failed to fetch dynamically imported module". The HTML (inline splash)
loads fine, but the app never boots.

**Fix:** temporarily flip to `allowedHosts: true` for the verify, then revert:
```bash
sed -i "s/allowedHosts: \['project.6la.ru'\]/allowedHosts: true/" vite.config.ts
# ... verify ...
sed -i "s/allowedHosts: true/allowedHosts: ['project.6la.ru']/" vite.config.ts
```
**Always verify `git status` is clean after** — this file must never be
committed with `allowedHosts: true`.

### 4. Headless WebGL2 throttles `setTimeout` → `jlz:webgl-ready` stalls

`main-app.ts` emits `jlz:webgl-ready` via `setTimeout(..., readyAt)` after
`Experience.init()` resolves. In headless Chrome over LAN IP (no WebGPU, WebGL2
fallback, no real GPU), `setTimeout` + the 600ms intro delay can stretch past
20-30s. The Enter button stays in its disabled state (`!is-ready`) for the
entire verify window.

This is NOT a regression — it's headless timing. STATUS.md confirms the Enter
contract works in real browsers (Lighthouse Perf 100). Do NOT "fix" the init
flow based on headless Enter behavior.

**Fix:** verify 3D state directly via `agent-browser eval`, don't wait for
Enter:
```js
// This proves init succeeded — no need to click Enter:
window.experience && window.experience.world.sceneGroups.length === 6
// And all 3D objects are instantiated:
sg[0].userData.orb && sg[2].userData.typography && sg[3].userData.gallery
  && sg[4].userData.typography && sg[5].userData.timeline
```
If you DO need to test post-Enter behavior, force-click via eval:
`document.getElementById('jlz-splash-enter').click()` (works regardless of
`.is-ready` because the inline onclick guard is a separate layer).

### 5. Screenshots time out on the 3D canvas

`agent-browser screenshot` against a page with an active WebGL canvas often
hits `CDP command timed out: Page.captureScreenshot`. The canvas compositing
path is slow under headless.

**Fix:** skip screenshots for 3D pages. Use `agent-browser eval` to read DOM
+ `window.experience` state instead. Screenshots are fine for static pages
(blog, splash pre-3D).

## Pre-flight checklist (run once at session start)

```bash
cd /home/z/justlovejazz
# 1. deps installed?
[ -d node_modules ] || bun install
# 2. port free?
ss -tlnp 2>/dev/null | grep -q 5173 && pkill -f vite || true
# 3. LAN IP known?
LAN_IP=$(hostname -I | awk '{print $1}')
echo "Use: http://$LAN_IP:5173/"
```

## Verify recipe (copy-paste, adapt the eval)

```bash
cd /home/z/justlovejazz
pkill -f "vite" 2>/dev/null; sleep 1
nohup ./node_modules/.bin/vite --host > /tmp/jlz-dev.log 2>&1 &
VPID=$!
for i in $(seq 1 10); do curl -s -o /dev/null http://127.0.0.1:5173/ 2>/dev/null && break; sleep 1; done

# Temporarily allow LAN IP host
sed -i "s/allowedHosts: \['project.6la.ru'\]/allowedHosts: true/" vite.config.ts

LAN_IP=$(hostname -I | awk '{print $1}')
agent-browser open "http://$LAN_IP:5173/" 2>&1 | tail -1
agent-browser wait 15000 2>&1 | tail -1

# Verify 3D init (NOT Enter — see gotcha #4)
agent-browser eval "(()=>{const w=window.experience?.world;const sg=w?.sceneGroups||[];return JSON.stringify({sg:sg.length,orb0:!!sg[0]?.userData?.orb,typo2:!!sg[2]?.userData?.typography,gallery3:!!sg[3]?.userData?.gallery,typo4:!!sg[4]?.userData?.typography,timeline5:!!sg[5]?.userData?.timeline,exp:!!window.experience});})()" 2>&1 | tail -1

# Console errors (should be empty / only WebGPU warning)
agent-browser errors 2>&1 | tail -5

agent-browser close 2>&1 | tail -1
kill $VPID 2>/dev/null

# REVERT allowedHosts — NEVER commit this change
sed -i "s/allowedHosts: true/allowedHosts: ['project.6la.ru']/" vite.config.ts
git status --short  # must be clean
```

## What NOT to do

- ❌ Start vite in one Bash call, run `agent-browser` in the next → vite is dead.
- ❌ Use `http://localhost:5173/` in the browser → `ERR_CONNECTION_REFUSED`.
- ❌ Commit `vite.config.ts` with `allowedHosts: true` → breaks production proxy.
- ❌ Treat headless `enterReady: false` as a bug → it's headless `setTimeout` timing.
- ❌ Use `agent-browser screenshot` on the 3D canvas page → CDP timeout.
- ❌ Use `bun run dev` (the npm script adds `--host` but spawns via a wrapper
  that dies faster) — call `./node_modules/.bin/vite --host` directly.
