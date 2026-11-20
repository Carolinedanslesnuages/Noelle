import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import HomeView from '../HomeView.vue'
import { violationsAccessibilite } from '@/__tests__/accessibilite'

const CSV = 'nom,email\nAlice,alice@example.org\nBob,bob@example.org\nChloé,chloe@example.org'

const CHAMP_ADRESSE = '[data-testid="adresse-gmail"] input'
const CHAMP_MOT_DE_PASSE = '[data-testid="mot-de-passe-application"] input'

let wrapper: VueWrapper
const monter = () => {
  wrapper = mount(HomeView, { attachTo: document.body })
  return wrapper
}

async function remplirFormulaire(page: VueWrapper, expediteur = 'orga@gmail.com', motDePasse = 'abcd efgh ijkl mnop') {
  const fichier = new File([CSV], 'participants.csv', { type: 'text/csv' })
  const champFichier = page.find('input[type="file"]')
  Object.defineProperty(champFichier.element, 'files', { value: [fichier], configurable: true })
  await champFichier.trigger('change')
  await flushPromises()
  await page.find(CHAMP_ADRESSE).setValue(expediteur)
  await page.find(CHAMP_MOT_DE_PASSE).setValue(motDePasse)
}

let reponseTirage: () => Response
let identifiantsRequis = true
const appelsTirage = () => vi.mocked(fetch).mock.calls.filter(([adresse]) => adresse === '/api/tirage')

beforeEach(() => {
  identifiantsRequis = true
  reponseTirage = () => new Response('{}', { status: 500 })
  vi.stubGlobal(
    'fetch',
    vi.fn(async (adresse: string) =>
      adresse === '/api/tirage/configuration'
        ? new Response(JSON.stringify({ identifiantsGmailRequis: identifiantsRequis }), { status: 200 })
        : reponseTirage(),
    ),
  )
})
afterEach(() => {
  wrapper.unmount()
  vi.unstubAllGlobals()
})

describe('Écran du tirage', () => {
  it('a un seul h1 explicite et des champs avec étiquette visible, dont un mot de passe masqué', () => {
    const page = monter()
    expect(page.findAll('h1')).toHaveLength(1)
    expect(page.find('h1').text()).toContain('Tirage au sort')
    expect(page.find('[data-testid="adresse-gmail"] label').text()).toContain('adresse Gmail')
    expect(page.find('[data-testid="mot-de-passe-application"] label').text()).toContain("mot de passe d'application")
    expect(page.find(CHAMP_MOT_DE_PASSE).attributes('type')).toBe('password')
    expect(page.text()).toContain("comment obtenir un mot de passe d'application")
    expect(page.text()).toContain("Salut, moi c'est Noëlle")
  })

  it('envoie le CSV et affiche seulement le nombre de mails envoyés', async () => {
    reponseTirage = () => new Response(JSON.stringify({ mailsEnvoyes: 3, mailsTotal: 3 }), { status: 200 })
    const page = monter()
    await remplirFormulaire(page)
    await page.find('form').trigger('submit')
    await flushPromises()

    expect(page.find('[role="status"]').text()).toContain('Tirage fait, 3 mails envoyés.')
    const corps = JSON.parse(String(appelsTirage()[0]?.[1]?.body)) as Record<string, string>
    expect(corps.contenuCsv).toBe(CSV)
    expect(corps.expediteur).toBe('orga@gmail.com')
    expect(page.text()).not.toContain('Alice')
  })

  it('efface le mot de passe saisi après l’envoi', async () => {
    reponseTirage = () => new Response(JSON.stringify({ mailsEnvoyes: 3, mailsTotal: 3 }), { status: 200 })
    const page = monter()
    await remplirFormulaire(page)
    await page.find('form').trigger('submit')
    await flushPromises()
    expect((page.find(CHAMP_MOT_DE_PASSE).element as HTMLInputElement).value).toBe('')
  })

  it('indique N mails sur M quand certains échouent', async () => {
    reponseTirage = () => new Response(JSON.stringify({ mailsEnvoyes: 2, mailsTotal: 3 }), { status: 200 })
    const page = monter()
    await remplirFormulaire(page)
    await page.find('form').trigger('submit')
    await flushPromises()
    expect(page.find('[role="status"]').text()).toContain('2 mails sur 3 envoyés')
  })

  it('signale les champs manquants, reliés à leur champ, sans rien envoyer', async () => {
    const page = monter()
    await page.find('form').trigger('submit')
    await flushPromises()
    expect(appelsTirage()).toHaveLength(0)
    expect(page.text()).toContain('Importez le fichier CSV des participants.')
    expect(page.text()).toContain('Saisissez une adresse Gmail valide')
    expect(page.text()).toContain("Saisissez le mot de passe d'application Gmail.")
    expect(page.find('[data-testid="adresse-gmail"] [role="alert"]').text()).toContain('adresse Gmail valide')
  })

  it('affiche le message clair de l’API quand Gmail refuse la connexion', async () => {
    reponseTirage = () =>
      new Response(JSON.stringify({ erreur: "Gmail a refusé la connexion. Aucun mail n'est parti." }), { status: 401 })
    const page = monter()
    await remplirFormulaire(page)
    await page.find('form').trigger('submit')
    await flushPromises()
    expect(page.find('[role="alert"]').text()).toContain("Aucun mail n'est parti")
  })

  it('sur Vercel (envoi par l’API Gmail), n’affiche ni adresse ni mot de passe et envoie seulement le CSV', async () => {
    identifiantsRequis = false
    reponseTirage = () => new Response(JSON.stringify({ mailsEnvoyes: 3, mailsTotal: 3 }), { status: 200 })
    const page = monter()
    await flushPromises()
    expect(page.find(CHAMP_ADRESSE).exists()).toBe(false)
    expect(page.find(CHAMP_MOT_DE_PASSE).exists()).toBe(false)

    const fichier = new File([CSV], 'participants.csv', { type: 'text/csv' })
    const champFichier = page.find('input[type="file"]')
    Object.defineProperty(champFichier.element, 'files', { value: [fichier], configurable: true })
    await champFichier.trigger('change')
    await flushPromises()
    await page.find('form').trigger('submit')
    await flushPromises()

    expect(JSON.parse(String(appelsTirage()[0]?.[1]?.body))).toEqual({ contenuCsv: CSV })
    expect(page.find('[role="status"]').text()).toContain('3 mails envoyés')
  })

  it('aucune violation d’accessibilité automatique', async () => {
    monter()
    expect(await violationsAccessibilite(document.body)).toEqual([])
  })

  it('aucune violation d’accessibilité automatique avec les erreurs affichées', async () => {
    const page = monter()
    await page.find('form').trigger('submit')
    await flushPromises()
    expect(await violationsAccessibilite(document.body)).toEqual([])
  })
})
