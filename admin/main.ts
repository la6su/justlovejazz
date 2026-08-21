import UIkit from 'uikit'
import adminCss from './admin.less?inline'

import {
  BUILDER_CATALOG,
  BUILDER_ELEMENT_TYPES,
  type BuilderElementDefinition,
} from '../src/builder/catalog'
import { DEFAULT_BUILDER_DOCUMENT } from '../src/builder/default-document'
import { renderBuilderDocument } from '../src/builder/render'
import {
  DEFAULT_BUILDER_THEME,
  STYLE_GROUPS,
  STYLE_GROUP_BY_ID,
  type BuilderThemeKey,
  type StyleFieldDefinition,
  type StyleGroupId,
} from '../src/builder/style'
import { renderStyleShowcase } from '../src/builder/style-showcase'
import { themeToCssVars } from '../src/builder/themeVariables'
import {
  validateBuilderDocument,
  type BuilderDocument,
  type BuilderElementType,
  type BuilderNode,
  type BuilderTheme,
} from '../src/builder/schema'
import { BuilderStore } from '../src/builder/store'

type EditorMode = 'builder' | 'style'
type Viewport = 'desktop' | 'tablet' | 'mobile'

const adminStyle = document.createElement('style')
adminStyle.dataset.jlzAdmin = 'true'
adminStyle.textContent = adminCss
document.head.append(adminStyle)

const requiredElement = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id)
  if (!element) throw new Error(`Missing admin element #${id}`)
  return element as T
}

const catalogElement = requiredElement<HTMLDivElement>('element-catalog')
const outlineElement = requiredElement<HTMLOListElement>('document-outline')
const previewElement = requiredElement<HTMLDivElement>('builder-preview')
const previewFrame = requiredElement<HTMLDivElement>('preview-frame')
const previewLabel = requiredElement<HTMLSpanElement>('preview-label')
const inspectorTitle = requiredElement<HTMLHeadingElement>('inspector-title')
const inspectorFields = requiredElement<HTMLDivElement>('inspector-fields')
const nodeActions = requiredElement<HTMLDivElement>('node-actions')
const builderPanel = requiredElement<HTMLDivElement>('builder-panel')
const stylePanel = requiredElement<HTMLDivElement>('style-panel')
const styleNavigation = requiredElement<HTMLElement>('style-navigation')
const previewAllComponents = requiredElement<HTMLInputElement>('preview-all-components')
const styleToneControls = requiredElement<HTMLDivElement>('style-tone-controls')
const titleInput = requiredElement<HTMLInputElement>('document-title')
const saveButton = requiredElement<HTMLButtonElement>('save')
const saveStatus = requiredElement<HTMLOutputElement>('save-status')
const undoButton = requiredElement<HTMLButtonElement>('undo')
const redoButton = requiredElement<HTMLButtonElement>('redo')

// The builder state (document, selection, history, saved baseline) is the
// typed BuilderStore — a single framework-neutral source of truth. The
// editor below only renders it and dispatches actions; the atomic
// commit/snapshot/restore logic lives in the store.
const store = new BuilderStore(DEFAULT_BUILDER_DOCUMENT)

// Editor-only UI state (not part of the builder document): the active mode,
// the selected style group and the style-preview toggles.
let mode: EditorMode = 'builder'
let selectedStyleGroup: StyleGroupId = 'global'
let showAllStyleComponents = true
let inverseStylePreview = false
// True while a save request is in flight; the button is locked and the
// "Saving…" label shows until the response settles.
let saving = false

function makeId(type: BuilderElementType): string {
  const suffix = crypto.randomUUID?.().slice(0, 8) ?? Date.now().toString(36)
  return `${type}-${suffix.toLowerCase()}`
}

function setStatus(message: string, error = false): void {
  saveStatus.textContent = message
  saveStatus.dataset.state = error ? 'error' : 'note'
  saveStatus.classList.toggle('is-error', error)
}

function updateDirtyStatus(announce = true): void {
  const dirty = store.isDirty()
  if (announce && dirty) setStatus('Unsaved changes')
  else if (announce && saveStatus.textContent === 'Unsaved changes') setStatus('Ready')
  // The dirty/ready dot must not overwrite an error state.
  if (!saveStatus.classList.contains('is-error')) {
    saveStatus.dataset.state = dirty ? 'dirty' : 'ready'
  }
  saveButton.disabled = saving || !dirty
  undoButton.disabled = !store.canUndo
  redoButton.disabled = !store.canRedo
}

