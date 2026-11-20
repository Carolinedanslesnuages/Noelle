import { describe, expect, it } from 'vitest';
import { composerMail } from './messageMail.ts';

describe('mail du donneur', () => {
  const alice = { nom: 'Alice', email: 'alice@example.org', reponses: [] };
  const bob = { nom: 'Bob', email: 'bob@example.org', reponses: [{ question: 'Couleur préférée', reponse: 'Vert' }] };

  it('est adressé au donneur et contient le nom de la personne à gâter et ses réponses', () => {
    const mail = composerMail(alice, bob);
    expect(mail.destinataire).toBe('alice@example.org');
    expect(mail.texte).toContain('Bonjour Alice');
    expect(mail.texte).toContain('tu dois gâter : Bob');
    expect(mail.texte).toContain('- Couleur préférée : Vert');
  });

  it('précise l’absence de réponses', () => {
    expect(composerMail(bob, alice).texte).toContain("Alice n'a pas répondu au questionnaire.");
  });
});
