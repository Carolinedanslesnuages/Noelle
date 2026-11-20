import { randomInt } from 'node:crypto';
import { NOMBRE_MINIMUM_PARTICIPANTS } from './lectureCsv.ts';

export interface Duo {
  donneur: number;
  receveur: number;
}

function melanger(nombre: number): number[] {
  const ordre = Array.from({ length: nombre }, (_valeur, index) => index);
  for (let position = nombre - 1; position > 0; position--) {
    const autrePosition = randomInt(position + 1);
    const memoire = ordre[position] as number;
    ordre[position] = ordre[autrePosition] as number;
    ordre[autrePosition] = memoire;
  }
  return ordre;
}

/** Vrai si personne ne se tire soi-même et si aucun duo ne s'échange (A→B et B→A). */
export function tirageValide(receveurs: readonly number[]): boolean {
  return receveurs.every((receveur, donneur) => receveur !== donneur && receveurs[receveur] !== donneur);
}

/**
 * Tire au sort qui offre à qui. `duos[i]` est le receveur du donneur i (indices des participants).
 * Personne ne se tire soi-même, aucun échange à deux. Minimum 3 participants.
 */
export function tirerAuSort(nombreParticipants: number): Duo[] {
  if (nombreParticipants < NOMBRE_MINIMUM_PARTICIPANTS) {
    throw new Error(`Il faut au moins ${NOMBRE_MINIMUM_PARTICIPANTS} participants`);
  }
  for (;;) {
    const receveurs = melanger(nombreParticipants);
    if (tirageValide(receveurs)) {
      return receveurs.map((receveur, donneur) => ({ donneur, receveur }));
    }
  }
}