function commit(change: (draft: BuilderDocument) => void): void {
  const result = store.commit(change)
  if (!result.ok) {
    setStatus(result.error ?? 'Invalid document change', true)
    return
  }
  renderEditor()
}

function recordCurrentSnapshot(rerender = true): void {
  const result = store.recordSnapshot()
  if (!result.ok) {
    setStatus(result.error ?? 'Invalid document change', true)
    return
  }
  if (rerender) renderEditor()
  else updateDirtyStatus()
}

function restoreHistory(nextIndex: number): void {
  store.restore(nextIndex)
  renderEditor()
}

function renderCatalog(): void {
  catalogElement.replaceChildren()
  for (const type of BUILDER_ELEMENT_TYPES) {
    const definition = BUILDER_CATALOG[type]
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.addElement = type
    button.title = definition.description
    const icon = document.createElement('span')
    icon.className = 'jlz-admin-element-icon'
    icon.setAttribute('aria-hidden', 'true')
    icon.textContent = definition.icon
    const label = document.createElement('span')
    label.textContent = definition.label
    button.append(icon, label)
    catalogElement.append(button)
  }
}

function renderOutline(): void {
  outlineElement.replaceChildren()

  const appendNodes = (nodes: BuilderNode[], depth: number): void => {
    for (const node of nodes) {
      const item = document.createElement('li')
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.selectNode = node.id
      // The CSS owns the indentation (padding + guide line); the editor only
      // reports the depth as a unitless custom property.
      button.style.setProperty('--depth', String(depth))
      button.classList.toggle('is-selected', node.id === store.selectedId)
      button.title = BUILDER_CATALOG[node.type].description

      const icon = document.createElement('span')
      icon.className = 'jlz-admin-outline-icon'
      icon.setAttribute('aria-hidden', 'true')
      icon.textContent = BUILDER_CATALOG[node.type].icon
      const type = document.createElement('span')
      type.className = 'jlz-admin-outline-type'
      type.textContent = node.type
      const name = document.createElement('span')
      name.textContent =
        node.props.content?.slice(0, 32) ||
        node.props.label?.slice(0, 32) ||
        BUILDER_CATALOG[node.type].label
      button.append(icon, type, name)
      item.append(button)
      outlineElement.append(item)
      // Keep the current selection visible without fighting the reader.
      if (node.id === store.selectedId) item.scrollIntoView({ block: 'nearest' })
      appendNodes(node.children, depth + 1)
    }
  }

  appendNodes(store.document.nodes, 0)
}

function applyPreviewTheme(theme: BuilderTheme): void {
  // The complete `--builder-*` variable map is owned by the pure
  // themeVariables contract (single source, locked by tests); the editor
  // only assigns the result onto the preview element.
  for (const [name, value] of Object.entries(themeToCssVars(theme))) {
    previewElement.style.setProperty(name, value)
  }
  previewElement.classList.toggle('is-inverse-preview', mode === 'style' && inverseStylePreview)
}

function renderPreview(): void {
  previewElement.innerHTML =
    mode === 'builder'
      ? renderBuilderDocument(store.document, { editable: true })
      : renderStyleShowcase(selectedStyleGroup, showAllStyleComponents)
  applyPreviewTheme(store.document.theme)
  if (mode === 'builder' && store.selectedId) {
    previewElement
      .querySelector<HTMLElement>(`[data-builder-id="${CSS.escape(store.selectedId)}"]`)
      ?.classList.add('is-selected')
  }
  ;(UIkit as unknown as { update(element: Element): void }).update(previewElement)
}

function createField(
  definition: BuilderElementDefinition,
  node: BuilderNode,
  key: string,
): HTMLLabelElement | null {
  const field = definition.fields.find((candidate) => candidate.key === key)
  if (!field) return null
  const label = document.createElement('label')
  label.className = 'jlz-admin-field'
  const title = document.createElement('span')
  title.textContent = field.label
  let control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement

  if (field.type === 'textarea') {
    control = document.createElement('textarea')
    control.className = 'uk-textarea'
  } else if (field.type === 'select') {
    const select = document.createElement('select')
    select.className = 'uk-select'
    for (const option of field.options ?? []) {
      const element = document.createElement('option')
      element.value = option.value
      element.textContent = option.label
      select.append(element)
    }
    control = select
  } else {
    const input = document.createElement('input')
    input.className = 'uk-input'
    input.type = field.type === 'url' ? 'url' : 'text'
    control = input
  }

  control.name = field.key
  control.value = node.props[field.key] ?? ''
  control.dataset.nodeProp = field.key
  label.append(title, control)
  return label
}

