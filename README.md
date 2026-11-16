Réutilisation de Cyclopolis par Place au Vélo Nantes, pour la métropole Nantaise.
Source des données : https://cocarto.com/fr/maps/f19c01e2-8c69-464b-91fa-ff3db095f9ad

---

# Cyclopolis

## Qu'est-ce que Cyclopolis ?

Il s'agit d'une plateforme web permettant la visualisation d'un projet de réseau cyclable structurant.

Entièrement développée par des bénévoles de l'association lyonnaise "La Ville à Vélo", cette plateforme a pour objectif principal de suivre le développement du projet des "Voies Lyonnaises".

On y retrouve en particulier :

- une carte intéractive permettant de visualiser les tracés des voies cyclables.
- une page détaillée sur chacune des voies cyclables.
- des analyses de traffic à partir des compteurs à vélo de la métropole lyonnaise.

## Est-il possible de réutiliser Cyclopolis pour un autre projet ?

Oui !

Vous êtes une association, ou un particulier ? Il y a un projet de réseau cyclable structurant dans votre ville et vous souhaitez suivre son développement ? Vous pouvez tout à fait réutiliser Cyclopolis pour votre projet.

Cyclopolis :

- est open source, le code est entièrement disponible sur Github.
- a une licence ouverte, vous avez donc le droit de réutiliser le code pour votre projet.
- est gratuit à opérer (pas de base de données, pas de serveur dédié, pas de coût de maintenance).

## Aide aux contributeurs/trices non développeurs/euses

le `status` de chaque tronçon peut prendre les valeurs définies [ici](types/index.ts#L13)

le `type` de chaque tronçon peut prendre les valeurs définies [ici](types/index.ts#L1)

## Synchronisation des données avec Cocarto

Le workflow [update_gvv.yml](.github/workflows/update_gvv.yml) télécharge chaque heure le GeoJSON de la couche Cocarto, le retraite (`npm run fix-voies`), commit les changements puis relance le déploiement.

La couche n'étant pas publique, la requête est authentifiée avec le cookie de session d'un compte Cocarto ayant accès à la carte. Pour le configurer :

1. Se connecter sur [cocarto.com](https://cocarto.com) avec un compte ayant accès à la carte.
2. Ouvrir les outils de développement du navigateur (F12) → onglet **Réseau**, recharger la page, cliquer sur une requête vers `cocarto.com` et copier la valeur **complète** de l'en-tête de requête `Cookie` (ex. `_cocarto_session=…; autre_cookie=…`).
3. Sur GitHub : **Settings → Secrets and variables → Actions → New repository secret**
   - Name : `COCARTO_COOKIE`
   - Secret : la valeur copiée à l'étape 2 (sans le préfixe `Cookie:`).
4. Vérifier en lançant le workflow à la main : onglet **Actions → Update GVV GeoJSON → Run workflow**.

Pour changer de couche, modifier l'URL `https://cocarto.com/fr/layers/<id>.geojson` dans le workflow (l'id est visible dans l'URL de la couche sur Cocarto).

⚠️ Le cookie de session finit par expirer (ou est invalidé en cas de déconnexion). Si le workflow récupère une page HTML de connexion au lieu du GeoJSON, l'étape de formatage ou `fix-voies` échoue : il suffit alors de recopier un nouveau cookie dans le secret.

## Quelques détails techniques

Look at the [nuxt 4 documentation](https://nuxt.com/docs/4.x/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
npm ci
```

## Development Server

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production

Build the application for production:

```bash
npm run generate
```

Locally preview production build:

```bash
npm run preview
```
