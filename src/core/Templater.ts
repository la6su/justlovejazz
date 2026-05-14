import { escapeHTML } from './utils'

// LIGHTWEIGHT TEMPLATE ENGINE — mustache-style, no deps, no eval
// Supported tags:
//   {{var}}          — variable substitution
//   {{#if cond}}...{{/if}}   — conditional
//   {{#each item in arr}}...{{/each}}  — array loop

export class Templater {
  static render(template: string, data: Record<string, unknown>): string {
    let out = template

    // 1. Variable interpolation: {{name}}
    for (const [key, val] of Object.entries(data)) {
      const re = new RegExp('{' + '{\s*' + this.escapeKey(key) + '\s*' + '}', 'g')
      out = out.replace(re, typeof val === 'string' ? escapeHTML(val) : String(val ?? ''))
    }

    // 2. Conditionals
    out = this.processIf(out, data)

    // 3. Loops
    out = this.processEach(out, data)

    return out
  }

  private static escapeKey(k: string): string {
    return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private static processIf(html: string, data: Record<string, unknown>): string {
    // Simple if: {{#if cond}}yes{{else}}no{{/if}}
    const re = new RegExp('\{\{#if\s+(' + '[a-zA-Z_$][a-zA-Z0-9_$]*' + ')\}\}([\\s\\S]*?)\{\{/' + 'if\}\}')
    return html.replace(re, (_m, cond, content) => {
      const parts = content.split('{{else}}')
      return data[cond] ? (parts[0] || '') : (parts[1] || '')
    })
  }

  private static processEach(html: string, data: Record<string, unknown>): string {
    const re = new RegExp('\{\{#each\s+([a-z]+)\s+in\s+(' + '[a-zA-Z_$][a-zA-Z0-9_$]*' + ')\}\}([\\s\\S]*?)\{\{/' + 'each\}\}')
    return html.replace(re, (_m, alias, arrName, body) => {
      const arr = data[arrName] as any[]
      if (!Array.isArray(arr)) return ''
      return arr.map(item => {
        let block = body
        for (const [k, v] of Object.entries(item)) {
          const re2 = new RegExp('{' + '{' + alias + '\.' + k + '}', 'g')
          block = block.replace(re2, escapeHTML(String(v ?? '')))
        }
        return block
      }).join('')
    })
  }
}

export function render(template: string, data: Record<string, unknown>): string {
  return Templater.render(template, data)
}
