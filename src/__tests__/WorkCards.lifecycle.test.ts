import { afterEach, describe, expect, it } from 'vitest'
import { disposeWorkCards, initWorkCards } from '../UI/WorkCards'

describe('WorkCards route ownership', () => {
  afterEach(() => {
    disposeWorkCards()
    document.body.replaceChildren()
  })

  it('binds only cards inside the active route root', () => {
    document.body.innerHTML = `
      <main id="spa-content">
        <div class="jlz-works-grid"><button class="jlz-work-card" data-project-idx="0"></button></div>
      </main>
      <div class="jlz-works-grid"><button class="jlz-work-card" data-project-idx="1"></button></div>
    `

    initWorkCards()

    expect(document.querySelector('#spa-content .jlz-work-card')?.getAttribute('tabindex')).toBe(
      '0',
    )
    expect(
      document.querySelector('body > .jlz-works-grid .jlz-work-card')?.getAttribute('tabindex'),
    ).toBe(null)
  })
})
