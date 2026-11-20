import { describe, expect, it } from 'vitest';
import { lireCsvParticipants, nomDepuisEmail } from './lectureCsv.ts';

const CSV_VALIDE = ['nom,email,Couleur préférée,Allergies', 'Alice,alice@example.org,Bleu,Noix', 'Bob,bob@example.org,Vert,', 'Chloé,chloe@example.org,"Rouge, orangé",'].join('\n');

describe('lecture du CSV des participants', () => {
  it('lit le nom, l’email et les réponses au questionnaire', () => {
    const lecture = lireCsvParticipants(CSV_VALIDE);
    expect(lecture.participants).toEqual([
      { nom: 'Alice', email: 'alice@example.org', reponses: [{ question: 'Couleur préférée', reponse: 'Bleu' }, { question: 'Allergies', reponse: 'Noix' }] },
      { nom: 'Bob', email: 'bob@example.org', reponses: [{ question: 'Couleur préférée', reponse: 'Vert' }] },
      { nom: 'Chloé', email: 'chloe@example.org', reponses: [{ question: 'Couleur préférée', reponse: 'Rouge, orangé' }] },
    ]);
  });

  it('accepte le point-virgule des exports tableur', () => {
    const lecture = lireCsvParticipants(CSV_VALIDE.replaceAll(',', ';').replace('Rouge; orangé', 'Rouge orangé'));
    expect(lecture.participants).toHaveLength(3);
  });

  it('refuse un email invalide, sans l’afficher', () => {
    const lecture = lireCsvParticipants('nom,email\nAlice,pas-un-email\nBob,bob@example.org\nChloé,chloe@example.org');
    expect(lecture.erreur).toBe("Ligne 2 : l'email n'est pas valide.");
  });

  it('refuse un email en double', () => {
    const lecture = lireCsvParticipants('nom,email\nAlice,a@example.org\nBob,A@example.org\nChloé,c@example.org');
    expect(lecture.erreur).toBe('Ligne 3 : cet email apparaît déjà plus haut.');
  });

  it('refuse moins de 3 participants', () => {
    const lecture = lireCsvParticipants('nom,email\nAlice,a@example.org\nBob,b@example.org');
    expect(lecture.erreur).toBe('Il faut au moins 3 participants dans le fichier.');
  });

  it('refuse un fichier sans colonne email', () => {
    expect(lireCsvParticipants('prenom,courriel2\nA,b').erreur).toContain('« email »');
  });

  it('refuse un nom vide', () => {
    expect(lireCsvParticipants('nom,email\n,a@example.org\nB,b@example.org\nC,c@example.org').erreur).toBe('Ligne 2 : le nom est vide.');
  });
  it('lit l’export Google Forms : « Adresse e-mail », sans nom, horodateur ignoré', () => {
    const csv = [
      'Horodateur,Adresse e-mail,📚 Quel est ton livre ou ton film préféré ?,"🎁 Préfères-tu les cadeaux pratiques, décoratifs ou ludiques ?"',
      '04/12/2025 19:41:08,alice.martin@example.org,Mr Nobody,Pratique ou Ludique',
      '04/12/2025 19:42:10,bob@example.org,"Le Seigneur des anneaux, tome 1",',
      '04/12/2025 19:43:00,chloe-dupont@example.org,,Décoratifs',
    ].join('\n');
    expect(lireCsvParticipants(csv).participants).toEqual([
      {
        nom: 'Alice Martin',
        email: 'alice.martin@example.org',
        reponses: [
          { question: '📚 Quel est ton livre ou ton film préféré ?', reponse: 'Mr Nobody' },
          { question: '🎁 Préfères-tu les cadeaux pratiques, décoratifs ou ludiques ?', reponse: 'Pratique ou Ludique' },
        ],
      },
      { nom: 'Bob', email: 'bob@example.org', reponses: [{ question: '📚 Quel est ton livre ou ton film préféré ?', reponse: 'Le Seigneur des anneaux, tome 1' }] },
      { nom: 'Chloe Dupont', email: 'chloe-dupont@example.org', reponses: [{ question: '🎁 Préfères-tu les cadeaux pratiques, décoratifs ou ludiques ?', reponse: 'Décoratifs' }] },
    ]);
  });

  it('tire le nom de l’email quand il n’y a pas de colonne nom', () => {
    expect(nomDepuisEmail('line.robillard@example.org')).toBe('Line Robillard');
    expect(nomDepuisEmail('jean_paul-dupont@example.org')).toBe('Jean Paul Dupont');
  });
});
