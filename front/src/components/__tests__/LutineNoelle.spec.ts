import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LutineNoelle from '../LutineNoelle.vue'
import BulleNoelle from '../BulleNoelle.vue'
import LutineEnPied from '../LutineEnPied.vue'

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

describe('LutineEnPied', () => {
  it("cache le dessin décoratif aux lecteurs d'écran et ne contient aucun texte", () => {
    const lutine = mount(LutineEnPied)
    const dessin = lutine.find('svg')
    expect(dessin.attributes('aria-hidden')).toBe('true')
    expect(dessin.attributes('focusable')).toBe('false')
    expect(lutine.text()).toBe('')
  })

  it('a deux bras séparés, pour pouvoir les animer', () => {
    const lutine = mount(LutineEnPied)
    expect(lutine.find('.lutine-bras-gauche').exists()).toBe(true)
    expect(lutine.find('.lutine-bras-droit').exists()).toBe(true)
  })

  it('prend la largeur demandée en gardant ses proportions', () => {
    const lutine = mount(LutineEnPied, { props: { largeur: 120 } })
    expect(lutine.find('svg').attributes('width')).toBe('120')
    expect(lutine.find('svg').attributes('height')).toBe('250')
  })
})

