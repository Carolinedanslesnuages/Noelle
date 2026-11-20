# Réalisé hors story, en mode libre — Tirage secret santa avec envoi de mails

Demande #1 : l'organisatrice importe un CSV, saisit son Gmail et un mot de passe d'application, lance le tirage. Chaque participant reçoit un mail.

## Critères et tests qui les prouvent

| Critère | Test |
|---|---|
| CSV valide : nom, email et réponses lus | `api/src/tirage/lectureCsv.spec.ts` |
| CSV invalide (email faux, doublon, moins de 3 lignes) : message clair, aucun envoi | `lectureCsv.spec.ts`, `api/test/tirage.e2e.spec.ts` |
| Personne ne se tire, aucun échange à deux (3 à 25 participants, 300 essais chacun) | `api/src/tirage/tirage.spec.ts` |
| Le mail contient la personne à gâter et ses réponses | `messageMail.spec.ts`, `tirage.e2e.spec.ts` |
| L'écran de fin n'affiche que des nombres (N mails, ou N sur M) | `tirage.e2e.spec.ts`, `front/src/views/__tests__/HomeView.spec.ts` |
| Mot de passe ni conservé, ni affiché, ni journalisé | `tirage.e2e.spec.ts` (réponse et journal), `HomeView.spec.ts` (champ vidé après envoi) |
| Gmail refuse la connexion : message clair, aucun mail parti | `tirage.e2e.spec.ts` |

## Accessibilité

- Composants DSFR : envoi de fichier, champs, bouton, alertes, accordéon d'aide.
- Un seul h1, étiquettes visibles, champs obligatoires signalés, mot de passe masqué.
- Erreurs écrites près du champ, annoncées ; résultat annoncé par `role="status"`.
- Test axe-core automatique : écran vide et écran avec erreurs, sans violation.

À vérifier par un humain :
- parcours complet au clavier, y compris l'envoi de fichier et l'accordéon ;
- lecture d'écran des erreurs de champ (le composant DSFR les annonce par zone d'alerte) ;
- le titre de page (`<title>`) dit-il bien « Noëlle » seulement ? À affiner si besoin (fichier d'entrée du front, hors périmètre) ;
- contrastes (non mesurables dans les tests).

## Périmètre

- API : lecture du CSV, tirage, mail, envoi Gmail (`nodemailer`, seule dépendance ajoutée), route `POST /api/tirage`.
- Limite des requêtes portée de 100 ko à 1 Mo (CSV).
- Front : écran d'accueil remplacé par l'écran de tirage, service d'appel API.
- Aucun store Pinia : tout reste local à l'écran. Aucune migration : rien n'est stocké.

## Points d'attention

- Envoi réel via Gmail non testé ici (pas d'identifiants) : seuls des envois simulés sont testés. À essayer avec un vrai compte.
- L'organisatrice doit activer la validation en deux étapes Google pour créer le mot de passe d'application.
- Vercel : le projet reste prévu pour une image Docker ; mise en ligne à confirmer avec l'équipe technique. Un hébergement « sans serveur » peut limiter la durée d'envoi pour de gros groupes.
- Le résultat du tirage n'est consultable que dans le dossier « Envoyés » du Gmail.

## Résultat des contrôles

- API : lint, tests, tests e2e, compilation — OK.
- Front : oxlint, eslint, types, tests, construction — OK.
