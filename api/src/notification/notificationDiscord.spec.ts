import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  composerMessageDiscord,
  creerNotificationDiscord,
  evaluerPointsDeVigilance,
  lireAdresseWebhookDiscord,
  type StatistiquesTirage,
} from './notificationDiscord.ts';

const ADRESSE_VALIDE = 'https://discord.com/api/webhooks/123456789012345678/abcDEF-ghi_JKL';

const STATISTIQUES_CALMES: StatistiquesTirage = {
  participants: 12,
  mailsEnvoyes: 12,
  dureeMillisecondes: 3400,
  usageProcesseurNoelle: 0.12,
  serveur: { chargeMoyenneUneMinute: 0.42, nombreCoeurs: 2, memoireLibreMo: 1840, memoireTotaleMo: 3814, memoireNoelleMo: 96 },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lireAdresseWebhookDiscord', () => {
  it("accepte l'adresse d'un webhook Discord, avec ou sans paramètre", () => {
    expect(lireAdresseWebhookDiscord({ DISCORD_WEBHOOK_URL: ADRESSE_VALIDE })).toBe(ADRESSE_VALIDE);
    expect(lireAdresseWebhookDiscord({ DISCORD_WEBHOOK_URL: `${ADRESSE_VALIDE}?thread_id=42` })).toBe(`${ADRESSE_VALIDE}?thread_id=42`);
    expect(lireAdresseWebhookDiscord({ DISCORD_WEBHOOK_URL: `  ${ADRESSE_VALIDE}  ` })).toBe(ADRESSE_VALIDE);
  });

  it.each([
    ['absente', undefined],
    ['vide', ''],
    ['en http', 'http://discord.com/api/webhooks/123/abc'],
    ['vers un autre site', 'https://exemple.org/api/webhooks/123/abc'],
    ['vers un site qui imite Discord', 'https://discord.com.exemple.org/api/webhooks/123/abc'],
    ['sans identifiant', 'https://discord.com/api/webhooks/abc'],
  ])('refuse une adresse %s (la fonction reste désactivée)', (_cas, valeur) => {
    expect(lireAdresseWebhookDiscord({ DISCORD_WEBHOOK_URL: valeur })).toBeUndefined();
  });
});

describe('evaluerPointsDeVigilance', () => {
  it('ne signale rien quand tout va bien', () => {
    expect(evaluerPointsDeVigilance(STATISTIQUES_CALMES)).toEqual([]);
  });

  it('signale des mails manquants, une charge élevée, une mémoire presque pleine et un tirage lent', () => {
    const points = evaluerPointsDeVigilance({
      ...STATISTIQUES_CALMES,
      mailsEnvoyes: 10,
      dureeMillisecondes: 25_000,
      serveur: { ...STATISTIQUES_CALMES.serveur, chargeMoyenneUneMinute: 1.8, memoireLibreMo: 200 },
    });
    expect(points).toEqual(["Certains mails n'ont pas été envoyés", 'Charge du serveur élevée', 'Mémoire presque pleine', 'Tirage lent']);
  });
});

describe('composerMessageDiscord', () => {
  it('annonce que tout va bien, en vert, avec les chiffres du tirage', () => {
    const [embed] = composerMessageDiscord(STATISTIQUES_CALMES, new Date('2026-12-01T10:00:00Z')).embeds;
    expect(embed?.title).toContain('Noëlle a servi');
    expect(embed?.description).toContain('Tout va bien');
    expect(embed?.color).toBe(0x166534);
    const valeurs = Object.fromEntries((embed?.fields ?? []).map((champ) => [champ.name, champ.value]));
    expect(valeurs['Participants']).toBe('12');
    expect(valeurs['Mails envoyés']).toBe('12 / 12');
    expect(valeurs['Durée']).toContain('3,4');
    expect(valeurs['Charge du serveur']).toContain('21 %');
    expect(valeurs['Mémoire libre']).toContain('48 %');
    expect(embed?.timestamp).toBe('2026-12-01T10:00:00.000Z');
  });

  it("alerte en orange avec la raison, par un texte (jamais par la couleur seule)", () => {
    const [embed] = composerMessageDiscord({ ...STATISTIQUES_CALMES, mailsEnvoyes: 9 }).embeds;
    expect(embed?.description).toContain('À surveiller');
    expect(embed?.description).toContain("Certains mails n'ont pas été envoyés");
    expect(embed?.color).toBe(0xf2c14e);
  });
});

describe('creerNotificationDiscord', () => {
  it("n'envoie rien sans adresse de webhook", () => {
    const envoyerHttp = vi.fn();
    creerNotificationDiscord(undefined, envoyerHttp as unknown as typeof fetch)(STATISTIQUES_CALMES);
    expect(envoyerHttp).not.toHaveBeenCalled();
  });

  it('envoie un seul message JSON vers le webhook', () => {
    const envoyerHttp = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }));
    creerNotificationDiscord(ADRESSE_VALIDE, envoyerHttp)(STATISTIQUES_CALMES);
    expect(envoyerHttp).toHaveBeenCalledTimes(1);
    const [adresse, options] = envoyerHttp.mock.calls[0] ?? [];
    expect(adresse).toBe(ADRESSE_VALIDE);
    expect(options?.method).toBe('POST');
    expect(JSON.parse(typeof options?.body === 'string' ? options.body : '{}').embeds[0].title).toContain('Noëlle a servi');
  });

  it('ne lève jamais d’erreur quand Discord est injoignable, et le dit sans révéler l’adresse du webhook', async () => {
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
    const envoyerHttp = vi.fn(async () => {
      throw new Error(`connexion refusée vers ${ADRESSE_VALIDE}`);
    });
    expect(() => creerNotificationDiscord(ADRESSE_VALIDE, envoyerHttp)(STATISTIQUES_CALMES)).not.toThrow();
    await vi.waitFor(() => expect(journal).toHaveBeenCalledWith('Notification Discord impossible'));
    expect(JSON.stringify(journal.mock.calls)).not.toContain('123456789012345678');
  });

  it("signale un refus de Discord (statut) sans lever d'erreur ni révéler l'adresse", async () => {
    const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
    const envoyerHttp = vi.fn(async () => new Response('refusé', { status: 429 }));
    creerNotificationDiscord(ADRESSE_VALIDE, envoyerHttp)(STATISTIQUES_CALMES);
    await vi.waitFor(() => expect(journal).toHaveBeenCalledWith('Notification Discord refusée (statut 429)'));
    expect(JSON.stringify(journal.mock.calls)).not.toContain('abcDEF');
  });
});
