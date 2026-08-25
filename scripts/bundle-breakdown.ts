#!/usr/bin/env bun

/** Generate a source-module profile for the shared Three.js chunk. */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { SourceMapConsumer } from 'source-map'

const root = resolve(import.meta.dir, '..')
const tempDir = resolve('/tmp', 'jlz-bundle-breakdown-' + process.pid)
const assetsDir = join(tempDir, 'assets')
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

rmSync(tempDir, { recursive: true, force: true })
mkdirSync(tempDir, { recursive: true })

try {
  execFileSync('bun', ['x', 'vite', 'build', '--sourcemap', '--outDir', tempDir], {
    cwd: root,
    stdio: 'inherit',
  })
  const jsFile = readdirSync(assetsDir).find((name) => /^vendor-three-.*\.js$/.test(name))
  if (!jsFile) throw new Error('vendor-three chunk not found in ' + assetsDir)
  const mapPath = join(assetsDir, jsFile + '.map')
  if (!existsSync(mapPath)) throw new Error('source map not found: ' + mapPath)
  const sourceMap = JSON.parse(readFileSync(mapPath, 'utf8')) as { sources: string[] }
  const sourceBytes = new Map<string, number>()
  const mapped = await new SourceMapConsumer(sourceMap as any)
  try {
    const lineLengths = readFileSync(join(assetsDir, jsFile), 'utf8').split('\n').map((line) => line.length)
    const byLine = new Map<number, { column: number; source: string }[]>()
    mapped.eachMapping((item) => {
      if (!item.source) return
      const line = byLine.get(item.generatedLine) || []
      line.push({ column: item.generatedColumn, source: item.source })
      byLine.set(item.generatedLine, line)
    })
    for (const [lineNumber, points] of byLine) {
      points.sort((a, b) => a.column - b.column)
      const lineLength = lineLengths[lineNumber - 1] || 0
      points.forEach((point, index) => {
        const end = points[index + 1] ? points[index + 1].column : lineLength
        sourceBytes.set(point.source, (sourceBytes.get(point.source) || 0) + Math.max(0, end - point.column))
      })
    }
  } finally {
    if (typeof (mapped as any).destroy === 'function') (mapped as any).destroy()
  }
  const modules = [...sourceBytes.entries()]
    .map(([source, mappedBytes]) => ({ source, mappedBytes }))
    .sort((a, b) => b.mappedBytes - a.mappedBytes)
  const report = {
    commit,
    generatedAt: new Date().toISOString(),
    chunk: jsFile,
    rawBytes: statSync(join(assetsDir, jsFile)).size,
    sourceCount: modules.length,
    modules,
  }
  const destinationDir = resolve(root, 'docs/evidence/bundle-breakdown')
  mkdirSync(destinationDir, { recursive: true })
  const destination = join(destinationDir, commit + '-vendor-three.json')
  await Bun.write(destination, JSON.stringify(report, null, 2) + '\n')
  console.log('Wrote ' + destination)
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
