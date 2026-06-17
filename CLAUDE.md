# CLAUDE.md

Contexte projet pour les sessions Claude Code. Concis et factuel.
Pour la doc destinée à l'humain (guides pas-à-pas : ajouter un projet, déployer,
personnaliser le thème…), voir [`GUIDE.md`](GUIDE.md) — à **maintenir à jour** en
parallèle du code (voir « Règles de travail »).

## Projet

Portfolio personnel présenté comme un éditeur de code (thème sombre type VS Code).
Stack : **React + Vite**, déployé sur **Vercel** (build Vite standard). Dossier
`squirrel-dev`. **Pas de routeur** : app pilotée par onglets, vit à la racine `/`.
[`vercel.json`](vercel.json) ajoute un *rewrite SPA* (toute route → `index.html`)
pour que les URL inconnues passent par l'app, qui affiche alors une **page 404**.

## Architecture du contenu

Tout le contenu vient d'un **seul fichier de données** : [`src/projects.json`](src/projects.json).
Aucun contenu n'est codé en dur dans le React — pour ajouter/modifier du contenu,
on touche au JSON, pas au code.

Structure (clés racine de `projects.json`) :

- `profile` — identité : `name`, `role`, `tagline`, `location`, `email`, `links` (github, linkedin). Alimente l'onglet README (en-tête + section « Me contacter »).
- `readme` — texte d'accueil en markdown : `intro`, `approach`, `navigation` (un champ vide masque sa section).
- `projects[]` — un objet par projet : `id`, `name` (slug nu, affiché avec l'extension `.json`), `type` (`"pro"` | `"perso"`), `year`, `status`, `title`, `oneliner`, `problem`, `solution`, `stack` (ids d'outils), `metrics[]` (optionnel), `highlights[]` (optionnel), `kinds[]` (natures du projet, **liste ouverte** : `"site-vitrine"`, `"webapp"`, `"app-native"`, `"automatisation"`…), `platforms[]` (objets `{ store, url }`, `store` **liste ouverte** : `"web"`, `"ios"`, `"android"`…), `repo`. **`demo` a été remplacé par `platforms[{ store: "web" }]`** — il n'existe plus.
- `tools{}` — **map `id` → métadonnées** : `{ label, category, color, logo, url, description }`. `category` (optionnel) = nom de la catégorie d'affichage dans le panneau Outils (groupes repliables) ; absent/vide = groupe « Autres ».

### Système d'ids outils

Les outils sont identifiés par un **id stable** (slug minuscule, tirets : `github-pages`),
**pas par leur nom**. Renommer le `label` ne casse donc pas les références.

- `stack` (dans chaque projet) contient des **ids**, ex. `["webflow", "javascript", "css"]`.
- `tools` mappe chaque id vers ses métadonnées. Seul `label` est requis ; le reste est optionnel.
- Partout où un outil s'affiche, l'id est résolu vers son `label` via `tools`. Un id absent de `tools` s'affiche **tel quel** (fallback, pas de crash) + warning console.
- Comptages et liens du graphe se basent sur l'**id**.

Logique de résolution/dérivation : [`src/lib/tools.js`](src/lib/tools.js) et [`src/lib/graph.js`](src/lib/graph.js).

## Les deux vues

