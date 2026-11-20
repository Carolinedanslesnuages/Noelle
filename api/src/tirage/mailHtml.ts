import type { Participant } from './lectureCsv.ts';

/** Couleurs de l'interface (front/src/assets/styles.css), recopiées car un mail n'a pas de feuille de style. */
const COULEURS = {
  nuit: '#0b2e23',
  vert: '#166534',
  rouge: '#a3201a',
  or: '#f2c14e',
  creme: '#fdf9f3',
  texte: '#1c2b25',
  blanc: '#ffffff',
};
const POLICE_TITRE = "Georgia, 'Times New Roman', serif";
const POLICE_TEXTE = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Les noms et réponses viennent du CSV : tout est échappé avant d'entrer dans le HTML. */
export function echapperHtml(texte: string): string {
  return texte
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Noëlle et sa bulle : l'image à gauche, le texte dans une bulle verte à droite (tableaux : seule mise en page sûre en mail). */
function bulleNoelle(contenu: string, adresseImage: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td width="88" valign="middle" style="padding:0 6px 0 0;">
      <img src="${echapperHtml(adresseImage)}" width="84" height="84" alt="Noëlle, la lutine" style="display:block;border:2px solid ${COULEURS.vert};border-radius:50%;background:${COULEURS.blanc};">
    </td>
    <td width="12" valign="middle" style="padding:0;">
      <div style="width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-right:12px solid ${COULEURS.vert};"></div>
    </td>
    <td valign="middle" style="background:${COULEURS.blanc};border:2px solid ${COULEURS.vert};border-radius:16px;padding:14px 18px;font-family:${POLICE_TEXTE};font-size:16px;line-height:1.5;color:${COULEURS.texte};">
      ${contenu}
    </td>
  </tr>
</table>`;
}

function blocReponses(receveur: Participant): string {
  const nom = echapperHtml(receveur.nom);
  if (receveur.reponses.length === 0) {
    return `<p style="margin:0;font-family:${POLICE_TEXTE};font-size:15px;color:${COULEURS.texte};">${nom} n'a pas répondu au questionnaire : à toi de jouer les détectives !</p>`;
  }
  const lignes = receveur.reponses
    .map(
      ({ question, reponse }) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e7e1d6;font-family:${POLICE_TEXTE};">
        <div style="font-size:13px;font-weight:bold;color:${COULEURS.vert};">${echapperHtml(question)}</div>
        <div style="font-size:15px;color:${COULEURS.texte};padding-top:2px;">${echapperHtml(reponse)}</div>
      </td>
    </tr>`,
    )
    .join('');
  return `
<h2 style="margin:0 0 4px;font-family:${POLICE_TITRE};font-size:19px;font-weight:normal;color:${COULEURS.rouge};">Ses réponses au questionnaire</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${lignes}
</table>`;
}

/** Le mail du donneur en HTML, aux couleurs de l'interface, avec Noëlle qui parle dans une bulle. */
export function composerMailHtml(donneur: Participant, receveur: Participant, adresseImage: string): string {
  const bulle = bulleNoelle(
    `<p style="margin:0 0 6px;">Coucou <strong>${echapperHtml(donneur.nom)}</strong> !</p>
      <p style="margin:0;">Pour ce Secret Santa, tu dois gâter :</p>
      <p style="margin:6px 0 0;font-family:${POLICE_TITRE};font-size:24px;color:${COULEURS.rouge};">🎁 ${echapperHtml(receveur.nom)}</p>`,
    adresseImage,
  );
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ton Secret Santa</title></head>
<body style="margin:0;padding:0;background:${COULEURS.nuit};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COULEURS.nuit};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td align="center" style="padding:0 0 18px;font-family:${POLICE_TITRE};color:${COULEURS.blanc};">
            <div style="font-size:13px;letter-spacing:3px;color:${COULEURS.or};">✦ SECRET SANTA ✦</div>
            <div style="font-size:32px;padding-top:4px;">Noëlle</div>
          </td>
        </tr>
        <tr>
          <td style="background:${COULEURS.creme};border-top:6px solid ${COULEURS.rouge};border-radius:14px;padding:24px 20px;">
            ${bulle}
            <div style="height:22px;line-height:22px;font-size:0;">&nbsp;</div>
            ${blocReponses(receveur)}
            <p style="margin:22px 0 0;text-align:center;font-family:${POLICE_TITRE};font-size:17px;color:${COULEURS.vert};">Chut, c’est un secret ! 🤫</p>
            <p style="margin:4px 0 0;text-align:center;font-family:${POLICE_TEXTE};font-size:14px;color:${COULEURS.texte};">Joyeuses fêtes !</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
