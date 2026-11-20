import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LutineNoelle from '../LutineNoelle.vue'
import BulleNoelle from '../BulleNoelle.vue'

describe('LutineNoelle', () => {
  it("cache le dessin décoratif aux lecteurs d'écran", () => {
    const lutine = mount(LutineNoelle)
    expect(lutine.find('svg').attributes('aria-hidden')).toBe('true')
  })
})

describe('BulleNoelle', () => {
  it('affiche les explications de Noëlle en texte lisible, reliable à un champ', () => {
    const bulle = mount(BulleNoelle, { props: { idTexte: 'aide-test' }, slots: { default: 'Je t’explique.' } })
    expect(bulle.find('#aide-test').text()).toContain('Je t’explique.')
  })

  it("ignore le dessin pour les lecteurs d'écran", () => {
    const bulle = mount(BulleNoelle, { slots: { default: 'Salut' } })
    expect(bulle.find('svg').attributes('aria-hidden')).toBe('true')
  })
})
