import { describe, expect, it } from 'vitest';
import { composerMailHtml, echapperHtml } from './mailHtml.ts';
import { composerMail } from './messageMail.ts';

const IMAGE = 'https://noelle.example.org/noelle-mail.png';
const alice = { nom: 'Alice', email: 'alice@example.org', reponses: [] };
const bob = { nom: 'Bob', email: 'bob@example.org', reponses: [{ question: '🎁 Cadeau préféré ?', reponse: 'Ludique' }] };

describe('mail HTML', () => {
  it('montre Noëlle, le nom à gâter et ses réponses', () => {
    const html = composerMailHtml(alice, bob, IMAGE);
    expect(html).toContain(`<img src="${IMAGE}"`);
    expect(html).toContain('alt="Noëlle, la lutine"');
    expect(html).toContain('Coucou <strong>Alice</strong>');
    expect(html).toContain('🎁 Bob');
    expect(html).toContain('🎁 Cadeau préféré ?');
    expect(html).toContain('Ludique');
  });

  it('dit quand la personne n’a pas répondu', () => {
    expect(composerMailHtml(bob, alice, IMAGE)).toContain("Alice n'a pas répondu au questionnaire");
  });

  it('échappe les noms et réponses venus du CSV', () => {
    const piege = { nom: '<script>x</script>', email: 'p@example.org', reponses: [{ question: 'Q & R', reponse: '"<b>"' }] };
    const html = composerMailHtml(alice, piege, IMAGE);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Q &amp; R');
    expect(echapperHtml(`<a href="x">'`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;');
  });

  it('est ajouté au mail seulement quand l’adresse de l’image est connue', () => {
    expect(composerMail(alice, bob).html).toBeUndefined();
    expect(composerMail(alice, bob, IMAGE).html).toContain('Noëlle');
  });
});
