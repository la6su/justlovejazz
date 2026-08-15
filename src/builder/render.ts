import type { BuilderDocument, BuilderNode } from './schema'

export interface BuilderRenderOptions {
  editable?: boolean
}

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ??
      character,
  )

const safeChoice = (value: string | undefined, choices: readonly string[], fallback: string) =>
  value && choices.includes(value) ? value : fallback

const safeHref = (value: string | undefined): string => {
  const href = value?.trim() ?? '#'
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:'))
    return escapeHtml(href)
  try {
    const url = new URL(href)
    return url.protocol === 'https:' ? escapeHtml(url.toString()) : '#'
  } catch {
    return '#'
  }
}

function editorAttributes(node: BuilderNode, options: BuilderRenderOptions): string {
  return options.editable
    ? ` data-builder-id="${escapeHtml(node.id)}" data-builder-type="${node.type}" tabindex="0"`
    : ''
}

function renderNode(node: BuilderNode, options: BuilderRenderOptions): string {
  const children = node.children.map((child) => renderNode(child, options)).join('')
  const attrs = editorAttributes(node, options)

  switch (node.type) {
    case 'section': {
      const style = safeChoice(
        node.props.style,
        ['default', 'muted', 'primary', 'secondary'],
        'default',
      )
      const size = safeChoice(node.props.size, ['small', 'default', 'large', 'xlarge'], 'default')
      const container = safeChoice(
        node.props.container,
        ['default', 'small', 'large', 'expand'],
        'default',
      )
      const styleClass = style === 'default' ? 'uk-section-default' : `uk-section-${style}`
      const sizeClass = size === 'default' ? '' : ` uk-section-${size}`
      const containerClass = container === 'default' ? '' : ` uk-container-${container}`
      return `<section class="uk-section ${styleClass}${sizeClass} jlz-builder-section"${attrs}><div class="uk-container${containerClass}">${children}</div></section>`
    }
    case 'grid': {
      const columns = safeChoice(node.props.columns, ['1', '2', '3', '4'], '2')
      const gap = safeChoice(node.props.gap, ['small', 'default', 'large', 'collapse'], 'default')
      const gapClass = gap === 'default' ? '' : ` uk-grid-${gap}`
      const items = node.children
        .map((child) => `<div>${renderNode(child, options)}</div>`)
        .join('')
      return `<div class="uk-grid uk-child-width-1-${columns}@m${gapClass} jlz-builder-grid" uk-grid${attrs}>${items}</div>`
    }
    case 'heading': {
      const level = safeChoice(node.props.level, ['h1', 'h2', 'h3', 'h4'], 'h2')
      const size = safeChoice(
        node.props.size,
        ['default', 'small', 'medium', 'large', 'xlarge'],
        'default',
      )
      const sizeClass = size === 'default' ? '' : ` class="uk-heading-${size}"`
      return `<${level}${sizeClass}${attrs}>${escapeHtml(node.props.content ?? '')}</${level}>`
    }
    case 'text': {
      const style = safeChoice(node.props.style, ['default', 'lead', 'meta', 'muted'], 'default')
      const styleClass = style === 'default' ? '' : ` class="uk-text-${style}"`
      return `<p${styleClass}${attrs}>${escapeHtml(node.props.content ?? '')}</p>`
    }
    case 'button': {
      const style = safeChoice(
        node.props.style,
        ['default', 'primary', 'secondary', 'text'],
        'default',
      )
      return `<a class="uk-button uk-button-${style}" href="${safeHref(node.props.href)}"${attrs}>${escapeHtml(node.props.label ?? '')}</a>`
    }
    case 'card': {
      const style = safeChoice(node.props.style, ['default', 'primary', 'secondary'], 'default')
      const size = safeChoice(node.props.size, ['small', 'default', 'large'], 'default')
      const sizeClass = size === 'default' ? '' : ` uk-card-${size}`
      return `<article class="uk-card uk-card-${style} uk-card-body${sizeClass} jlz-builder-card"${attrs}>${children}</article>`
    }
  }
}

export function renderBuilderDocument(
  document: BuilderDocument,
  options: BuilderRenderOptions = {},
): string {
  return document.nodes.map((node) => renderNode(node, options)).join('')
}
