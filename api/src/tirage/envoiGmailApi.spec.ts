import { describe, expect, it, vi } from 'vitest';
import { ConnexionRefuseeError, GmailInjoignableError } from './envoiGmail.ts';
import {
  construireMessageBrut,
  creerOuvertureSessionGmailApi,
  lireConfigurationGmailApi,
  type ConfigurationGmailApi,
} from './envoiGmailApi.ts';

const CONFIGURATION: ConfigurationGmailApi = {
  expediteur: 'organisatrice@gmail.com',
  identifiantClient: 'client',
  secretClient: 'secret',
  jetonDActualisation: 'actualisation',
};
const MAIL = { destinataire: 'alice@example.org', sujet: 'Ton Secret Santa', texte: 'Tu dois gâter : Bob.' };

const reponseJeton = () => new Response(JSON.stringify({ access_token: 'acces' }), { status: 200 });

describe('lireConfigurationGmailApi', () => {
  it('lit les quatre réglages', () => {
    expect(
      lireConfigurationGmailApi({
        GMAIL_EXPEDITEUR: 'organisatrice@gmail.com',
        GMAIL_CLIENT_ID: 'client',
        GMAIL_CLIENT_SECRET: 'secret',
        GMAIL_REFRESH_TOKEN: 'actualisation',
      }),
    ).toEqual(CONFIGURATION);
  });

  it('renvoie undefined dès qu’un réglage manque', () => {
    expect(lireConfigurationGmailApi({ GMAIL_EXPEDITEUR: 'organisatrice@gmail.com' })).toBeUndefined();
  });
});

describe('construireMessageBrut', () => {
  it('produit un message décodable avec expéditeur, destinataire et texte accentué', () => {
    const message = Buffer.from(construireMessageBrut('organisatrice@gmail.com', MAIL), 'base64url').toString('utf-8');
    expect(message).toContain('From: organisatrice@gmail.com');
    expect(message).toContain('To: alice@example.org');
    const corps = message.split('\r\n\r\n')[1] ?? '';
    expect(Buffer.from(corps, 'base64').toString('utf-8')).toBe(MAIL.texte);
  });
});

describe('creerOuvertureSessionGmailApi', () => {
  it('obtient un jeton puis envoie le mail avec ce jeton', async () => {
    const appeler = vi.fn<typeof fetch>().mockResolvedValueOnce(reponseJeton()).mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const session = await creerOuvertureSessionGmailApi(CONFIGURATION, appeler)('', '');
    await session.envoyer(MAIL);
    const appelEnvoi = appeler.mock.calls[1];
    expect(appelEnvoi?.[0]).toContain('gmail.googleapis.com');
    expect(appelEnvoi?.[1]?.headers).toMatchObject({ Authorization: 'Bearer acces' });
  });

  it('jeton refusé : ConnexionRefuseeError, aucun envoi tenté', async () => {
    const appeler = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 400 }));
    await expect(creerOuvertureSessionGmailApi(CONFIGURATION, appeler)('', '')).rejects.toBeInstanceOf(ConnexionRefuseeError);
    expect(appeler).toHaveBeenCalledTimes(1);
  });

  it('réseau en panne : GmailInjoignableError', async () => {
    const appeler = vi.fn<typeof fetch>().mockRejectedValue(new Error('réseau'));
    await expect(creerOuvertureSessionGmailApi(CONFIGURATION, appeler)('', '')).rejects.toBeInstanceOf(GmailInjoignableError);
  });

  it('envoi refusé par Gmail : le mail est compté en échec', async () => {
    const appeler = vi.fn<typeof fetch>().mockResolvedValueOnce(reponseJeton()).mockResolvedValueOnce(new Response('{}', { status: 403 }));
    const session = await creerOuvertureSessionGmailApi(CONFIGURATION, appeler)('', '');
    await expect(session.envoyer(MAIL)).rejects.toThrow();
  });
});
