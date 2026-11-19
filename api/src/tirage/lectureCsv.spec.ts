import { describe, expect, it } from 'vitest';
import { lireCsvParticipants } from './lectureCsv.ts';

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

  it('refuse un fichier sans colonnes nom et email', () => {
    expect(lireCsvParticipants('prenom,courriel2\nA,b').erreur).toContain('« nom » et « email »');
  });

  it('refuse un nom vide', () => {
    expect(lireCsvParticipants('nom,email\n,a@example.org\nB,b@example.org\nC,c@example.org').erreur).toBe('Ligne 2 : le nom est vide.');
  });
});
