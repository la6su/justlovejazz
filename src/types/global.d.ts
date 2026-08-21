// src/types/global.d.ts
declare global {
  interface Window {
    UIkit: any
  }
}

declare module 'uikit/dist/js/uikit-icons.js' {
  const plugin: (uk: unknown) => void
  export default plugin
}

export {}
