import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { lireVersion } from './version.ts';
import { creerRouteTirage } from './routes/tirage.ts';
import { ouvrirSessionGmail, type OuvrirSessionEnvoi } from './tirage/envoiGmail.ts';

/**
 * L'application Express : routes sous /api, réponses JSON. Une route par fichier
 * `src/routes/<domaine>.ts` (voir AGENTS.md), branchée ici.
 */
export function creerApp(
  base: DatabaseSync | undefined,
  ouvrirSessionEnvoi: OuvrirSessionEnvoi = ouvrirSessionGmail,
): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', creerRouteTirage(ouvrirSessionEnvoi));

  app.get(['/__version__', '/api/__version__'], (_requete, reponse) => {
    reponse.set('Cache-Control', 'no-store').json(lireVersion());
  });

  app.get('/api', (_requete, reponse) => {
    if (!base) {
      reponse.json({ statut: 'ok' });
      return;
    }
    const migrations = base.prepare('SELECT COUNT(*) AS nombre FROM migrations').get();
    reponse.json({ statut: 'ok', migrations: Number(migrations?.nombre ?? 0) });
  });

  app.use('/api', (_requete, reponse) => {
    reponse.status(404).json({ erreur: 'Adresse inconnue' });
  });

  // Erreur inattendue : message générique, détail dans le journal du serveur seulement.
  app.use((erreur: unknown, _requete: Request, reponse: Response, _suite: NextFunction) => {
    console.error(erreur);
    reponse.status(500).json({ erreur: 'Erreur interne' });
  });

  return app;
}
