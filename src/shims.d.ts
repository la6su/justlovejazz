declare module 'troika-three-text' {
  export class Text {
    constructor(options?: {
      text?: string
      fontSize?: number
      maxWidth?: number
      textAlign?: string
      anchorX?: string
      anchorY?: string
      letterSpacing?: number
      lineHeight?: number
      material?: any
      sync?: boolean
    })
    dispose(): void
  }
}
