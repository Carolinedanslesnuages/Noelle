import type { Participant } from './lectureCsv.ts';

export interface MailAEnvoyer {
  destinataire: string;
  sujet: string;
  texte: string;
}

/** Le mail du donneur : qui il doit gâter, et les réponses de cette personne au questionnaire. */
export function composerMail(donneur: Participant, receveur: Participant): MailAEnvoyer {
  const lignes = [
    `Bonjour ${donneur.nom},`,
    '',
    `Pour ce Secret Santa, tu dois gâter : ${receveur.nom}.`,
    '',
  ];
  if (receveur.reponses.length > 0) {
    lignes.push(`Voici ses réponses au questionnaire, pour t'aider à choisir :`);
    for (const { question, reponse } of receveur.reponses) lignes.push(`- ${question} : ${reponse}`);
  } else {
    lignes.push(`${receveur.nom} n'a pas répondu au questionnaire.`);
  }
  lignes.push('', 'Chut, c’est un secret !', 'Joyeuses fêtes !');
  return { destinataire: donneur.email, sujet: 'Ton Secret Santa', texte: lignes.join('\n') };
}
