import type { BuilderElementType, BuilderNode } from './schema'

export type BuilderFieldType = 'text' | 'textarea' | 'select' | 'url'

export interface BuilderField {
  key: string
  label: string
  type: BuilderFieldType
  options?: ReadonlyArray<{ label: string; value: string }>
}

export interface BuilderElementDefinition {
  type: BuilderElementType
  label: string
  description: string
  container: boolean
  icon: string
  uikitComponents: readonly string[]
  fields: readonly BuilderField[]
  create(id: string): BuilderNode
}

const makeNode = (
  id: string,
  type: BuilderElementType,
  props: Record<string, string>,
): BuilderNode => ({ id, type, props, children: [] })

export const BUILDER_CATALOG: Record<BuilderElementType, BuilderElementDefinition> = {
  section: {
    type: 'section',
    label: 'Section',
    description: 'Full-width page region with a UIkit container.',
    container: true,
    icon: '§',
    uikitComponents: ['section', 'container'],
    fields: [
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Muted', value: 'muted' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
        ],
      },
      {
        key: 'size',
        label: 'Vertical spacing',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Default', value: 'default' },
          { label: 'Large', value: 'large' },
          { label: 'X-Large', value: 'xlarge' },
        ],
      },
      {
        key: 'container',
        label: 'Container',
        type: 'select',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Small', value: 'small' },
          { label: 'Large', value: 'large' },
          { label: 'Expand', value: 'expand' },
        ],
      },
    ],
    create: (id) =>
      makeNode(id, 'section', { style: 'default', size: 'default', container: 'default' }),
  },
  grid: {
    type: 'grid',
    label: 'Grid',
    description: 'Responsive UIkit grid for child elements.',
    container: true,
    icon: '⊞',
    uikitComponents: ['grid', 'width'],
    fields: [
      {
        key: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { label: '1', value: '1' },
          { label: '2', value: '2' },
          { label: '3', value: '3' },
          { label: '4', value: '4' },
        ],
      },
      {
        key: 'gap',
        label: 'Gap',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Default', value: 'default' },
          { label: 'Large', value: 'large' },
          { label: 'Collapse', value: 'collapse' },
        ],
      },
    ],
    create: (id) => makeNode(id, 'grid', { columns: '2', gap: 'default' }),
  },
  heading: {
    type: 'heading',
    label: 'Heading',
    description: 'Semantic heading with UIkit display sizing.',
    container: false,
    icon: 'H',
    uikitComponents: ['heading'],
    fields: [
      { key: 'content', label: 'Text', type: 'text' },
      {
        key: 'level',
        label: 'HTML level',
        type: 'select',
        options: ['h1', 'h2', 'h3', 'h4'].map((value) => ({ label: value.toUpperCase(), value })),
      },
      {
        key: 'size',
        label: 'Visual size',
        type: 'select',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' },
          { label: 'X-Large', value: 'xlarge' },
        ],
      },
    ],
    create: (id) =>
      makeNode(id, 'heading', { content: 'New heading', level: 'h2', size: 'medium' }),
  },
  text: {
    type: 'text',
    label: 'Text',
    description: 'Plain semantic copy. HTML is intentionally not accepted.',
    container: false,
    icon: '¶',
    uikitComponents: ['text'],
    fields: [
      { key: 'content', label: 'Text', type: 'textarea' },
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Lead', value: 'lead' },
          { label: 'Meta', value: 'meta' },
          { label: 'Muted', value: 'muted' },
        ],
      },
    ],
    create: (id) =>
      makeNode(id, 'text', {
        content: 'Write clear, useful copy for this section.',
        style: 'default',
      }),
  },
  button: {
    type: 'button',
    label: 'Button',
    description: 'Accessible UIkit action link.',
    container: false,
    icon: '→',
    uikitComponents: ['button'],
    fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'href', label: 'Link', type: 'url' },
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Text', value: 'text' },
        ],
      },
    ],
    create: (id) => makeNode(id, 'button', { label: 'Learn more', href: '#', style: 'primary' }),
  },
  card: {
    type: 'card',
    label: 'Card',
    description: 'UIkit card that can contain headings, text and actions.',
    container: true,
    icon: '▣',
    uikitComponents: ['card'],
    fields: [
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Primary', value: 'primary' },
          { label: 'Secondary', value: 'secondary' },
        ],
      },
      {
        key: 'size',
        label: 'Padding',
        type: 'select',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Default', value: 'default' },
          { label: 'Large', value: 'large' },
        ],
      },
    ],
    create: (id) => makeNode(id, 'card', { style: 'default', size: 'default' }),
  },
}

export const BUILDER_ELEMENT_TYPES = Object.keys(BUILDER_CATALOG) as BuilderElementType[]