function renderInspector(): void {
  if (mode === 'style') {
    renderStyleInspector()
    return
  }

  const location = store.selectedId ? store.findNode(store.selectedId) : null
  inspectorFields.replaceChildren()
  nodeActions.hidden = !location

  if (!location) {
    inspectorTitle.textContent = 'No selection'
    const help = document.createElement('p')
    help.className = 'jlz-admin-help'
    help.textContent = 'Select an element in the outline or preview to edit it.'
    inspectorFields.append(help)
    return
  }

  const definition = BUILDER_CATALOG[location.node.type]
  inspectorTitle.textContent = definition.label
  for (const field of definition.fields) {
    const label = createField(definition, location.node, field.key)
    if (label) inspectorFields.append(label)
  }
}

function createStyleField(definition: StyleFieldDefinition): HTMLLabelElement {
  const label = document.createElement('label')
  label.className = `jlz-admin-field${definition.type === 'color' ? ' jlz-admin-field-color' : ''}`
  const title = document.createElement('span')
  title.textContent = definition.label
  const description = document.createElement('small')
  description.textContent = definition.description

  if (definition.type === 'color') {
    const text = document.createElement('input')
    text.type = 'text'
    text.className = 'uk-input'
    text.pattern = '#[0-9a-fA-F]{6}'
    text.value = store.document.theme[definition.key]
    text.dataset.themeProp = definition.key
    const color = document.createElement('input')
    color.type = 'color'
    color.value = store.document.theme[definition.key]
    color.dataset.themeProp = definition.key
    label.append(title, description, text, color)
    return label
  }

  const select = document.createElement('select')
  select.className = 'uk-select'
  for (const value of definition.options ?? []) {
    const option = document.createElement('option')
    option.value = value.value
    option.textContent = value.label
    select.append(option)
  }
  select.value = store.document.theme[definition.key]
  select.dataset.themeProp = definition.key
  label.append(title, description, select)
  return label
}

function renderStyleInspector(): void {
  const group = STYLE_GROUP_BY_ID[selectedStyleGroup]
  inspectorTitle.textContent = group.label
  nodeActions.hidden = true
  inspectorFields.replaceChildren()

  const description = document.createElement('p')
  description.className = 'jlz-admin-inspector-description'
  description.textContent = group.description
  inspectorFields.append(description)
  group.fields.forEach((field) => inspectorFields.append(createStyleField(field)))
}

function renderStyleNavigation(): void {
  styleNavigation.replaceChildren()
  for (const category of ['general', 'component'] as const) {
    const heading = document.createElement('span')
    heading.className = 'jlz-admin-style-category'
    heading.textContent = category === 'general' ? 'General' : 'Components'
    styleNavigation.append(heading)
    for (const group of STYLE_GROUPS.filter((candidate) => candidate.category === category)) {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.styleGroup = group.id
      button.classList.toggle('is-selected', selectedStyleGroup === group.id)
      button.textContent = group.label
      styleNavigation.append(button)
    }
  }
}

function renderEditor(): void {
  titleInput.value = store.document.title
  renderOutline()
  renderPreview()
  renderInspector()
  renderStyleNavigation()
  styleToneControls.hidden = mode !== 'style'
  updateDirtyStatus()
}

function selectNode(id: string | null): void {
  store.selectedId = id
  renderOutline()
  renderPreview()
  renderInspector()
  if (id) scrollPreviewNodeIntoView(id)
}

// Bring the just-selected element into view inside the preview frame;
// reduced-motion readers get an instant jump instead of a smooth scroll.
function scrollPreviewNodeIntoView(id: string): void {
  if (mode !== 'builder') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const element = previewElement.querySelector<HTMLElement>(`[data-builder-id="${CSS.escape(id)}"]`)
  element?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
}

function addElement(type: BuilderElementType): void {
  const node = BUILDER_CATALOG[type].create(makeId(type))
  commit((draft) => {
    if (type === 'section') {
      draft.nodes.push(node)
      store.selectedId = node.id
      return
    }

    const selected = store.selectedId
      ? BuilderStore.findLocationInDocument(draft, store.selectedId)
      : null
    if (selected && BUILDER_CATALOG[selected.node.type].container) {
      selected.node.children.push(node)
    } else if (selected?.parent) {
      selected.parent.children.push(node)
    } else {
      draft.nodes.at(-1)?.children.push(node)
    }
    store.selectedId = node.id
  })
}

