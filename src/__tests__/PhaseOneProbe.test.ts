import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PhaseOneProbe from '../spikes/vue/PhaseOneProbe.vue'
import { createPhaseOneRouter } from '../spikes/vue/routerProbe'

describe('Phase 1 Vue/Tres toolchain probe', () => {
  it('compiles an inert SFC and creates an isolated memory router', async () => {
    const wrapper = mount(PhaseOneProbe)
    expect(wrapper.attributes('data-tres-canvas')).toBe('available')
    await wrapper.get('button').trigger('click')
    expect(wrapper.text()).toContain('Probe 1')

    const router = createPhaseOneRouter()
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('phase-one-probe')
  })
})
