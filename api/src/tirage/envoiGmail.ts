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

export const ouvrirSessionGmail: OuvrirSessionEnvoi = async (expediteur, motDePasseApplication) => {
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: expediteur, pass: motDePasseApplication },
  });
  try {
    await transport.verify();
  } catch {
    // L'erreur d'origine n'est volontairement pas conservée : elle peut citer les identifiants.
    transport.close();
    throw new ConnexionRefuseeError();
  }
  return {
    async envoyer(mail) {
      await transport.sendMail({ from: expediteur, to: mail.destinataire, subject: mail.sujet, text: mail.texte });
    },
  };
};
