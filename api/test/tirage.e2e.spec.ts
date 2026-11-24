import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { creerApp } from '../src/app.ts';
import { ouvrirBase } from '../src/base.ts';
import { ConnexionRefuseeError, GmailInjoignableError, type OuvrirSessionEnvoi } from '../src/tirage/envoiGmail.ts';
import type { MailAEnvoyer } from '../src/tirage/messageMail.ts';
import type { StatistiquesTirage } from '../src/notification/notificationDiscord.ts';

const CSV = ['nom,email,Couleur préférée', 'Alice,alice@example.org,Bleu', 'Bob,bob@example.org,Vert', 'Chloé,chloe@example.org,Rouge', 'David,david@example.org,Jaune'].join('\n');
const MOT_DE_PASSE = 'abcd efgh ijkl mnop';
const DEMANDE = { expediteur: 'organisatrice@gmail.com', motDePasseApplication: MOT_DE_PASSE, contenuCsv: CSV };

function creerAppAvecEnvoi(echecsPour: string[] = []) {
  const mailsEnvoyes: MailAEnvoyer[] = [];
  const ouvrirSession: OuvrirSessionEnvoi = vi.fn(async () => ({
    async envoyer(mail: MailAEnvoyer) {
      if (echecsPour.includes(mail.destinataire)) throw new Error('refusé');
      mailsEnvoyes.push(mail);
    },
  }));
  return { app: creerApp(ouvrirBase(':memory:'), ouvrirSession), mailsEnvoyes, ouvrirSession };
}

describe('POST /api/tirage', () => {
  it('envoie un mail par participant et ne renvoie que des nombres', async () => {
    const { app, mailsEnvoyes, ouvrirSession } = creerAppAvecEnvoi();
    const reponse = await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    expect(reponse.body).toEqual({ mailsEnvoyes: 4, mailsTotal: 4 });
    expect(mailsEnvoyes.map((mail) => mail.destinataire).sort()).toEqual(['alice@example.org', 'bob@example.org', 'chloe@example.org', 'david@example.org']);
    expect(ouvrirSession).toHaveBeenCalledWith('organisatrice@gmail.com', 'abcdefghijklmnop');
  });

  it('chaque mail contient le nom de la personne à gâter et ses réponses', async () => {
    const { app, mailsEnvoyes } = creerAppAvecEnvoi();
    await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    for (const mail of mailsEnvoyes) {
      expect(mail.texte).toMatch(/tu dois gâter : (Alice|Bob|Chloé|David)\./);
      expect(mail.texte).toMatch(/- Couleur préférée : (Bleu|Vert|Rouge|Jaune)/);
    }
  });

  it('la réponse ne contient jamais un nom ni le mot de passe', async () => {
    const { app } = creerAppAvecEnvoi();
    const reponse = await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    expect(reponse.text).not.toMatch(/Alice|Bob|Chloé|David|example\.org|abcd/);
  });

  it('indique N mails sur M quand certains échouent, sans nom', async () => {
    const { app } = creerAppAvecEnvoi(['bob@example.org']);
    const reponse = await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    expect(reponse.body).toEqual({ mailsEnvoyes: 3, mailsTotal: 4 });
  });

  it.each([
    ['CSV invalide (email faux)', { ...DEMANDE, contenuCsv: 'nom,email\nA,faux\nB,b@example.org\nC,c@example.org' }],
    ['CSV avec moins de 3 lignes', { ...DEMANDE, contenuCsv: 'nom,email\nA,a@example.org\nB,b@example.org' }],
    ['email expéditeur non Gmail', { ...DEMANDE, expediteur: 'quelquun@example.org' }],
    ['mot de passe absent', { ...DEMANDE, motDePasseApplication: '' }],
    ['CSV absent', { expediteur: DEMANDE.expediteur, motDePasseApplication: MOT_DE_PASSE }],
  ])('%s : message clair, aucun envoi', async (_cas, corps) => {
    const { app, mailsEnvoyes, ouvrirSession } = creerAppAvecEnvoi();
    const reponse = await request(app).post('/api/tirage').send(corps).expect(400);
    expect(typeof reponse.body.erreur).toBe('string');
    expect(ouvrirSession).not.toHaveBeenCalled();
    expect(mailsEnvoyes).toEqual([]);
  });

  it('Gmail refuse la connexion : message clair, aucun mail parti', async () => {
    const mailsEnvoyes: string[] = [];
    const refus: OuvrirSessionEnvoi = async () => {
      throw new ConnexionRefuseeError();
    };
    const reponse = await request(creerApp(ouvrirBase(':memory:'), refus)).post('/api/tirage').send(DEMANDE).expect(401);
    expect(reponse.body.erreur).toContain("Aucun mail n'est parti");
    expect(mailsEnvoyes).toEqual([]);
  });

  it('Gmail injoignable : message distinct du refus de mot de passe', async () => {
    const injoignable: OuvrirSessionEnvoi = async () => {
      throw new GmailInjoignableError();
    };
    const reponse = await request(creerApp(ouvrirBase(':memory:'), injoignable)).post('/api/tirage').send(DEMANDE).expect(502);
    expect(reponse.body.erreur).toContain('Impossible de joindre Gmail');
  });

  it('envoi par l’API Gmail : pas d’adresse ni de mot de passe à fournir, et l’écran le sait', async () => {
    const mailsEnvoyes: MailAEnvoyer[] = [];
    const ouvrirSession: OuvrirSessionEnvoi = async () => ({
      async envoyer(mail: MailAEnvoyer) {
        mailsEnvoyes.push(mail);
      },
    });
    const app = creerApp(ouvrirBase(':memory:'), ouvrirSession, false);
    const configuration = await request(app).get('/api/tirage/configuration').expect(200);
    expect(configuration.body).toEqual({ identifiantsGmailRequis: false });
    const reponse = await request(app).post('/api/tirage').send({ contenuCsv: CSV }).expect(200);
    expect(reponse.body).toEqual({ mailsEnvoyes: 4, mailsTotal: 4 });
    expect(mailsEnvoyes).toHaveLength(4);
  });

  it('ne journalise ni n’affiche le mot de passe, même en cas d’erreur inattendue', async () => {
    const journal = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const casse: OuvrirSessionEnvoi = async () => {
      throw new Error('panne inattendue');
    };
    const reponse = await request(creerApp(ouvrirBase(':memory:'), casse)).post('/api/tirage').send(DEMANDE).expect(500);
    expect(JSON.stringify([reponse.body, journal.mock.calls.map(([premier]) => String(premier))])).not.toContain('abcd');
    journal.mockRestore();
  });
});

