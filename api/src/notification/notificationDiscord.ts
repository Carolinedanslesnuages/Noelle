import { availableParallelism, freemem, loadavg, totalmem } from 'node:os';

/**
 * Notification Discord envoyée à la fin d'un tirage, pour vérifier que Noëlle ne met pas le serveur en difficulté.
 *
 * VIE PRIVÉE : seuls des chiffres anonymes partent vers Discord (nombre de participants, durée, charge du serveur).
 * Jamais un nom, une adresse, un mot de passe ni le résultat du tirage (voir `routes/tirage.ts`).
 * L'adresse du webhook est un secret : elle vient de DISCORD_WEBHOOK_URL et n'est jamais écrite dans un journal.
 */

const OCTETS_PAR_MEGA = 1024 * 1024;
const SEUIL_CHARGE_PAR_COEUR = 0.8;
const SEUIL_MEMOIRE_LIBRE = 0.1;
const SEUIL_DUREE_LENTE_MILLISECONDES = 20_000;
const DELAI_MAXIMUM_ENVOI_MILLISECONDES = 5_000;

const COULEUR_TOUT_VA_BIEN = 0x166534;
const COULEUR_A_SURVEILLER = 0xf2c14e;

const ADRESSE_WEBHOOK_DISCORD = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+(\?[\w=&-]*)?$/;

export interface MesureServeur {
  chargeMoyenneUneMinute: number;
  nombreCoeurs: number;
  memoireLibreMo: number;
  memoireTotaleMo: number;
  memoireNoelleMo: number;
}

export interface StatistiquesTirage {
  participants: number;
  mailsEnvoyes: number;
  dureeMillisecondes: number;
  /** Part d'un cœur de processeur utilisée par Noëlle pendant le tirage (1 = un cœur entier). */
  usageProcesseurNoelle: number;
  serveur: MesureServeur;
}

export type NotifierTirage = (statistiques: StatistiquesTirage) => void;

export interface MessageDiscord {
  username: string;
  embeds: Array<{
    title: string;
    description: string;
    color: number;
    fields: Array<{ name: string; value: string; inline: boolean }>;
    timestamp: string;
  }>;
}

/** L'adresse du webhook si elle est bien celle d'un webhook Discord, sinon rien (fonction désactivée). */
export function lireAdresseWebhookDiscord(environnement: NodeJS.ProcessEnv): string | undefined {
  const adresse = environnement.DISCORD_WEBHOOK_URL?.trim();
  return adresse !== undefined && ADRESSE_WEBHOOK_DISCORD.test(adresse) ? adresse : undefined;
}

/** Relève l'état du serveur à l'instant présent. */
export function mesurerServeur(): MesureServeur {
  return {
    chargeMoyenneUneMinute: loadavg()[0] ?? 0,
    nombreCoeurs: availableParallelism(),
    memoireLibreMo: freemem() / OCTETS_PAR_MEGA,
    memoireTotaleMo: totalmem() / OCTETS_PAR_MEGA,
    memoireNoelleMo: process.memoryUsage().rss / OCTETS_PAR_MEGA,
  };
}

/** Démarre la mesure d'un tirage ; la fonction renvoyée, appelée à la fin, produit les statistiques. */
export function demarrerMesureTirage(): (participants: number, mailsEnvoyes: number) => StatistiquesTirage {
  const debut = performance.now();
  const processeurAvant = process.cpuUsage();
  return (participants, mailsEnvoyes) => {
    const dureeMillisecondes = performance.now() - debut;
    const processeur = process.cpuUsage(processeurAvant);
    const millisecondesProcesseur = (processeur.user + processeur.system) / 1000;
    return {
      participants,
      mailsEnvoyes,
      dureeMillisecondes,
      usageProcesseurNoelle: dureeMillisecondes > 0 ? millisecondesProcesseur / dureeMillisecondes : 0,
      serveur: mesurerServeur(),
    };
  };
}