function moveSelected(offset: -1 | 1): void {
  if (!store.selectedId) return
  commit((draft) => {
    const location = BuilderStore.findLocationInDocument(draft, store.selectedId as string)
    if (!location) return
    const target = location.index + offset
    if (target < 0 || target >= location.siblings.length) return
    const [node] = location.siblings.splice(location.index, 1)
    if (node) location.siblings.splice(target, 0, node)
  })
}

function duplicateSelected(): void {
  if (!store.selectedId) return
  commit((draft) => {
    const location = BuilderStore.findLocationInDocument(draft, store.selectedId as string)
    if (!location) return
    const cloneNode = (node: BuilderNode): BuilderNode => ({
      ...structuredClone(node),
      id: makeId(node.type),
      children: node.children.map(cloneNode),
    })
    const duplicate = cloneNode(location.node)
    location.siblings.splice(location.index + 1, 0, duplicate)
    store.selectedId = duplicate.id
  })
}

function removeSelected(): void {
  if (!store.selectedId) return
  commit((draft) => {
    const location = BuilderStore.findLocationInDocument(draft, store.selectedId as string)
    if (!location || (location.parent === null && location.siblings.length === 1)) return
    location.siblings.splice(location.index, 1)
    store.selectedId = location.parent?.id ?? location.siblings[location.index - 1]?.id ?? null
  })
}

// Undo-able: the reset is a plain document commit, so history keeps it.
function resetTheme(): void {
  commit((draft) => {
    draft.theme = structuredClone(DEFAULT_BUILDER_THEME)
  })
}

async function saveDocument(): Promise<void> {
  if (saving) return
  saving = true
  saveButton.disabled = true
  saveButton.textContent = 'Saving…'
  setStatus('Compiling theme…')
  try {
    const response = await fetch('/__jlz-admin/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store.document),
    })
    const result = (await response.json()) as {
      ok: boolean
      error?: string
      cssBytes?: number
      components?: string[]
    }
    if (!response.ok || !result.ok) throw new Error(result.error ?? 'Save failed')
    store.markSaved()
    setStatus(
      `Saved · ${result.cssBytes?.toLocaleString() ?? 0} CSS bytes · ${result.components?.length ?? 0} components`,
    )
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Save failed', true)
  } finally {
    saving = false
    saveButton.textContent = 'Save & compile'
    updateDirtyStatus(false)
  }
}

async function loadDocument(): Promise<void> {
  try {
    const response = await fetch('/__jlz-admin/document')
    if (!response.ok) throw new Error('Saved document is unavailable')
    const candidate: unknown = await response.json()
    const validation = validateBuilderDocument(candidate)
    if (!validation.ok || !validation.document)
      throw new Error(validation.errors[0] ?? 'Saved document is invalid')
    store.load(validation.document)
    setStatus('Ready')
  } catch (error) {
    store.load(DEFAULT_BUILDER_DOCUMENT)
    setStatus(error instanceof Error ? `${error.message}; using defaults` : 'Using defaults', true)
  }
  renderEditor()
}

catalogElement.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-add-element]')
  const type = button?.dataset.addElement as BuilderElementType | undefined
  if (type && BUILDER_CATALOG[type]) addElement(type)
})

outlineElement.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-select-node]')
  if (button?.dataset.selectNode) selectNode(button.dataset.selectNode)
})

previewElement.addEventListener('click', (event) => {
  event.preventDefault()
  const element = (event.target as HTMLElement).closest<HTMLElement>('[data-builder-id]')
  if (element?.dataset.builderId) selectNode(element.dataset.builderId)
})

previewElement.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return
  const element = (event.target as HTMLElement).closest<HTMLElement>('[data-builder-id]')
  if (!element?.dataset.builderId) return
  event.preventDefault()
  selectNode(element.dataset.builderId)
})

