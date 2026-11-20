import nodemailer from 'nodemailer';
import type { MailAEnvoyer } from './messageMail.ts';

export interface SessionEnvoi {
  envoyer(mail: MailAEnvoyer): Promise<void>;
}

/** Ouvre une session Gmail. Échoue (sans rien envoyer) si Gmail refuse l'adresse ou le mot de passe. */
export type OuvrirSessionEnvoi = (expediteur: string, motDePasseApplication: string) => Promise<SessionEnvoi>;

export class ConnexionRefuseeError extends Error {
  constructor() {
    super('Gmail a refusé la connexion');
    this.name = 'ConnexionRefuseeError';
  }
}

export class GmailInjoignableError extends Error {
  constructor() {
    super('Gmail est injoignable');
    this.name = 'GmailInjoignableError';
  }
}

const CONNEXIONS_GMAIL = [
  { port: 465, secure: true },
  { port: 587, secure: false },
];

export const ouvrirSessionGmail: OuvrirSessionEnvoi = async (expediteur, motDePasseApplication) => {
  for (const { port, secure } of CONNEXIONS_GMAIL) {
    const transport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port,
      secure,
      connectionTimeout: 4_000,
      greetingTimeout: 4_000,
      socketTimeout: 8_000,
      auth: { user: expediteur, pass: motDePasseApplication },
    });
    try {
      await transport.verify();
    } catch (erreur) {
      // L'erreur d'origine n'est volontairement pas conservée : elle peut citer les identifiants.
      transport.close();
      if ((erreur as { code?: string }).code === 'EAUTH') throw new ConnexionRefuseeError();
      continue;
    }
    return {
      async envoyer(mail) {
        await transport.sendMail({ from: expediteur, to: mail.destinataire, subject: mail.sujet, text: mail.texte });
      },
    };
  }
  throw new GmailInjoignableError();
};