describe('Notification Discord après un tirage', () => {
  function creerAppAvecNotification(echecsPour: string[] = []) {
    const notifierTirage = vi.fn<(statistiques: StatistiquesTirage) => void>();
    const ouvrirSession: OuvrirSessionEnvoi = async () => ({
      async envoyer(mail: MailAEnvoyer) {
        if (echecsPour.includes(mail.destinataire)) throw new Error('refusé');
      },
    });
    return { app: creerApp(ouvrirBase(':memory:'), ouvrirSession, true, notifierTirage), notifierTirage };
  }

  it('prévient une fois, avec les chiffres du tirage et l’état du serveur', async () => {
    const { app, notifierTirage } = creerAppAvecNotification();
    await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    expect(notifierTirage).toHaveBeenCalledTimes(1);
    const statistiques = notifierTirage.mock.calls[0]?.[0];
    expect(statistiques).toMatchObject({ participants: 4, mailsEnvoyes: 4 });
    expect(statistiques?.dureeMillisecondes).toBeGreaterThanOrEqual(0);
    expect(statistiques?.serveur.nombreCoeurs).toBeGreaterThan(0);
    expect(statistiques?.serveur.memoireTotaleMo).toBeGreaterThan(0);
  });

  it('compte les mails qui ont échoué, sans nom', async () => {
    const { app, notifierTirage } = creerAppAvecNotification(['bob@example.org']);
    await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    expect(notifierTirage.mock.calls[0]?.[0]).toMatchObject({ participants: 4, mailsEnvoyes: 3 });
  });

  it('ne contient JAMAIS un nom, une adresse, un mot de passe ni une réponse du formulaire', async () => {
    const { app, notifierTirage } = creerAppAvecNotification();
    await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    expect(JSON.stringify(notifierTirage.mock.calls)).not.toMatch(/Alice|Bob|Chloé|David|example\.org|gmail|abcd|Bleu|Vert|Rouge|Jaune/);
  });

  it("ne prévient pas quand le tirage n'a pas eu lieu (demande invalide, Gmail refuse ou injoignable)", async () => {
    const { app, notifierTirage } = creerAppAvecNotification();
    await request(app).post('/api/tirage').send({ ...DEMANDE, contenuCsv: 'nom,email\nA,a@example.org' }).expect(400);
    const refus: OuvrirSessionEnvoi = async () => {
      throw new ConnexionRefuseeError();
    };
    const injoignable: OuvrirSessionEnvoi = async () => {
      throw new GmailInjoignableError();
    };
    const autreNotification = vi.fn();
    await request(creerApp(ouvrirBase(':memory:'), refus, true, autreNotification)).post('/api/tirage').send(DEMANDE).expect(401);
    await request(creerApp(ouvrirBase(':memory:'), injoignable, true, autreNotification)).post('/api/tirage').send(DEMANDE).expect(502);
    expect(notifierTirage).not.toHaveBeenCalled();
    expect(autreNotification).not.toHaveBeenCalled();
  });

  it('un tirage réussit même si la notification est cassée côté Discord (envoi vers une adresse injoignable)', async () => {
    const journal = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { app } = creerAppAvecNotification();
    await request(app).post('/api/tirage').send(DEMANDE).expect(200);
    journal.mockRestore();
  });
});

