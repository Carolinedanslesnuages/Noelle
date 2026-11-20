import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LutineNoelle from '../LutineNoelle.vue'

describe('LutineNoelle', () => {
  it('se présente et annonce son rôle en texte lisible', () => {
    const lutine = mount(LutineNoelle)
    expect(lutine.text()).toContain("Salut, moi c'est Noëlle")
    expect(lutine.text()).toContain("Je t'aide à faire ton tirage de Noël")
  })

  it("cache le dessin décoratif aux lecteurs d'écran", () => {
    const lutine = mount(LutineNoelle)
    expect(lutine.find('svg').attributes('aria-hidden')).toBe('true')
  })
})
