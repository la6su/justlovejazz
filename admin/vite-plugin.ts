import { existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import less from 'less'

import {
  generateBuilderComponentLess,
  generateBuilderThemeLess,
  getBuilderUIKitComponents,
} from '../src/builder/compiler'
import { validateBuilderDocument } from '../src/builder/schema'

const MAX_DOCUMENT_BYTES = 256 * 1024

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  let body = ''
  for await (const chunk of request) {
    body += chunk.toString()
    if (Buffer.byteLength(body) > MAX_DOCUMENT_BYTES) throw new Error('Document exceeds 256 KB')
  }
  return JSON.parse(body) as unknown
}

function writeAtomic(path: string, content: string): void {
  const temporaryPath = `${path}.tmp`
  writeFileSync(temporaryPath, content, 'utf8')
  renameSync(temporaryPath, path)
}

export function jlzAdminPlugin(): Plugin {
  const root = resolve(import.meta.dirname, '..')
  const documentPath = resolve(root, 'src/builder/generated/page.json')
  const themePath = resolve(root, 'src/assets/builder/theme.generated.less')
  const componentsPath = resolve(root, 'src/assets/builder/components.generated.less')
  const mainLessPath = resolve(root, 'src/assets/main.less')

  return {
    name: 'jlz-dev-admin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0]
        if (pathname === '/__jlz-admin/document' && request.method === 'GET') {
          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          response.end(readFileSync(documentPath, 'utf8'))
          return
        }

        if (pathname !== '/__jlz-admin/save') {
          next()
          return
        }
        if (request.method !== 'POST') {
          sendJson(response, 405, { ok: false, error: 'Method not allowed' })
          return
        }
        if (!request.headers['content-type']?.startsWith('application/json')) {
          sendJson(response, 415, { ok: false, error: 'Expected application/json' })
          return
        }

        let snapshots: Array<{ path: string; content: string }> = []
        try {
          const value = await readJsonBody(request)
          const validation = validateBuilderDocument(value)
          if (!validation.ok || !validation.document) {
            sendJson(response, 400, { ok: false, error: validation.errors.join('; ') })
            return
          }

          const documentJson = `${JSON.stringify(validation.document, null, 2)}\n`
          const themeLess = generateBuilderThemeLess(validation.document)
          const componentsLess = generateBuilderComponentLess(validation.document)
          snapshots = [documentPath, themePath, componentsPath].map((path) => ({
            path,
            content: readFileSync(path, 'utf8'),
          }))

          writeAtomic(documentPath, documentJson)
          writeAtomic(themePath, themeLess)
          writeAtomic(componentsPath, componentsLess)

          const mainLess = readFileSync(mainLessPath, 'utf8')
          const compilation = await less.render(mainLess, {
            filename: mainLessPath,
            javascriptEnabled: true,
            rewriteUrls: 'all',
          })
          server.moduleGraph.invalidateAll()
          sendJson(response, 200, {
            ok: true,
            cssBytes: Buffer.byteLength(compilation.css),
            components: getBuilderUIKitComponents(validation.document),
          })
        } catch (error) {
          for (const snapshot of snapshots) writeAtomic(snapshot.path, snapshot.content)
          const temporaryPaths = [documentPath, themePath, componentsPath].map(
            (path) => `${path}.tmp`,
          )
          for (const path of temporaryPaths) if (existsSync(path)) unlinkSync(path)
          sendJson(response, 500, {
            ok: false,
            error: error instanceof Error ? error.message : 'Builder save failed',
          })
        }
      })
    },
  }
}
