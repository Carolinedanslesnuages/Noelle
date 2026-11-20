import { describe, expect, it } from 'vitest';
import { tirageValide, tirerAuSort } from './tirage.ts';

describe('tirage au sort', () => {
  it.each([3, 4, 5, 10, 25])('sur de nombreux essais à %i participants : personne ne se tire, aucun échange à deux, chacun donne et reçoit une fois', (nombre) => {
    for (let essai = 0; essai < 300; essai++) {
      const duos = tirerAuSort(nombre);
      const receveurs = duos.map((duo) => duo.receveur);
      expect(duos.map((duo) => duo.donneur)).toEqual(Array.from({ length: nombre }, (_valeur, index) => index));
      expect(new Set(receveurs).size).toBe(nombre);
      expect(tirageValide(receveurs)).toBe(true);
      for (const { donneur, receveur } of duos) {
        expect(receveur).not.toBe(donneur);
        expect(receveurs[receveur]).not.toBe(donneur);
      }
    }
  });

  it('refuse moins de 3 participants', () => {
    expect(() => tirerAuSort(2)).toThrow();
  });

  it('détecte un échange à deux et un auto-tirage', () => {
    expect(tirageValide([1, 0, 3, 2])).toBe(false);
    expect(tirageValide([0, 2, 1])).toBe(false);
    expect(tirageValide([1, 2, 0])).toBe(true);
  });
});
