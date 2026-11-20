import request from 'supertest';
import { describe, expect, it } from 'vitest';
import applicationHebergee from '../src/index.ts';

describe('Point d’entrée pour l’hébergement Vercel', () => {
  it('exporte une application qui répond sans écrire sur le disque', async () => {
    const reponse = await request(applicationHebergee).get('/api');
    expect(reponse.status).toBe(200);
    expect(reponse.body.statut).toBe('ok');
  });
});
