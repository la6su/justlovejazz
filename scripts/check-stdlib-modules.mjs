// Guard for the three-stdlib compatibility seam (src/three-stdlib-compat.ts).
//
// The Cientos bundle statically imports a fixed set of three-stdlib symbols
// through the barrel entry. The app must NOT ship the real barrel (its index
// pulls ~200 modules including classic-WebGL postprocessing passes that do
// not resolve against the WebGPU `three` build), so
// `src/three-stdlib-compat.ts` re-exports exactly the modules the Cientos
// bundle references.
//
// This script computes that import set from the installed
// `node_modules/@tresjs/cientos` bundle and diffs it against the shim's
// exports in both directions:
//
//   - a Cientos upgrade adding imports -> the shim is missing them (the
//     bundler would fail on the barrel alias; this reports WHAT to add);
//   - a Cientos upgrade dropping imports -> the shim carries dead re-exports
//     (dead code the bundler silently tree-shakes; this reports WHAT to drop);
//   - every shim path must exist (a renamed/removed three-stdlib module).
//
// Run: node scripts/check-stdlib-modules.mjs   (wired as `check:stdlib` —
// dependency-upgrade gate, not a unit test: it reads the real node_modules
// bundle rather than a Vitest stub).

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const cientosBundle = join(root, 'node_modules/@tresjs/cientos/dist/trescientos.js')
const shim = join(root, 'src/three-stdlib-compat.ts')

const cientosSource = readFileSync(cientosBundle, 'utf8')
const shimSource = readFileSync(shim, 'utf8')

// Collect every symbol the Cientos bundle imports from the three-stdlib
// barrel (`import { A, B as C } from 'three-stdlib'`), including multiline
// import statements. Deep `three-stdlib/<module>` specifiers count too: the
// module path itself is the requirement.
const needed = new Set()
const importRe = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]three-stdlib(?:\/([^'"]*))?['"]/g
let match
while ((match = importRe.exec(cientosSource)) !== null) {
  for (const raw of match[1].split(',')) {
    const symbol = raw.trim().split(/\s+as\s+/)[0]
    if (symbol) needed.add(symbol)
  }
  if (match[2]) needed.add(`three-stdlib/${match[2]}`)
}

// The shim's contract: `export { SYMBOL } from '<relative path>'`.
const shimEntries = []
const exportRe = /export\s*\{\s*([A-Za-z0-9_$]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g
while ((match = exportRe.exec(shimSource)) !== null) {
  shimEntries.push({ symbol: match[1], from: match[2] })
}

const shimSymbols = new Set(shimEntries.map((entry) => entry.symbol))
const missing = [...needed].filter((symbol) => !shimSymbols.has(symbol)).sort()
const stale = [...shimSymbols].filter((symbol) => !needed.has(symbol)).sort()

const brokenPaths = shimEntries
  .filter((entry) => !existsSync(join(root, 'src', entry.from)))
  .map((entry) => `${entry.symbol} -> ${entry.from} (file not found)`)
  .sort()

if (missing.length === 0 && stale.length === 0 && brokenPaths.length === 0) {
  console.log(
    `three-stdlib shim OK: ${shimSymbols.size} re-exports cover the ${needed.size} symbols the Cientos bundle imports.`,
  )
  process.exit(0)
}

const report = [
  'three-stdlib shim drift against @tresjs/cientos:',
  missing.length > 0 ? `  missing from the shim (add): ${missing.join(', ')}` : null,
  stale.length > 0 ? `  dead in the shim (drop): ${stale.join(', ')}` : null,
  brokenPaths.length > 0 ? `  broken paths:\n    ${brokenPaths.join('\n    ')}` : null,
]
  .filter(Boolean)
  .join('\n')

console.error(report)
console.error('Update src/three-stdlib-compat.ts to match the Cientos bundle.')
process.exit(1)
