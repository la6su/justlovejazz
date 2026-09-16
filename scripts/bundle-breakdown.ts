#!/usr/bin/env bun

/** Generate a source-module profile for the shared Three.js chunk. */
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { SourceMapConsumer, type RawSourceMap } from 'source-map-js'
import { sharedThreeAsset } from './build-assets'

const root = resolve(import.meta.dir, '..')
const tempDir = resolve('/tmp', 'jlz-bundle-breakdown-' + process.pid)
const assetsDir = join(tempDir, 'assets')
const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
}).trim()

const generatedAt = new Date().toISOString()
const dirtyFiles = execFileSync('git', ['status', '--porcelain'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean)

rmSync(tempDir, { recursive: true, force: true })
mkdirSync(tempDir, { recursive: true })

try {
  execFileSync('bun', ['x', 'vite', 'build', '--sourcemap', '--outDir', tempDir], {
    cwd: root,
    stdio: 'inherit',
  })
  const jsFile = sharedThreeAsset(readdirSync(assetsDir))
  const mapPath = join(assetsDir, jsFile + '.map')
  if (!existsSync(mapPath)) throw new Error('source map not found: ' + mapPath)
  const sourceMap = JSON.parse(readFileSync(mapPath, 'utf8')) as RawSourceMap
  const sourceBytes = new Map<string, number>()
  const mapped = new SourceMapConsumer(sourceMap)
  {
    const lines = readFileSync(join(assetsDir, jsFile), 'utf8').split('\n')
    const byLine = new Map<number, { column: number; source: string }[]>()
    mapped.eachMapping((item) => {
      if (!item.source) return
      const line = byLine.get(item.generatedLine) || []
      line.push({ column: item.generatedColumn, source: item.source })
      byLine.set(item.generatedLine, line)
    })
    for (const [lineNumber, points] of byLine) {
      points.sort((a, b) => a.column - b.column)
      const line = lines[lineNumber - 1] ?? ''
      const lineLength = line.length
      points.forEach((point, index) => {
        const end = points[index + 1] ? points[index + 1].column : lineLength
        sourceBytes.set(
          point.source,
          (sourceBytes.get(point.source) || 0) + Buffer.byteLength(line.slice(point.column, end)),
        )
      })
    }
  }
  const modules = [...sourceBytes.entries()]
    .map(([source, mappedBytes]) => ({ source, mappedBytes }))
    .sort((a, b) => b.mappedBytes - a.mappedBytes)
  const report = {
    commit,
    generatedAt,
    dirtyFiles,
    command: 'bun scripts/bundle-breakdown.ts',
    note: 'Source-mapped analysis build; production gzip budgets are checked separately.',
    chunk: jsFile,
    rawBytes: statSync(join(assetsDir, jsFile)).size,
    sourceCount: modules.length,
    modules,
  }
  const destinationDir = resolve(root, 'docs/evidence/bundle-breakdown')
  mkdirSync(destinationDir, { recursive: true })
  const destination = join(
    destinationDir,
    `${commit.slice(0, 7)}-${generatedAt.replace(/[:.]/g, '-')}-vendor-three.json`,
  )
  writeFileSync(destination, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' })
  console.log('Wrote ' + destination)
} finally {
  rmSync(tempDir, { recursive: true, force: true })
}
