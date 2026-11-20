import { creerApp } from './app.ts';
import { ouvrirBase } from './base.ts';

/**
 * Point d'entrée pour l'hébergement Vercel : l'application est exportée, pas démarrée.
 * Le disque y est en lecture seule : la base reste en mémoire (le tirage n'y stocke rien).
 */
export default creerApp(ouvrirBase(':memory:'));
