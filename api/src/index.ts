import { creerApp } from './app.ts';

/**
 * Point d'entrée pour l'hébergement Vercel : l'application est exportée, pas démarrée.
 * Le tirage ne stocke rien : aucune base ni fichier de migration n'est ouvert ici
 * (le disque y est en lecture seule et les fichiers SQL n'y sont pas déployés).
 */
export default creerApp(undefined);
