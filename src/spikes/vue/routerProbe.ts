import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [{ path: '/', name: 'phase-one-probe', component: {} }]

/** Isolated Router contract: never installed into the production application. */
export function createPhaseOneRouter() {
  return createRouter({ history: createMemoryHistory(), routes })
}