/** Ce qui doit alerter : une liste vide veut dire que tout va bien. */
export function evaluerPointsDeVigilance(statistiques: StatistiquesTirage): string[] {
  const { serveur } = statistiques;
  const points: string[] = [];
  if (statistiques.mailsEnvoyes < statistiques.participants) points.push("Certains mails n'ont pas été envoyés");
  if (serveur.chargeMoyenneUneMinute / serveur.nombreCoeurs >= SEUIL_CHARGE_PAR_COEUR) points.push('Charge du serveur élevée');
  if (serveur.memoireLibreMo / serveur.memoireTotaleMo < SEUIL_MEMOIRE_LIBRE) points.push('Mémoire presque pleine');
  if (statistiques.dureeMillisecondes > SEUIL_DUREE_LENTE_MILLISECONDES) points.push('Tirage lent');
  return points;
}

function formater(valeur: number, decimales = 0): string {
  return valeur.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

function pourcentage(partie: number, total: number): string {
  return total > 0 ? `${formater((partie / total) * 100)} %` : 'inconnu';
}

export function composerMessageDiscord(statistiques: StatistiquesTirage, maintenant: Date = new Date()): MessageDiscord {
  const { serveur } = statistiques;
  const pointsDeVigilance = evaluerPointsDeVigilance(statistiques);
  const toutVaBien = pointsDeVigilance.length === 0;
  return {
    username: 'Noëlle',
    embeds: [
      {
        title: '🎅 Noëlle a servi',
        description: toutVaBien ? '✅ Tout va bien pour le serveur.' : `⚠️ À surveiller : ${pointsDeVigilance.join(' · ')}`,
        color: toutVaBien ? COULEUR_TOUT_VA_BIEN : COULEUR_A_SURVEILLER,
        fields: [
          { name: 'Participants', value: formater(statistiques.participants), inline: true },
          { name: 'Mails envoyés', value: `${formater(statistiques.mailsEnvoyes)} / ${formater(statistiques.participants)}`, inline: true },
          { name: 'Durée', value: `${formater(statistiques.dureeMillisecondes / 1000, 1)} s`, inline: true },
          {
            name: 'Charge du serveur',
            value: `${formater(serveur.chargeMoyenneUneMinute, 2)} pour ${formater(serveur.nombreCoeurs)} cœurs (${pourcentage(serveur.chargeMoyenneUneMinute, serveur.nombreCoeurs)})`,
            inline: false,
          },
          {
            name: 'Mémoire libre',
            value: `${formater(serveur.memoireLibreMo)} Mo sur ${formater(serveur.memoireTotaleMo)} Mo (${pourcentage(serveur.memoireLibreMo, serveur.memoireTotaleMo)})`,
            inline: false,
          },
          { name: 'Noëlle : processeur', value: `${formater(statistiques.usageProcesseurNoelle * 100)} % d'un cœur`, inline: true },
          { name: 'Noëlle : mémoire', value: `${formater(serveur.memoireNoelleMo)} Mo`, inline: true },
        ],
        timestamp: maintenant.toISOString(),
      },
    ],
  };
}

/**
 * Fonction de notification : sans adresse, elle ne fait rien. L'envoi ne bloque jamais le tirage et ne peut pas le faire
 * échouer : une erreur est signalée dans le journal du serveur, sans l'adresse du webhook (un secret).
 */
export function creerNotificationDiscord(adresseWebhook: string | undefined, envoyerHttp: typeof fetch = fetch): NotifierTirage {
  if (adresseWebhook === undefined) return () => {};
  return (statistiques) => {
    envoyerHttp(adresseWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(composerMessageDiscord(statistiques)),
      signal: AbortSignal.timeout(DELAI_MAXIMUM_ENVOI_MILLISECONDES),
    })
      .then((reponse) => {
        if (!reponse.ok) console.error(`Notification Discord refusée (statut ${reponse.status})`);
      })
      .catch(() => {
        console.error('Notification Discord impossible');
      });
  };
}