- **IDE** — explorateur de fichiers (projets rangés en `pro`/`perso`) + onglets. **Toute page de contenu** (README, fiche projet, fiche outil, future page) a un toggle **Preview** (rendu lisible) / **Raw** (source brute) + bouton copier, mutualisé dans [`src/components/ContentPage.jsx`](src/components/ContentPage.jsx) et [`src/components/RawView.jsx`](src/components/RawView.jsx) — **pas re-codé par page**. Raw selon le format : **JSON** pour projet/outil, **markdown source** pour le README. Onglet **README** en accueil.
- **Graph** — canvas **React Flow** (`@xyflow/react`) auto-généré depuis `projects.json` : un nœud par projet, un nœud par outil unique (déduit des `stack`), un lien projet → outil. Outils partagés grossissent. Composants : [`src/components/GraphView.jsx`](src/components/GraphView.jsx), [`src/components/graphNodes.jsx`](src/components/graphNodes.jsx). **Non disponible sous 720px** (le code React Flow n'est alors pas chargé).
- **Panneau Tools** (sidebar) — liste des outils déduits des `stack`, **groupés par `category`** dans des dossiers repliables (composant partagé [`src/components/Folder.jsx`](src/components/Folder.jsx), même que les groupes pro/perso de l'explorateur). Groupes triés alphabétiquement par catégorie, « Autres » (sans `category`) toujours en dernier ; outils triés alphabétiquement par label dans chaque groupe. Catégories **dérivées de la donnée** (rien en dur). Clic → fiche outil dans un onglet. [`src/components/ToolsPanel.jsx`](src/components/ToolsPanel.jsx), [`src/components/ToolView.jsx`](src/components/ToolView.jsx).
- **Panneau Source Control** (sidebar) — faux **historique git** purement narratif (aucun vrai git). Liste les projets comme des « commits » triés par **année décroissante puis id** (stable) : hash court déterministe (dérivé de l'id), `name` (slug nu, sans extension) en message de commit, badge `pro`/`perso`, année en méta ; compteur de section = nombre de projets. Clic/Entrée sur un commit **appelle `openProject`** (même onglet que l'explorateur, pas de doublon, focus déplacé). Tout dérive de `projects.json`. Icône `git-branch` dans l'activity bar (sous la recherche) + onglet « Git » du drawer mobile. [`src/components/SourceControlPanel.jsx`](src/components/SourceControlPanel.jsx), dérivation dans [`src/lib/history.js`](src/lib/history.js).
- **Palette de commandes** (Ctrl/Cmd+K) — modale [`src/components/CommandPalette.jsx`](src/components/CommandPalette.jsx). Liste **auto-dérivée de `projects.json`** (projets ; outils via `buildTools`/map `tools`) + actions (README, Settings, toggle vue, toggle thème). Elle **n'appelle que** les callbacks d'ouverture existants (`openProject`, `openTool`, `openReadme`, `openSettings`, `toggleView`) — **aucune logique re-codée**, mêmes gardes anti-doublon. Préfixe `>` = actions seules. Raccourci global + `toggleView` dans [`src/App.jsx`](src/App.jsx) ; point d'entrée mobile = bouton dans la title bar (le raccourci n'a pas de sens au doigt). **Modale ⇒ focus piégé dedans** (exception assumée, cf. « Règles de travail »). La palette porte aussi les **commandes fantômes** de la partie ludique (`> konami`, `> solve …`), jamais rendues dans la liste (cf. ci-dessous).

## Partie ludique (jeux / easter eggs)

Sous-système caché, déclenché à la découverte. **Volontairement absent de [`GUIDE.md`](GUIDE.md)** : `GUIDE.md` est la doc de présentation, lue en premier, où l'on préserve l'effet de découverte ; le détail technique vit ici. (Le repo est public et le code expose tout — il ne s'agit pas d'un secret, juste de ne pas divulgâcher dans la doc d'accueil.) Plusieurs en-têtes de composants renvoient à cette section par « partie ludique ».

- **Déblocage en deux couches** — état dans [`src/lib/easterEggs.jsx`](src/lib/easterEggs.jsx) (contexte monté à la racine [`src/main.jsx`](src/main.jsx), persisté en `localStorage` sous `squirrel-dev:easter-eggs`, lecture défensive `readStored` → toujours un `DEFAULT_STATE` valide même si JSON absent/corrompu) :
  1. **Mode Jeux** (`easterEggUnlocked`) — débloqué par le **Konami Code** (écouteur clavier dans [`src/App.jsx`](src/App.jsx)) **ou** la commande fantôme `> konami`. Révèle le panneau **Jeux** + la page `konami-code.md`.
  2. **Jeu par jeu** (`gamesUnlocked[id]`) — chaque jeu se débloque en résolvant **son énigme** via `> solve <réponse>`.

  Flags de **victoire-récompense** dans le même objet, à plat : `snakeVictory`, `memoryVictory`, `squirrelVictory` (rétrocompat assurée par la lecture `!!parsed.x` : un état stocké ancien retombe sur `false`). Callbacks exposés : `unlockKonami`, `unlockGame(id)`, et la **primitive générique `unlockVictory(id)`** (écrit le flag `<id>Victory`) — `unlockSnakeVictory` subsiste en **alias** (rétrocompat d'API), pas de logique dupliquée.
- **Registre = source unique** [`src/games/registry.js`](src/games/registry.js) : `GAMES[]`, un objet par jeu — `id` (clé stable de `gamesUnlocked`), `label` (**révélé uniquement une fois le jeu débloqué**, ne doit jamais fuiter : ni page konami, ni panneau Jeux, ni palette), `emoji`, `riddle`, `solutions[]` (deux énigmes ne partagent jamais une solution), `component`. Helpers : `gameTabId`, `gameById`, `normalizeAnswer` (sans accents, minuscules, espaces réduits — appliqué des **deux** côtés), `gameIdForAnswer` (réponse → id de jeu) et **`victoryGameIdForAnswer`** (reconnaît `<solution> victory` en **dérivant** les alias des `solutions` + suffixe « victory » — zéro chaîne en dur). Le champ **`emoji` est actuellement inutilisé** (il alimentait le toast de victoire, retiré au profit du `🎮` du composant `Toast`) : **conservé pour resservir** (ex. titres des pages victory) — ne pas le prendre pour un oubli à câbler ou à supprimer.
- **Énigmes & commandes** ([`src/App.jsx`](src/App.jsx), `solveRiddle`) : `> solve <réponse>` débloque le jeu correspondant ; `> solve <jeu> victory` débloque la **page-récompense** sans rejouer la condition cachée. Le cas victoire est testé **en priorité** (avant `gameIdForAnswer`, sinon le mot-solution seul serait capturé par l'énigme), avec les mêmes gardes : **jeu débloqué requis** (sinon « Mauvaise réponse… », ne révèle pas la commande), **déjà débloqué** (neutre), succès (toast). Les toasts ([`src/components/Toast.jsx`](src/components/Toast.jsx)) s'appuient sur l'icône `🎮` du composant — **aucun emoji en dur dans la chaîne** (homogénéité).
- **Trois jeux & conditions de victoire** (rendu sur `<canvas>`, état « chaud » en refs, cf. en-têtes des composants) :
  - **Snake** [`src/components/games/SnakeGame.jsx`](src/components/games/SnakeGame.jsx) — « grille parfaite » (serpent occupant les `TOTAL_CELLS`).
  - **Memory** [`src/components/games/MemoryGame.jsx`](src/components/games/MemoryGame.jsx) — « partie parfaite » : `moves === pairs` (zéro erreur) **et** temps `≤ pairs × 2 × FLIP_MS × TOLERANCE` (seuil **dérivé** des constantes, jamais en dur).
  - **Squirrel** [`src/components/games/SquirrelGame.jsx`](src/components/games/SquirrelGame.jsx) — palier `WIN_SCORE` atteint → état `'won'` distinct de `'over'`.

  À sa victoire, chaque jeu **appelle `onVictory` via `onVictoryRef`** (ref synchronisée par effet → pas de prop/`gameId` périmé dans la boucle ou les closures) **en plus** d'afficher son **overlay in-component** (les deux coexistent). Côté App, `onVictory` est **généralisé** à tous les jeux : `() => unlockVictory(activeGameTab.gameId)` (plus de cas Snake en dur).
- **Pages-récompense persistantes** : [`VictorySnakeView`](src/components/VictorySnakeView.jsx), [`VictoryMemoryView`](src/components/VictoryMemoryView.jsx), [`VictorySquirrelView`](src/components/VictorySquirrelView.jsx) — prose statique via `ContentPage`/`MarkdownView` (onglets `victory-snake` / `victory-memory` / `victory-squirrel`, rendus dans [`src/App.jsx`](src/App.jsx)). N'apparaissent dans l'explorateur **que si leur flag est vrai**. Le **lore de Snake est finalisé** ; **Memory et Squirrel restent des placeholders** explicitement marqués « à finaliser » dans le source.
- **Affichage sidebar** ([`src/components/GamesPanel.jsx`](src/components/GamesPanel.jsx), [`src/components/Sidebar.jsx`](src/components/Sidebar.jsx)) : noms via le helper unique [`fileName`](src/lib/fileName.js) — `<Label>.exe` pour un jeu débloqué, `victory-*.md` pour les pages. Tant qu'un jeu est **verrouillé**, le panneau Jeux affiche un libellé **anonyme « Jeu n°N »** (ni label ni énigme ne fuitent).

## Conventions

- **Tout est piloté par `projects.json`** — rien en dur (nœuds du graphe, listes d'outils, contenu des fiches, positions… sont tous dérivés du JSON).
- **Logos** : dans [`public/logos/`](public/logos/), nommés d'après l'id (`public/logos/<id>.svg`) ; le champ `logo` y pointe (`"/logos/<id>.svg"`). Rendu forcé en **blanc** sur fond `color`.
- **Pastille outil** : composant unique [`src/components/ToolLogo.jsx`](src/components/ToolLogo.jsx). Avec logo → logo blanc sur fond `color` ; **sans logo → initiale du label** (majuscule, blanche, monospace, centrée) sur fond `color` (gris neutre `--tool-badge-fallback` si `color` vide). Réutilisé partout (sidebar carré arrondi, fiche/graphe cercle) — ne pas re-coder ce fallback ailleurs.
- **Thème** : couleurs et polices en variables CSS dans le `:root` de [`src/styles.css`](src/styles.css) (`--accent` teal, `--font-mono`, etc.). Le **mode clair** est un second jeu de variables sous `:root[data-theme='light']` (on surcharge des variables, pas de patch au cas par cas). `--tab-top-active` **dérive de `--accent`** et `--accent-status` en est une variante `color-mix` assombrie : ils suivent l'accent choisi au runtime. En revanche les **icônes projets** `--icon-pro` (**ambre** `#e0b341`) et `--icon-perso` (**teal** `#4ec9b0`) sont **fixes** — elles ne suivent **pas** l'accent ; `--icon-tool` (bleu) et `--icon-system` (`#6a9ce0`, bleu plus clair — **fichiers système de la sidebar** : README, konami-code, pages victory) aussi, **toutes fixes**. (Accent par défaut = teal ⇒ icône perso = accent par défaut, voulu.)
- **Hash de commit (Source Control)** : dérivation **pure et déterministe** de l'`id` du projet (FNV-1a 32 bits tronqué à 7 hex) dans le helper réutilisable [`src/lib/history.js`](src/lib/history.js) (`shortHash`, `buildHistory`). Purement cosmétique, ne change jamais d'un reload à l'autre ; seul l'`id` le détermine (pas le titre). Ne pas re-coder ce hash ailleurs.
- **Copie presse-papier** : helper unique [`src/lib/clipboard.js`](src/lib/clipboard.js) (`copyText`, avec repli `execCommand`), utilisé par [`CopyButton`](src/components/CopyButton.jsx) (vue Raw) et [`CopyEmail`](src/components/CopyEmail.jsx) — ne pas re-coder la copie ailleurs.
- **Préférences utilisateur (thème clair/sombre + accent)** : état UI, **pas du contenu** → **jamais dans `projects.json`**. Persistées en `localStorage` (`pref:theme`, `pref:accent`) via le contexte [`src/lib/preferences.jsx`](src/lib/preferences.jsx) monté à la racine ([`src/main.jsx`](src/main.jsx)). Défaut thème = `prefers-color-scheme` tant qu'aucun choix explicite. UI dans l'onglet **Settings** ([`src/components/SettingsView.jsx`](src/components/SettingsView.jsx)), ouvert par l'engrenage en bas de l'activity bar. Le panneau **Outils** utilise l'icône `package` ; l'engrenage (`GearIcon`) est réservé aux Paramètres.
- **Page 404** : [`src/components/NotFound.jsx`](src/components/NotFound.jsx), rendu par [`src/App.jsx`](src/App.jsx) quand `window.location.pathname !== '/'` (toute route est inconnue, l'app n'a pas de routeur). Écran thématique (faux onglet `404.md`, bloc terminal `cat … → No such file or directory`, bouton « ← Retour à l'accueil » qui remet l'URL à `/` via `history.replaceState`). Style 100 % via variables de thème (clair + sombre), bloc « Page 404 » dans `styles.css`. La règle côté hébergeur est dans `vercel.json`.
- **Message console d'accueil** : [`src/lib/consoleGreeting.js`](src/lib/consoleGreeting.js) (`logConsoleGreeting`), appelé **une fois au niveau module** dans [`src/main.jsx`](src/main.jsx) (pas à chaque render). Email + liens **dérivés de `profile`** (`projects.json`), **rien en dur**, même source que le README. Seul log volontaire ; pas de bruit console en prod au-delà de ça (hors warning de fallback outil déjà existant).

## Règles de travail

- **Toujours vérifier que `npm run build` passe** avant de conclure un changement.
- **Maintenir [`GUIDE.md`](GUIDE.md) à jour** (doc humaine) quand un comportement décrit y change — en plus du code.
- **Respecter l'accessibilité clavier déjà en place** : pattern ARIA Tabs (`tablist`/`tab`/`tabpanel`, roving tabindex, flèches + Entrée/Espace), **pas de focus trap** (Tab finit toujours par sortir vers le navigateur), focus visible (`:focus-visible`), skip link. Voir la section « Accessibilité clavier » de `GUIDE.md`.
- **Exception focus trap** : la règle « pas de focus trap » vaut pour la **nav principale**. Une **modale temporaire** (la palette de commandes) y **déroge** : le focus est piégé dedans tant qu'elle est ouverte, puis **rendu** à l'élément précédent à la fermeture (Échap / clic dehors / exécution).
- Ne rien coder en dur qui devrait venir de `projects.json`.

## Commandes

```bash
npm run dev      # serveur de dev → http://localhost:5173
npm run build    # build de production → dist/
```
