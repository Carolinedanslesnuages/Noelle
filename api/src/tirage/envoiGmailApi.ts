import { ConnexionRefuseeError, GmailInjoignableError, type OuvrirSessionEnvoi } from './envoiGmail.ts';
import type { MailAEnvoyer } from './messageMail.ts';

/** Réglages de l'envoi par l'API Gmail (HTTPS), fournis par l'hébergeur, jamais saisis dans l'écran. */
export interface ConfigurationGmailApi {
  expediteur: string;
  identifiantClient: string;
  secretClient: string;
  jetonDActualisation: string;
}

const ADRESSE_JETON = 'https://oauth2.googleapis.com/token';
const ADRESSE_ENVOI = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
const DELAI_MAX_MS = 15_000;

/** Lit les réglages dans l'environnement ; `undefined` si l'un manque (on retombe alors sur le SMTP). */
export function lireConfigurationGmailApi(environnement: NodeJS.ProcessEnv): ConfigurationGmailApi | undefined {
  const expediteur = environnement.GMAIL_EXPEDITEUR;
  const identifiantClient = environnement.GMAIL_CLIENT_ID;
  const secretClient = environnement.GMAIL_CLIENT_SECRET;
  const jetonDActualisation = environnement.GMAIL_REFRESH_TOKEN;
  if (!expediteur || !identifiantClient || !secretClient || !jetonDActualisation) return undefined;
  return { expediteur, identifiantClient, secretClient, jetonDActualisation };
}

function encodageBase64Url(texte: string): string {
  return Buffer.from(texte, 'utf-8').toString('base64url');
}

/** Message complet (en-têtes + corps UTF-8) au format attendu par l'API Gmail. */
export function construireMessageBrut(expediteur: string, mail: MailAEnvoyer): string {
  const sujetEncode = `=?UTF-8?B?${Buffer.from(mail.sujet, 'utf-8').toString('base64')}?=`;
  const corpsEncode = Buffer.from(mail.texte, 'utf-8').toString('base64');
  const message = [
    `From: ${expediteur}`,
    `To: ${mail.destinataire}`,
    `Subject: ${sujetEncode}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    corpsEncode,
  ].join('\r\n');
  return encodageBase64Url(message);
}

async function obtenirJetonDAcces(configuration: ConfigurationGmailApi, appeler: typeof fetch): Promise<string> {
  let reponse: Response;
  try {
    reponse = await appeler(ADRESSE_JETON, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: configuration.identifiantClient,
        client_secret: configuration.secretClient,
        refresh_token: configuration.jetonDActualisation,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(DELAI_MAX_MS),
    });
  } catch {
    throw new GmailInjoignableError();
  }
  if (reponse.status === 400 || reponse.status === 401) throw new ConnexionRefuseeError();
  if (!reponse.ok) throw new GmailInjoignableError();
  const corps: unknown = await reponse.json().catch(() => ({}));
  const jeton = (corps as { access_token?: unknown }).access_token;
  if (typeof jeton !== 'string') throw new GmailInjoignableError();
  return jeton;
}

/** Envoi par l'API Gmail en HTTPS : fonctionne sur Vercel, où le SMTP est bloqué. */
export function creerOuvertureSessionGmailApi(
  configuration: ConfigurationGmailApi,
  appeler: typeof fetch = fetch,
): OuvrirSessionEnvoi {
  return async () => {
    const jetonDAcces = await obtenirJetonDAcces(configuration, appeler);
    return {
      async envoyer(mail) {
        const reponse = await appeler(ADRESSE_ENVOI, {
          method: 'POST',
          headers: { Authorization: `Bearer ${jetonDAcces}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw: construireMessageBrut(configuration.expediteur, mail) }),
          signal: AbortSignal.timeout(DELAI_MAX_MS),
        });
        if (!reponse.ok) throw new Error('Envoi refusé');
      },
    };
  };
}
