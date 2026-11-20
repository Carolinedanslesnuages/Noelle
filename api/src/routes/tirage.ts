import { Router } from 'express';
import { ConnexionRefuseeError, GmailInjoignableError, type OuvrirSessionEnvoi } from '../tirage/envoiGmail.ts';
import { lireCsvParticipants } from '../tirage/lectureCsv.ts';
import { composerMail } from '../tirage/messageMail.ts';
import { tirerAuSort } from '../tirage/tirage.ts';

const MOTIF_GMAIL = /^[^\s@]+@(gmail\.com|googlemail\.com)$/i;

interface DemandeTirage {
  expediteur: string;
  motDePasseApplication: string;
  contenuCsv: string;
}

function lireDemande(corps: unknown, identifiantsGmailRequis: boolean): DemandeTirage | { erreur: string } {
  const valeurs = typeof corps === 'object' && corps !== null ? (corps as Record<string, unknown>) : {};
  const { expediteur, motDePasseApplication, contenuCsv } = valeurs;
  if (identifiantsGmailRequis) {
    if (typeof expediteur !== 'string' || !MOTIF_GMAIL.test(expediteur.trim())) {
      return { erreur: 'Saisissez une adresse Gmail valide (finissant par @gmail.com).' };
    }
    if (typeof motDePasseApplication !== 'string' || motDePasseApplication.replace(/\s/g, '') === '') {
      return { erreur: "Saisissez le mot de passe d'application Gmail." };
    }
  }
  if (typeof contenuCsv !== 'string' || contenuCsv.trim() === '') {
    return { erreur: 'Importez le fichier CSV des participants.' };
  }
  return {
    expediteur: typeof expediteur === 'string' ? expediteur.trim() : '',
    motDePasseApplication: typeof motDePasseApplication === 'string' ? motDePasseApplication.replace(/\s/g, '') : '',
    contenuCsv,
  };
}

/**
 * POST /api/tirage : lit le CSV, tire au sort, envoie un mail par participant.
 * Ni le mot de passe ni le résultat du tirage ne sont conservés, affichés ou journalisés.
 */
export function creerRouteTirage(ouvrirSessionEnvoi: OuvrirSessionEnvoi, identifiantsGmailRequis = true): Router {
  const route = Router();

  // L'écran demande s'il doit afficher l'adresse Gmail et le mot de passe d'application.
  route.get('/tirage/configuration', (_requete, reponse) => {
    reponse.json({ identifiantsGmailRequis });
  });

  route.post('/tirage', async (requete, reponse) => {
    const demande = lireDemande(requete.body, identifiantsGmailRequis);
    if ('erreur' in demande) {
      reponse.status(400).json({ erreur: demande.erreur });
      return;
    }
    const lecture = lireCsvParticipants(demande.contenuCsv);
    if (lecture.erreur !== undefined) {
      reponse.status(400).json({ erreur: lecture.erreur });
      return;
    }
    const { participants } = lecture;

    let session;
    try {
      session = await ouvrirSessionEnvoi(demande.expediteur, demande.motDePasseApplication);
    } catch (erreur) {
      if (erreur instanceof ConnexionRefuseeError) {
        reponse.status(401).json({
          erreur: "Gmail a refusé la connexion. Vérifiez les identifiants d'envoi. Aucun mail n'est parti.",
        });
        return;
      }
      if (erreur instanceof GmailInjoignableError) {
        reponse.status(502).json({
          erreur: "Impossible de joindre Gmail depuis le serveur (connexion bloquée ou trop lente). Aucun mail n'est parti. Réessayez plus tard.",
        });
        return;
      }
      throw erreur;
    }

    const duos = tirerAuSort(participants.length);
    let mailsEnvoyes = 0;
    for (const { donneur, receveur } of duos) {
      const personneQuiOffre = participants[donneur];
      const personneGatee = participants[receveur];
      if (personneQuiOffre === undefined || personneGatee === undefined) continue;
      try {
        await session.envoyer(composerMail(personneQuiOffre, personneGatee));
        mailsEnvoyes++;
      } catch {
        // Échec d'un mail : compté seulement, sans nom ni détail.
      }
    }
    reponse.json({ mailsEnvoyes, mailsTotal: participants.length });
  });

  return route;
}