inspectorFields.addEventListener('input', (event) => {
  const control = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  const themeKey = control.dataset.themeProp as BuilderThemeKey | undefined
  if (themeKey) {
    store.document.theme[themeKey] = control.value
    inspectorFields
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>(`[data-theme-prop="${themeKey}"]`)
      .forEach((peer) => {
        if (peer !== control && (control.type === 'color' || /^#[0-9a-f]{6}$/i.test(control.value)))
          peer.value = control.value
      })
    applyPreviewTheme(store.document.theme)
    recordCurrentSnapshot(false)
    return
  }
  if (!store.selectedId || !control.dataset.nodeProp) return
  const location = store.findNode(store.selectedId)
  if (!location) return
  location.node.props[control.dataset.nodeProp] = control.value
  renderOutline()
  renderPreview()
  recordCurrentSnapshot(false)
})

titleInput.addEventListener('input', () => {
  store.document.title = titleInput.value.trim() || 'Untitled page'
  recordCurrentSnapshot(false)
})

inspectorFields.addEventListener('focusout', () => recordCurrentSnapshot())
titleInput.addEventListener('focusout', () => recordCurrentSnapshot())

styleNavigation.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-style-group]')
  if (!button?.dataset.styleGroup) return
  selectedStyleGroup = button.dataset.styleGroup as StyleGroupId
  renderStyleNavigation()
  renderInspector()
  renderPreview()
  if (showAllStyleComponents) {
    previewElement
      .querySelector<HTMLElement>(`[data-style-sample="${selectedStyleGroup}"]`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
})

previewAllComponents.addEventListener('change', () => {
  showAllStyleComponents = previewAllComponents.checked
  renderPreview()
})

document.querySelectorAll<HTMLButtonElement>('[data-style-tone]').forEach((button) => {
  button.addEventListener('click', () => {
    inverseStylePreview = button.dataset.styleTone === 'inverse'
    document
      .querySelectorAll<HTMLButtonElement>('[data-style-tone]')
      .forEach((candidate) => candidate.classList.toggle('is-active', candidate === button))
    applyPreviewTheme(store.document.theme)
  })
})

document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    mode = button.dataset.mode as EditorMode
    document
      .querySelectorAll<HTMLButtonElement>('[data-mode]')
      .forEach((candidate) => candidate.classList.toggle('is-active', candidate === button))
    builderPanel.hidden = mode !== 'builder'
    stylePanel.hidden = mode !== 'style'
    renderEditor()
  })
})

document.querySelectorAll<HTMLButtonElement>('[data-viewport]').forEach((button) => {
  button.addEventListener('click', () => {
    const viewport = button.dataset.viewport as Viewport
    previewFrame.dataset.viewport = viewport
    previewLabel.textContent = `Live preview · ${viewport}`
    document
      .querySelectorAll<HTMLButtonElement>('[data-viewport]')
      .forEach((candidate) => candidate.classList.toggle('is-active', candidate === button))
  })
})

undoButton.addEventListener('click', () => restoreHistory(store.historyIndex - 1))
redoButton.addEventListener('click', () => restoreHistory(store.historyIndex + 1))
requiredElement<HTMLButtonElement>('move-up').addEventListener('click', () => moveSelected(-1))
requiredElement<HTMLButtonElement>('move-down').addEventListener('click', () => moveSelected(1))
requiredElement<HTMLButtonElement>('duplicate').addEventListener('click', duplicateSelected)
requiredElement<HTMLButtonElement>('remove').addEventListener('click', removeSelected)
requiredElement<HTMLButtonElement>('theme-reset').addEventListener('click', resetTheme)
saveButton.addEventListener('click', () => void saveDocument())

window.addEventListener('beforeunload', (event) => {
  if (!store.isDirty()) return
  event.preventDefault()
})

// Editor keyboard shortcuts. They stay out of the way while the caret is in a
// form control, so text fields keep their native behavior (incl. native
// undo/redo); Ctrl+S is the only shortcut that also fires there.
const isFormControl = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null
  if (!element) return false
  const tag = element.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase()
  const mod = event.ctrlKey || event.metaKey
  if (mod) {
    if (key === 's') {
      event.preventDefault()
      void saveDocument()
      return
    }
    if (key === 'z' && !event.shiftKey) {
      if (!isFormControl(event.target)) {
        event.preventDefault()
        if (store.canUndo) restoreHistory(store.historyIndex - 1)
      }
      return
    }
    if (key === 'z' || key === 'y') {
      if (!isFormControl(event.target)) {
        event.preventDefault()
        if (store.canRedo) restoreHistory(store.historyIndex + 1)
      }
    }
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (isFormControl(event.target) || mode !== 'builder' || !store.selectedId) return
    event.preventDefault()
    removeSelected()
  }
})

renderCatalog()
void loadDocument()
