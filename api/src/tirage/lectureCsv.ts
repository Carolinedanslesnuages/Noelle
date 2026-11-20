export interface ReponseQuestionnaire {
  question: string;
  reponse: string;
}

export interface Participant {
  nom: string;
  email: string;
  reponses: ReponseQuestionnaire[];
}

export type LectureCsv = { participants: Participant[]; erreur?: undefined } | { erreur: string; participants?: undefined };

export const NOMBRE_MINIMUM_PARTICIPANTS = 3;

const MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function detecterSeparateur(premiereLigne: string): string {
  return premiereLigne.split(';').length > premiereLigne.split(',').length ? ';' : ',';
}

/** Découpe un texte CSV en lignes de cellules, en gérant les guillemets (RFC 4180 simplifié). */
function decouperEnLignes(texte: string, separateur: string): string[][] {
  const lignes: string[][] = [];
  let ligneCourante: string[] = [];
  let cellule = '';
  let entreGuillemets = false;

  const terminerLigne = () => {
    ligneCourante.push(cellule);
    cellule = '';
    if (ligneCourante.some((valeur) => valeur.trim() !== '')) lignes.push(ligneCourante);
    ligneCourante = [];
  };

  for (let position = 0; position < texte.length; position++) {
    const caractere = texte.charAt(position);
    if (entreGuillemets) {
      if (caractere === '"' && texte.charAt(position + 1) === '"') {
        cellule += '"';
        position++;
      } else if (caractere === '"') {
        entreGuillemets = false;
      } else {
        cellule += caractere;
      }
    } else if (caractere === '"') {
      entreGuillemets = true;
    } else if (caractere === separateur) {
      ligneCourante.push(cellule);
      cellule = '';
    } else if (caractere === '\n' || caractere === '\r') {
      if (caractere === '\r' && texte.charAt(position + 1) === '\n') position++;
      terminerLigne();
    } else {
      cellule += caractere;
    }
  }
  terminerLigne();
  return lignes;
}

/**
 * Lit le CSV des participants : colonnes « nom » et « email » obligatoires, toutes les autres
 * colonnes sont les questions du questionnaire. Aucun nom ni email n'apparaît dans les erreurs.
 */
export function lireCsvParticipants(contenu: string): LectureCsv {
  const texte = contenu.replace(/^﻿/, '');
  const separateur = detecterSeparateur(texte.split(/\r?\n/, 1)[0] ?? '');
  const lignes = decouperEnLignes(texte, separateur);
  const enTete = (lignes[0] ?? []).map((titre) => titre.trim());
  const colonneNom = enTete.findIndex((titre) => titre.toLowerCase() === 'nom');
  const colonneEmail = enTete.findIndex((titre) => ['email', 'e-mail', 'mail', 'courriel'].includes(titre.toLowerCase()));
  if (colonneNom === -1 || colonneEmail === -1) {
    return { erreur: 'Le fichier doit avoir une première ligne avec les colonnes « nom » et « email ».' };
  }

  const participants: Participant[] = [];
  const emailsDejaVus = new Set<string>();
  for (const [indexLigne, cellules] of lignes.slice(1).entries()) {
    const numeroLigne = indexLigne + 2;
    const nom = (cellules[colonneNom] ?? '').trim();
    const email = (cellules[colonneEmail] ?? '').trim();
    if (nom === '') return { erreur: `Ligne ${numeroLigne} : le nom est vide.` };
    if (!MOTIF_EMAIL.test(email)) return { erreur: `Ligne ${numeroLigne} : l'email n'est pas valide.` };
    const emailNormalise = email.toLowerCase();
    if (emailsDejaVus.has(emailNormalise)) return { erreur: `Ligne ${numeroLigne} : cet email apparaît déjà plus haut.` };
    emailsDejaVus.add(emailNormalise);

    const reponses: ReponseQuestionnaire[] = [];
    for (const [indexColonne, question] of enTete.entries()) {
      if (indexColonne === colonneNom || indexColonne === colonneEmail || question === '') continue;
      const reponse = (cellules[indexColonne] ?? '').trim();
      if (reponse !== '') reponses.push({ question, reponse });
    }
    participants.push({ nom, email, reponses });
  }

  if (participants.length < NOMBRE_MINIMUM_PARTICIPANTS) {
    return { erreur: `Il faut au moins ${NOMBRE_MINIMUM_PARTICIPANTS} participants dans le fichier.` };
  }
  return { participants };
}
