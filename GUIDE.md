# Guide — Portfolio "IDE"

Ce portfolio est une application Vite + React qui ressemble à un éditeur de code
(thème sombre type VS Code). Tout le contenu est piloté par des **fichiers de
données dédiés, une source par entité** : les projets dans
[`src/projects.json`](src/projects.json), les outils dans
[`src/tools.json`](src/tools.json), les services dans
[`src/services.json`](src/services.json), le changelog dans
[`src/changelog.json`](src/changelog.json) et la page de statut dans
[`src/status.json`](src/status.json). Pas besoin de toucher au code React pour
ajouter ou modifier du contenu.

---

## 1. Ajouter / modifier un projet

Ouvre [`src/projects.json`](src/projects.json) et ajoute un objet dans le tableau
`projects`. Chaque projet suit ce schéma :

```json
{
  "id": "mon-projet",
  "name": "mon-projet",
  "type": "pro",
  "year": 2025,
  "status": "En ligne",
  "title": "Mon Projet — sous-titre court",
  "oneliner": "Une phrase qui résume l'impact du projet.",
  "problem": "Le contexte et le problème à résoudre.",
  "solution": "Ce que tu as construit et comment.",
  "stack": ["react", "node-js", "postgresql"],
  "metrics": [
    { "label": "Temps gagné", "value": "-40%" },
    { "label": "Utilisateurs", "value": "1 200" }
  ],
  "highlights": [
    "Un fait marquant qualitatif, quand un chiffre n'a pas de sens",
    "Une autre réussite notable du projet"
  ],
  "kinds": ["webapp", "app-native"],
  "platforms": [
    { "store": "web", "url": "https://exemple.com" },
    { "store": "ios", "url": "https://apps.apple.com/app/id000000000" },
    { "store": "android", "url": "https://play.google.com/store/apps/details?id=com.exemple" }
  ],
  "repo": "https://github.com/moi/mon-projet"
}
```

### Champs

| Champ      | Type                         | Notes                                                        |
| ---------- | ---------------------------- | ------------------------------------------------------------ |
| `id`       | string (unique)              | Identifiant interne. Doit être unique.                       |
| `name`     | string (slug)                | Nom de fichier affiché (`name.json`). Format `mon-projet`.   |
| `type`     | `"pro"` ou `"perso"`         | Range le projet dans le dossier correspondant + couleur d'icône. |
| `year`     | number                       | Année du projet.                                             |
| `status`   | string                       | État du projet, affiché en badge coloré (voir ci-dessous).   |
| `title`    | string                       | Titre H1 de la fiche (mode Preview).                         |
| `oneliner` | string                       | Phrase d'accroche en italique.                               |
| `problem`  | string                       | Section "Le problème".                                       |
| `solution` | string                       | Section "La solution".                                       |
| `stack`    | string[] (ids d'outils)      | **Ids** d'outils (pas les noms) — voir « Outils : système id / label ». |
| `metrics`  | `{ label, value }[]`         | **Optionnel.** Résultats chiffrés → section "Résultats" (tableau label/valeur). Absent ou `[]` = section masquée. |
| `highlights` | string[]                   | **Optionnel.** Faits marquants qualitatifs → section "Points clés" (liste à puces). Absent ou `[]` = section masquée. |
| `kinds`    | string[]                     | **Optionnel.** Nature(s) du projet → **badges** dans l'en-tête (un projet peut en cumuler plusieurs). **Liste ouverte** (voir ci-dessous). Absent ou `[]` = aucun badge. |
| `platforms` | `{ store, url }[]`          | **Optionnel.** Plateformes de distribution → **liens cliquables** (icône store) dans l'en-tête. `store` est une **liste ouverte** (`"web"`, `"ios"`, `"android"`…). Absent ou `[]` = aucun lien. **Remplace l'ancien champ `demo`** (un lien `demo` devient `{ store: "web", url }`). |
| `repo`     | string (URL) ou `null`       | Lien code (distinct des plateformes) → section "Liens". `null`/`""` = pas affiché. |

> Les couleurs d'icônes sont **fixes** (indépendantes de l'accent) : `pro` = **ambre**,
> `perso` = **teal**. Changer l'accent ne les modifie pas. (L'accent par défaut étant
> teal, l'icône perso a la même couleur que l'accent par défaut — c'est normal.)

### Le champ `status`

Le `status` est une chaîne libre affichée :

- en **badge coloré** sur la fiche projet (mode Preview), à côté du badge type + année ;
- sous forme de **pastille** colorée à droite du nom de fichier dans l'explorateur ;
- tel quel dans la **vue Raw** (puisqu'il fait partie de l'objet JSON).

Valeurs reconnues et code couleur (défini dans `src/lib/status.js`) :

| Valeur            | Couleur du badge |
| ----------------- | ---------------- |
| `"En ligne"`      | 🟢 vert          |
| `"En cours"`      | 🟠 orange/jaune  |
| `"En test fermé"` | 🟠 orange/jaune  |
| `"Prototype"`     | 🟠 orange/jaune  |
| `"Archivé"`       | ⚪ gris           |

Toute autre valeur s'affiche en **gris** (neutre). Pour ajouter une valeur ou
changer une couleur : édite les listes dans `src/lib/status.js` et les variables
`--status-green` / `--status-warn` / `--status-gray` en haut de `src/styles.css`.

### Le champ `kinds` (nature du projet)

`kinds` est un **tableau** : un projet peut avoir **plusieurs natures** à la fois
(ex. une app à la fois `webapp` et `app-native`). Chaque valeur s'affiche en
**badge** dans l'en-tête de la fiche, à côté du badge type/année et du statut.

C'est une **liste ouverte** : tu peux mettre **n'importe quelle valeur**, elle
s'affichera. Valeurs déjà utilisées :

| Valeur            | Libellé affiché |
| ----------------- | --------------- |
| `"site-vitrine"`  | Site vitrine    |
| `"webapp"`        | Web app         |
| `"app-native"`    | App native      |
| `"automatisation"`| Automatisation  |

Le libellé est dérivé automatiquement (majuscule + tirets remplacés par des
espaces) pour toute valeur inconnue ; `src/lib/kinds.js` ne contient qu'une
petite table d'embellissement pour les libellés ci-dessus (ex. `webapp` →
« Web app »). Pas besoin de toucher au code pour ajouter une nature : il suffit
de l'écrire dans `kinds`. Absent ou `[]` = aucun badge.

### Le champ `platforms` (où c'est distribué)

`platforms` est un **tableau d'objets** `{ "store": "...", "url": "..." }`. Chaque
entrée devient un **lien cliquable** (icône + libellé) dans l'en-tête de la fiche,
ouvert dans un nouvel onglet. C'est ici qu'on met le lien **public** vers le
produit (site en ligne, fiche App Store, fiche Play Store).

`store` est une **liste ouverte**. Stores reconnus (avec icône dédiée) :

| `store`     | Icône          | Libellé   |
| ----------- | -------------- | --------- |
| `"web"`     | 🌐 globe       | Web       |
| `"ios"`     | 🍎 pomme       | iOS       |
| `"android"` | ▶️ triangle Play | Android |

Un `store` inconnu reste affiché : il utilise une **icône générique de lien
externe** et un libellé dérivé automatiquement (`src/lib/platforms.js`). Pour
ajouter une vraie icône à un nouveau store, ajoute-la dans `src/components/icons.jsx`
et référence-la dans la table `STORE_ICONS` de `src/components/ProjectView.jsx`.

> **Migration depuis `demo`** : l'ancien champ `demo` (lien démo unique) n'existe
> plus. Un lien démo devient une entrée `platforms` avec `store: "web"`. Le champ
> `repo` (lien code) est **inchangé** et reste affiché dans la section « Liens ».

### Résultats : chiffres (`metrics`) ou faits qualitatifs (`highlights`)

Deux façons, complémentaires, de présenter les résultats d'un projet — **les deux
sont optionnels** :

- **`metrics`** — des paires `{ label, value }` **chiffrées**, rendues dans la
  section **"Résultats"** (tableau). Pour ce qui se mesure : « -40 % », « 1 200
  utilisateurs », « 7 pages »…
- **`highlights`** — une **liste de chaînes** qualitatives, rendues dans la
  section **"Points clés"** (liste à puces). Pour ce qui se raconte plutôt qu'il
  ne se chiffre : « conformité RGPD sans tracker tiers », « backend sur-mesure »…

Un projet peut avoir **les deux** sections, **une seule**, ou **aucune**. Une
section dont le tableau est absent ou vide (`[]`) n'est **jamais** affichée.

### Affichage Preview / Raw (toutes les pages)

**Chaque page de contenu** de l'éditeur (README, fiche projet, fiche outil, et
toute page future) propose un toggle **Preview / Raw** en haut à droite, plus une
gouttière/coloration et un **bouton copier** en vue Raw. Le mécanisme est
**mutualisé** dans [`src/components/ContentPage.jsx`](src/components/ContentPage.jsx)
(toggle) et [`src/components/RawView.jsx`](src/components/RawView.jsx) (rendu brut
+ copie) : il n'est **pas re-codé page par page**.

- **Preview** : le rendu lisible (markdown stylé, badges, etc.).
- **Raw** : la **source brute** de la page, selon son format :
  - **données structurées** — **projet**, **outil**, **changelog**, **services** et
    **status** → **JSON** source (coloré, avec numéros de ligne) ;
  - **prose** — **README** et **À propos** → le **markdown source** (ce n'est pas
    du JSON) ;
  - une future page d'un autre format afficherait **sa** source brute.
- **Bouton copier** (coin haut-droite du bloc Raw) : copie le contenu brut affiché
  (JSON ou markdown) dans le presse-papier, avec un bref retour visuel (icône
  « check » ~1,5 s). Focusable au clavier + `aria-label`.

> **Ajouter une page** : enveloppe son rendu dans `ContentPage` en lui passant
> `preview` (React), `rawText` (la source) et `rawFormat` (`"json"`, `"markdown"`,
> …). Elle hérite alors automatiquement de Preview/Raw et du bouton copier.

### Le graphe se met à jour tout seul

Le portfolio a trois vues, basculables depuis la barre d'activité à gauche :
l'**IDE** (onglets + fiches), le **Graph** (icône en forme de réseau) et l'**API**
(icône accolades `{ }`, voir « La vue API » plus bas).

La vue Graph est **entièrement auto-générée depuis `projects.json`** — il n'y a
**rien à maintenir à la main** :

- chaque projet devient un nœud (ambre si `pro`, teal si `perso`) ;
- chaque techno unique listée dans les `stack` devient un nœud outil (bleu) ;
- un lien est créé entre un projet et chacune de ses technos ;
- un outil partagé par plusieurs projets a donc plusieurs liens et grossit :
  on repère d'un coup d'œil les technos centrales.

Concrètement : **ajoute un projet dans `projects.json`, et le graphe se reconstruit
automatiquement** (nouveaux nœuds, nouveaux liens, fusion des outils déjà présents).
Aucune position ni aucun nœud n'est codé en dur.

Interactions dans le graphe :

- **Déplacer les nœuds** : chaque nœud se glisse individuellement à la souris.
  Ses liens suivent, les autres nœuds ne bougent pas, et la position est
  conservée là où on le lâche (pas de re-placement automatique). Pratique pour
  regrouper manuellement des projets autour d'un outil. Glisser sur le **fond**
  déplace (pan) tout le canvas ; la molette zoome.
- **Simple clic = focus** : sur un projet OU un outil, on n'affiche plus que ce
  nœud, ses voisins directs et les liens entre eux ; tout le reste disparaît.
  Re-cliquer le même nœud, ou cliquer dans le vide, réaffiche tout.
- **Double-clic sur un projet = ouvrir la fiche** : bascule en vue IDE et ouvre
  l'onglet du projet. (Les outils n'ont pas de fiche : juste le focus.)
- **Barre de filtres** (au-dessus du canvas) :
  - les boutons **Tous / Pro / Perso / Outils** affichent ou masquent ces
    catégories de nœuds ;
  - le champ de **recherche** ne garde que les nœuds dont le nom contient la
    saisie (et leurs voisins directs) ;
  - filtres et focus se combinent.

### Le panneau Outils (et les fiches outil)

La barre d'activité de gauche propose, **entre l'explorateur (fichiers) et la
recherche**, une icône **Outils** (un paquet). Elle remplace l'arborescence de
fichiers par la **liste de tous les outils** :

- les outils sont **déduits automatiquement des `stack`** de tous les projets
  (même source que le graphe, **rien en dur**) ;
- le libellé de section **OUTILS** affiche un **compteur** = nombre d'outils
  uniques (dérivé de la même source que la liste, donc toujours à jour) ;
- chaque outil affiche son nom + un badge indiquant **le nombre de projets** qui
  l'utilisent ;
- les outils sont **groupés par catégorie** (champ `category` de l'outil) dans des
  **dossiers repliables**, comme les dossiers `pro`/`perso` de l'explorateur :
  chaque groupe porte son nom + un compteur (nombre d'outils du groupe). L'ordre
  des groupes est **alphabétique par nom de catégorie**, le groupe **« Autres »**
  (outils sans `category`) toujours en **dernier** ; dans chaque groupe, les outils
  sont triés **alphabétiquement par label**. Les catégories sont **dérivées de la
  donnée** : une nouvelle valeur de `category` dans le JSON crée son groupe
  automatiquement (rien en dur).

> L'explorateur de fichiers suit la même logique : son libellé de section
> **PAGES** porte un compteur = **les pages système** (README + about-me +
> CHANGELOG + services + status) **+ tous les projets** (pro + perso), dérivé
> dynamiquement.

**Cliquer un outil ouvre un onglet** (comme un projet : fermable, pas de doublon)
avec une fiche détail : breadcrumb `tools › nom`, le nom en titre, une méta
« Utilisé dans X projet(s) », une éventuelle description, puis la section
**Projets** listant les projets concernés (titre + badge `pro`/`perso` + oneliner).
Cliquer un projet dans cette liste **ouvre sa fiche** (même système d'onglets).

#### Outils : système id / label

Les outils sont identifiés par un **id stable** (slug minuscule, tirets pour les
espaces : `github-pages`), **pas par leur nom d'affichage**. Cela permet de
renommer un outil (le label) sans casser les références dans les projets.

Deux endroits travaillent ensemble :

1. **La map `tools`**, dans son **fichier dédié** [`src/tools.json`](src/tools.json)
   (au même rang que `changelog.json`, `services.json`, `status.json` — c'est de la
   donnée versionnée à part) : une **map `id` → métadonnées** de l'outil. Le fichier
   entier **est** cette map (pas d'enveloppe).

   ```json
   {
     "flutter": {
       "label": "Flutter",
       "category": "frontend",
       "description": "Framework UI multiplateforme de Google (Dart).",
       "url": "https://flutter.dev",
       "logo": "/logos/flutter.svg",
       "color": "#02569B"
     },
     "css": { "label": "CSS", "category": "frontend", "description": "", "url": "", "logo": "", "color": "" }
   }
   ```

   | Clé           | Rôle                                                                 |
   | ------------- | -------------------------------------------------------------------- |
   | _(la clé)_    | **id** de l'outil (slug minuscule). C'est lui qu'on met dans `stack`.|
   | `label`       | **Obligatoire.** Nom affiché partout (chips, graphe, fiche outil).   |
   | `category`    | Optionnel. **Id minuscule** (slug) de la catégorie de regroupement dans le **panneau Outils** (dossier repliable) ; le **libellé affiché** est dérivé (ex. `no-code` → « No-code »). Absent/vide = groupe **« Autres »**. |
   | `description` | Optionnel. Affiché en section « Description » de la fiche outil (vide/absent = masqué). |
   | `url`         | Optionnel. Affiché en chip « Site officiel ↗ » sur la fiche outil.   |
   | `logo`        | Optionnel. Chemin du logo SVG (voir « Logos » ci-dessous).          |
   | `color`       | Optionnel. Couleur de marque (hex, ex `#4353FF`) servant de fond à la pastille du logo. Vide = fond gris neutre. |

#### Logos des outils

Les logos vivent dans **`public/logos/`** et sont **nommés d'après l'id** de
l'outil : `public/logos/<id>.svg` (ex. id `webflow` → `public/logos/webflow.svg`).
Le champ `logo` pointe vers ce fichier avec un chemin absolu depuis la racine
publique : `"/logos/webflow.svg"`.

Le rendu force le logo en **blanc** (filtre CSS, quel que soit le SVG d'origine),
centré avec un peu de padding, sur un fond rempli de la couleur `color` de l'outil
(gris neutre si `color` est vide). La **forme du fond** dépend de l'emplacement :

| Emplacement                | Forme du fond              | Taille |
| -------------------------- | -------------------------- | ------ |
| Fiche outil (éditeur)      | cercle                     | ~36px  |
| Nœuds du graphe            | cercle                     | ~32px  |
| Panneau Tools (sidebar)    | carré à coins arrondis (4px) | ~18px |

Si `logo` est **vide/absent**, la pastille affiche à la place l'**initiale du
label** (première lettre, en majuscule, blanche, monospace, centrée) sur le même
fond coloré — `color` si défini, sinon gris neutre. Mêmes formes et tailles que
les vrais logos (cercle en fiche outil, carré arrondi en sidebar). Ainsi un outil
sans logo reste identifiable visuellement, sans icône générique.

2. **Le `stack` de chaque projet** contient des **ids**, pas des noms :

   ```json
   "stack": ["flutter", "supabase", "github-pages"]
   ```

**Résolution** : partout où un outil s'affiche (chips de stack, nœuds du graphe,
panneau Outils, fiche outil), l'id est résolu vers son `label` via la map `tools`.
Les comptages « utilisé dans X projets » et les liens du graphe se basent sur
l'**id**. Si un id présent dans un `stack` n'existe pas dans `tools`, l'app
affiche **l'id tel quel** (fallback, pas de crash) et logge un avertissement dans
la console.

#### Ajouter un nouvel outil

1. Crée une entrée dans [`src/tools.json`](src/tools.json) avec un **id** unique et au moins un `label`
   (et, si tu as le logo, dépose `public/logos/rust.svg` puis renseigne `logo`/`color`) :
   ```json
   "rust": { "label": "Rust", "category": "backend", "description": "", "url": "", "logo": "/logos/rust.svg", "color": "#DEA584" }
   ```
2. Référence cet **id** dans le `stack` des projets concernés (dans `projects.json`) :
   ```json
   "stack": ["rust", "supabase"]
   ```

C'est tout : l'outil apparaît automatiquement dans le panneau Outils, le graphe et
les chips de stack, avec son label. La map `tools` reste optionnelle dans l'absolu
(un id non déclaré s'affiche en fallback), mais déclarer chaque outil est
recommandé pour avoir des labels propres et les métadonnées.

### Source Control (historique git)

La barre d'activité propose, **sous la recherche** (convention VS Code), une icône
**Source Control** (la branche git). Elle remplace l'arborescence par un **faux
historique git** : une timeline des projets présentée comme un `git log`. C'est
**purement narratif** — il n'y a **aucun vrai git** derrière, tout est dérivé de
`projects.json`.

- la liste des « commits » = **tous les projets**, triés par **année décroissante**,
  puis par `id` (ordre **stable et déterministe**, jamais de hasard) ;
- chaque ligne affiche un **hash court** (7 caractères hex), le `name` du projet
  (le slug nu, sans extension) comme **message de commit**, un **badge** `pro`/`perso` (mêmes couleurs que les
  icônes de l'explorateur : ambre / teal) et l'**année** en méta ;
- le libellé de section **HISTORIQUE** porte un **compteur** = nombre de commits =
  nombre de projets (dérivé de la même source que les compteurs PROJETS / OUTILS) ;
- un en-tête décoratif **« main »** (statique) rappelle la branche en haut du panneau.

> **Le hash est déterministe** : il est calculé comme une **fonction pure de l'`id`**
> du projet (petit hash FNV-1a tronqué à 7 caractères, voir
> [`src/lib/history.js`](src/lib/history.js)). Il est **purement cosmétique** et **ne
> change jamais** d'un reload à l'autre. Renommer un titre ne change pas le hash ;
> seul l'`id` le détermine.

**Cliquer un commit** (ou **Entrée**) **ouvre la fiche projet** — exactement la même
action que cliquer le projet dans l'explorateur (même système d'onglets, pas de
doublon, focus déplacé vers le contenu). Aucune logique d'ouverture n'est re-codée.

**Zéro contenu en dur** : ajouter un projet dans `projects.json` l'ajoute
automatiquement à l'historique (nouveau commit, hash dérivé, compteur à jour). Le
panneau est repris dans la **rangée d'onglets du drawer mobile** (onglet « Git »),
comme les autres panneaux.

### La vue API

La barre d'activité propose, **entre les Jeux/Source Control et le Graph**, une icône
**API** (accolades `{ }`). C'est un petit **client REST jouable** : le portfolio
expose ses données (projets, outils, profil, stats) comme une API, qu'on interroge
depuis une console intégrée.

> **Fausse API, 100 % côté client.** Aucune vraie requête réseau : tout est calculé
> à partir de `projects.json`. L'API est **en lecture seule** (méthode `GET`
> uniquement) — rien n'est jamais modifié.

#### La zone principale : trois onglets internes

La zone principale a sa **propre barre d'onglets** (interne à la vue API, sans
rapport avec les onglets de fichiers de l'éditeur) : **Console**, **Documentation**
et **Logs**. On bascule à la souris ou au clavier (flèches gauche/droite, Entrée).

- **Console** — l'outil principal :
  - **Zone requête** : un champ où l'on tape une requête, par exemple
    `GET /projects?type=pro`, puis **Entrée** (ou le bouton **Send**).
  - **Autocomplétion** : pendant la frappe, un menu suggère ce qui est valide à ce
    point précis — la méthode (`GET`), les ressources (`/projects`, `/tools`,
    `/profile`, `/stats`), puis les **ids réels** des projets (`/projects/…`) et des
    outils (`/tools/…`). Tout est **dérivé** des endpoints et de `projects.json` :
    rien n'est codé en dur (un projet ajouté au JSON apparaît tout seul dans les
    suggestions). Clavier : **↑ / ↓** naviguer, **Tab** compléter, **Entrée** =
    *compléter* tant que le menu est ouvert (jamais d'exécution accidentelle) puis
    *exécuter* une fois le menu fermé, **Échap** ferme le menu sans rien effacer.
    Choisir une suggestion **complète le champ sans exécuter** : on continue de
    taper ou on appuie sur Entrée. (v1 : chemins et ids ; la complétion des filtres
    `?type=`/`?kind=` viendra ensuite.)
  - **Zone réponse** : une ligne de statut (méthode + code HTTP, **colorée** — vert
    pour `2xx`, orange pour `4xx`) suivie du **corps JSON** (coloré, avec numéros de
    ligne et un **bouton copier**).
  - Avant la première requête, un écran d'accueil invite à essayer `GET /projects`.
- **Documentation** — la doc de l'API dans un rendu **inspiré de Swagger UI** :
  un encart en tête rappelle que l'API est **en lecture seule** (`GET` uniquement) ;
  les endpoints sont groupés par ressource (Projects / Tools / Profile / Changelog /
  Services / Status / Stats),
  chaque endpoint étant une **carte dépliable** légèrement **teintée par sa méthode**
  (badge de méthode, chemin, description). Au dépli, deux bandes distinctes :
  - **Paramètres** : chaque paramètre avec son tag **requis** (segment de chemin
    `:id`) ou **optionnel** (filtre de query) et ses valeurs possibles ; « Aucun
    paramètre » si l'endpoint n'en prend pas.
  - **Réponses** : un petit **tableau Code / Description** (codes colorés, dérivés
    de la forme de l'endpoint : `200` toujours, `400` si filtres, `404` si `:id`)
    suivi d'un **exemple de réponse** (corps JSON réel, avec coloration, numéros de
    ligne et bouton copier).

  Chaque carte porte un bouton **« Essayer dans la console »** qui **bascule sur
  l'onglet Console** en **pré-remplissant** le champ avec l'URL d'exemple de
  l'endpoint, **sans l'exécuter** (on appuie ensuite sur Entrée) — exactement comme
  un clic dans la sidebar. La doc ne fait **rien exécuter** elle-même : la Console
  reste le seul lieu d'exécution. Tout est **généré depuis la même source** que les
  endpoints — jamais une liste à maintenir à la main.
- **Logs** — l'historique des requêtes de la **session** (méthode + chemin + code
  coloré, plus récent en tête). **Cliquer une ligne ouvre un panneau de détail à
  droite** (statut, chemin complet, query, corps JSON + bouton copier) — **sans
  rejouer** la requête. Un bouton **« Rejouer »** dans ce détail (et lui seul)
  ré-exécute la requête. Le panneau de détail reste **dans la zone éditeur** (il ne
  déborde jamais sur la barre latérale) ; sur un écran étroit il s'empile sous la
  liste. Fermeture au bouton × ou avec **Échap**. L'historique se vide au
  rechargement de la page (rien n'est stocké).

#### Les routes disponibles

| Requête | Effet |
| --- | --- |
| `GET /projects` | Tous les projets. `?type=pro\|perso` filtre par type ; `?kind=webapp` filtre par nature ; `?stack=webflow` filtre par outil (id de stack). Les filtres se **combinent** (`?type=pro&stack=webflow`). |
| `GET /projects/:id` | Un projet par son id (id inconnu → `404`). |
| `GET /tools` | Tous les outils. `?category=no-code` filtre par catégorie. |
| `GET /tools/:id` | Un outil et les projets qui l'utilisent (id inconnu → `404`). |
| `GET /profile` | Le profil (identité + liens). |
| `GET /changelog` | L'historique des versions (antéchronologique). `?category=added\|changed\|fixed` ne garde que les versions concernées **et** ne renvoie que cette catégorie dans chaque entrée. |
| `GET /services` | Tous les services proposés. `?stack=webflow` filtre par outil (id de stack). |
| `GET /services/:id` | Un service par son id (id inconnu → `404`). |
| `GET /status` | L'état des composants du portfolio (status page) + le statut global agrégé. |
| `GET /stats` | Compteurs **calculés** : nb de projets, répartition pro/perso, nb d'outils, etc. |

Les **codes d'erreur** : méthode autre que `GET` → `405`, route inconnue → `404`,
valeur de filtre invalide → `400`. La réponse est toujours un JSON cohérent (les
erreurs aussi : `{ error, message }`).

> **Forme des réponses-liste.** Les endpoints qui renvoient une **liste**
> (`GET /projects` et ses variantes filtrées, `GET /tools`, `GET /services`)
> répondent avec une **enveloppe** `{ "count": N, "results": [ … ] }` — `count`
> est le nombre d'éléments retournés (dérivé, donc cohérent avec les filtres). Les
> endpoints qui renvoient un **objet unique** (`/projects/:id`, `/tools/:id`,
> `/services/:id`, `/profile`, `/status`, `/stats`) renvoient cet objet **tel
> quel**, sans enveloppe.

#### La sidebar API (les endpoints)

La sidebar ne contient qu'une seule section : **Endpoints** — la liste, **groupée
par ressource** (Projects / Tools / Profile / Changelog / Services / Status / Stats)
dans des dossiers repliables
(mêmes que l'explorateur). **Cliquer un endpoint pré-remplit** le champ de la
console avec une URL d'exemple, **sans l'exécuter** (et bascule sur l'onglet
Console) : on appuie ensuite sur Entrée. La documentation et les logs ne sont plus
dans la sidebar — ils vivent dans les onglets internes de la zone principale.

> **Tout part d'un seul fichier** : [`src/lib/api-endpoints.js`](src/lib/api-endpoints.js)
> définit chaque endpoint **avec sa logique** (un `handler` qui lit `projects.json`).
> La console, la sidebar **et** l'onglet Documentation lisent **cette même source** —
> pour ajouter ou modifier un endpoint, on touche **uniquement** ce fichier,
> exactement comme le reste du portfolio est piloté par `projects.json`. Le routage
> et les codes de status vivent dans [`src/lib/api-engine.js`](src/lib/api-engine.js).

La vue API **fonctionne sur mobile** : la sidebar reste la liste d'endpoints, et la
zone principale garde ses onglets internes (console = champ + réponse empilés ; le
détail des logs s'empile sous la liste). Elle apparaît dans la rangée d'onglets du
drawer (onglet « API »).

### Navigation mobile (sous 720px)

Sous **720px**, l'activity bar verticale est masquée. La sidebar devient un
**drawer coulissant** ouvert par le bouton **« ☰ Explorer »** de la title bar.

Pour ne jamais se retrouver coincé, le drawer affiche en haut une **rangée
d'onglets** qui remplace l'activity bar : **Explorer / Tools / Recherche / Git / API / Graph**.
On peut donc basculer entre tous les panneaux à tout moment (le panneau actif est
surligné, et changer de panneau ne ferme pas le drawer).

**Le Graph n'est pas disponible sur mobile** : un graphe de nœuds est
inexploitable sur petit écran. L'onglet Graph reste visible, mais au lieu du
canvas il affiche un message expliquant qu'il faut un écran d'au moins 720px,
avec un bouton **« Ouvrir le panneau Tools »** (le panneau Tools donne la même
information « quels projets utilisent quel outil », en version lisible sur
mobile). Dans ce cas, le code de la vue graphe (React Flow) **n'est pas chargé**.

Au-dessus de 720px, rien ne change : activity bar complète et Graph pleinement
fonctionnel.

### Palette de commandes (Ctrl/Cmd+K)

Une **palette de commandes** façon VS Code s'ouvre avec **Ctrl+K** (ou **Cmd+K**
sur Mac) : une modale centrée en haut de l'écran avec un champ de recherche
(focus automatique à l'ouverture). On y accède à tout sans la souris.

> Pas de Ctrl+P : ce raccourci est réservé à l'impression du navigateur, on n'y
> touche pas.

**Ce qu'elle liste** — la liste est **entièrement auto-dérivée de
`projects.json`** (même source que le graphe et le panneau Tools), donc rien
n'est codé en dur : un projet ou un outil ajouté au JSON y apparaît
automatiquement. On y trouve :

- **tous les projets** → ouvre la fiche projet (même onglet que l'explorateur) ;
- **tous les outils** (déduits des `stack`, résolus via la map `tools`) → ouvre
  la fiche outil (même action que le panneau Tools) ;
- **les actions** : ouvrir le README, ouvrir les Paramètres, basculer la vue
  IDE / Graphe, basculer le thème clair / sombre.

La palette ne **re-code aucune** de ces ouvertures : elle appelle les mêmes
fonctions que la sidebar, le panneau Tools et les Paramètres (mêmes gardes, **pas
de doublon d'onglet**).

**Recherche** : fuzzy/substring sur le libellé. Le préfixe **`>`** ne liste que
les **actions** (convention VS Code) ; sans préfixe, tout est listé.

**Navigation clavier** : **↑/↓** déplacent la sélection, **Entrée** ouvre/exécute,
**Échap** ferme. La souris fonctionne aussi (survol = sélection, clic = exécution).

**Point d'entrée mobile** : sous 720px le raccourci clavier n'a pas de sens au
doigt. Un **bouton dédié dans la title bar** (icône « invite de commande », à
droite) ouvre la même palette. Il reste visible sur desktop comme rappel du
raccourci.

#### Accessibilité (et l'exception focus trap)

- La palette est une `role="dialog"` + `aria-modal`, avec un `aria-label`.
- Le champ est une **combobox** (`role="combobox"`), la liste une
  `role="listbox"`, chaque ligne une `role="option"` (`aria-selected` sur
  l'active) reliée au champ via `aria-activedescendant`.
- **Exception assumée à la règle « jamais de focus trap »** : partout ailleurs le
  focus n'est jamais piégé (Tab finit toujours par sortir vers le navigateur).
  La palette **déroge** à cette règle parce que c'est une **modale temporaire** :
  tant qu'elle est ouverte, le focus est **piégé dedans** (Tab neutralisé).
  **Échap** (ou un clic dans le vide, ou l'exécution d'une commande) la ferme et
  **rend le focus** à l'élément qui l'avait avant l'ouverture. Une fois fermée,
  on retombe sur le comportement global **sans piège**.
- Focus visible cohérent (`:focus-visible`), thème clair **et** sombre via les
  variables CSS existantes (la ligne sélectionnée utilise `--accent`).

### Modifier le profil

Le bloc `profile` en haut du JSON alimente l'onglet **README** (nom, rôle,
tagline, localisation, email, liens GitHub/LinkedIn de la section « Me contacter »).

```json
"profile": {
  "name": "Ton Nom",
  "role": "Ton rôle",
  "tagline": "Ta phrase d'accroche.",
  "location": "Ta ville",
  "email": "toi@exemple.com",
  "links": {
    "github": "https://github.com/toi",
    "linkedin": "https://www.linkedin.com/in/toi"
  },
  "experiences": [
    {
      "period": "2020 — aujourd'hui",
      "role": "Ton poste actuel",
      "context": "Entreprise / contexte",
      "description": "Ce que tu y fais, en une phrase."
    }
  ]
}
```

#### Le champ `experiences[]` (timeline de la page À propos)

`experiences` est un **tableau d'objets** `{ period, role, context, description }`
qui alimente la **timeline en cartes** de la page **À propos** (`about-me.md`, voir
plus bas). L'**ordre du tableau est respecté** (mets le plus récent en haut). Modifie
la liste et les cartes se mettent à jour automatiquement — **rien n'est codé en
dur** dans la page. Comme c'est dans `profile`, ces expériences sont aussi
renvoyées par `GET /profile` (cf. « La vue API »). Absent ou `[]` = section masquée.

### Le contenu du README (objet `readme`)

La page d'accueil (onglet **README**) est pilotée par un objet **`readme`** au
niveau racine de `projects.json` (à côté de `profile` et `projects`) :

```json
"readme": {
  "intro": "Qui je suis, en 2-3 phrases.",
  "approach": "Mon approche et ce qui me distingue.",
  "navigation": "Comment explorer ce portfolio."
}
```

- Chaque champ est du **markdown** (gras, `code inline`, listes…) rendu au thème.
- `intro` → section « Qui je suis », `approach` → « Mon approche »,
  `navigation` → « Naviguer ce portfolio ». Un champ vide masque sa section.
- L'en-tête (nom, rôle, localisation, tagline) vient de `profile` ; la section
  **« Me contacter »** (email + bouton copier, GitHub, LinkedIn) est générée depuis
  `profile.email` et `profile.links`.
- Le fichier livré contient des **placeholders entre crochets** dans `intro` et
  `approach` : remplace-les par tes vrais textes (le parcours n'est pas inventé).

### La page À propos (`about-me.md`)

À côté du README, l'explorateur propose une page **À propos** (`about-me.md`),
**toujours visible** (fichier système, comme README). On l'ouvre aussi via la
**palette de commandes** (Ctrl/Cmd+K → « Ouvrir À propos »). C'est une page de
contenu classique : elle hérite du toggle **Preview / Raw** et du bouton copier
(comme toutes les pages de l'éditeur). Le **Raw** est le markdown source de la page.

Elle se compose de trois parties :

1. **Carte d'identité** — en-tête scannable : le **nom** et le **rôle** sont
   dérivés de `profile` (`name`, `role`), suivis d'une ligne méta de présentation
   (localisation, années de pratique, outils phares).
2. **Récit en prose** — un texte de présentation (markdown). Ce texte « vit dans
   la page » (c'est de la présentation, pas de la donnée structurée) : pour le
   modifier, voir les constantes `ABOUT_PROSE` / `ABOUT_IDENTITY` dans
   [`src/lib/markdown.js`](src/lib/markdown.js).
3. **Timeline d'expériences** — une **carte par expérience**, lue depuis
   `profile.experiences` (voir « Le champ `experiences[]` »). **Aucune donnée en
   dur** : modifie le tableau dans `projects.json` et les cartes suivent (même ordre).

### Le changelog (`changelog.json` + `GET /changelog`)

L'explorateur propose une page **changelog.json** (à côté de README et about-me),
**toujours visible** (fichier système). On l'ouvre aussi via la **palette de
commandes** (Ctrl/Cmd+K → « Ouvrir le CHANGELOG »). C'est une page de contenu
classique : toggle **Preview / Raw** + bouton copier. Comme le changelog est de la
**donnée structurée** (pas de la prose), le **Raw** affiche le **JSON source**
(`changelog.json`), coloré et numéroté, **exactement comme une fiche projet** — son
extension est d'ailleurs `.json`, pas `.md` (README/about, eux, restent du markdown).

Le contenu vient d'un fichier **dédié** : [`src/changelog.json`](src/changelog.json)
(distinct de `projects.json` — c'est de la donnée versionnée à part). C'est un
**tableau, du plus récent au plus ancien** (la version la plus récente en haut du
fichier). Chaque entrée :

```json
{
  "version": "1.11.0",
  "date": "2026-06-18",
  "changes": {
    "added": ["Une nouveauté"],
    "changed": ["Un changement de comportement"],
    "fixed": ["Une correction"]
  }
}
```

| Champ     | Type                 | Notes                                                                 |
| --------- | -------------------- | --------------------------------------------------------------------- |
| `version` | string (semver)      | `major.minor.patch`.                                                  |
| `date`    | string **optionnel** | `AAAA-MM-JJ`. **À omettre si la date est inconnue** (pas de `null` ni de chaîne vide). |
| `changes` | objet                | N'inclure **que les catégories non vides**.                           |

**Catégories** reconnues : `added` (Ajouté), `changed` (Modifié), `fixed`
(Corrigé). La liste est **extensible** : `removed`, `deprecated` et `security`
sont déjà prévues (libellé + couleur), et **toute autre clé** s'affiche aussi
(libellé dérivé, couleur neutre). Le rendu n'affiche **que les catégories
présentes** : une catégorie absente ne crée aucune section.

- **Preview** : un rendu **dense pleine largeur, façon journal** (groupé par
  version). Chaque version affiche son numéro (et la date à droite si présente),
  puis **une ligne par changement** : un **tag court** coloré (`ADD` = Ajouté,
  `CHG` = Modifié, `FIX` = Corrigé, `RM`, `DEP`, `SEC`) suivi du texte. Une
  **légende** en tête (tag = libellé) rappelle la signification ; elle ne liste
  que les catégories réellement utilisées et s'enrichit toute seule. Survoler un
  tag affiche aussi son libellé complet (tooltip).
- **API** : `GET /changelog` renvoie l'enveloppe `{ count, results }` (comme
  `/projects` et `/tools`). `?category=added` (ou `changed`/`fixed`/`removed`/
  `deprecated`/`security`) ne garde que les versions contenant cette catégorie
  **et** ne renvoie que cette catégorie dans chaque entrée. Toute **catégorie
  connue** est acceptée même si aucune version ne l'utilise encore (réponse
  `{ count: 0, results: [] }`, pas une erreur) ; seule une catégorie **inconnue**
  renvoie `400`.

Pour ajouter une version : ajoute un objet **en tête** du tableau dans
`changelog.json`. La page et l'API se mettent à jour automatiquement, et le
compteur de fichiers de l'explorateur suit.

### Les services (`services.json` + `GET /services`)

L'explorateur propose une page **services.json** (à côté de README, about-me et
changelog), **toujours visible** (fichier système). On l'ouvre aussi via la
**palette de commandes** (Ctrl/Cmd+K → « Ouvrir les Services »). C'est une page de
contenu classique : toggle **Preview / Raw** + bouton copier. Comme les services
sont de la **donnée structurée** (pas de la prose), le **Raw** affiche le **JSON
source** (`services.json`), coloré et numéroté, **exactement comme une fiche
projet** — son extension est `.json`, pas `.md`.

Le contenu vient d'un fichier **dédié** : [`src/services.json`](src/services.json)
(distinct de `projects.json`). C'est un **tableau de services** ; chaque entrée :

```json
{
  "id": "site-vitrine",
  "title": "Site vitrine & présence web",
  "tagline": "Un site vitrine professionnel, sur mesure et autonome.",
  "description": "…",
  "deliverables": ["Design sur mesure", "…"],
  "stack": ["webflow", "claudecode"],
  "forWho": "Indépendants, professions libérales, TPE/PME",
  "relatedProjects": ["karine-de-leusse"]
}
```

| Champ             | Type                | Notes                                                                        |
| ----------------- | ------------------- | ---------------------------------------------------------------------------- |
| `id`              | string              | Slug stable (sert d'`:id` à l'API).                                          |
| `title`           | string              | Titre du service (titre de la carte).                                       |
| `tagline`         | string              | Accroche courte (sous-titre).                                               |
| `description`     | string              | Paragraphe de présentation.                                                 |
| `deliverables`    | string[]            | Les prestations, affichées en liste.                                        |
| `stack`           | string[] (ids)      | Ids d'outils (mêmes que `projects.json`). **Peut être vide** → section masquée. |
| `forWho`          | string              | Cible (« Pour qui »).                                                        |
| `relatedProjects` | string[] (ids)      | Ids de projets de `projects.json`. **Peut être vide** ; id inconnu **ignoré**. |

- **Preview** : les cartes sont disposées en **grille à 2 colonnes** sur desktop
  (pour voir l'offre d'un coup) et repassent en **une seule colonne** sur tablette
  et mobile (≤ 900px). **Une carte par service** — titre + accroche, description,
  « Pour qui », prestations, puis (si renseignés) les **outils** en pastilles
  colorées **cliquables** (ouvrent la fiche outil) et les **projets liés** en
  boutons **cliquables** (ouvrent la fiche projet). Une carte sans outils ni
  projets liés (ex. *Audit, conseil & accompagnement*) omet simplement ces deux
  sections.
- **API** : `GET /services` renvoie l'enveloppe `{ count, results }` (comme
  `/projects` et `/tools`). `?stack=webflow` (ou tout autre id d'outil présent dans
  les services) ne garde que les services utilisant cet outil ; un id d'outil
  inconnu renvoie `400`. `GET /services/:id` renvoie le service brut (id inconnu →
  `404`).

Pour ajouter un service : ajoute un objet au tableau de `services.json` ; les
outils dans `stack` doivent exister dans la map `tools` de [`tools.json`](src/tools.json) (sinon
l'id s'affiche tel quel) et les `relatedProjects` doivent pointer des ids de projets
existants. La page et l'API se mettent à jour automatiquement.

### La page de statut (`status.json` + `GET /status`)

L'explorateur propose une page **status.json** (à côté de README, about-me,
changelog et services), **toujours visible** (fichier système). On l'ouvre aussi via
la **palette de commandes** (Ctrl/Cmd+K → « Ouvrir le Status »). C'est une fausse
**status page** dans l'esprit des status pages SaaS, mais détournée : les
« composants d'infrastructure » sont en réalité **les parties du portfolio**
(IDE Engine, Graph Renderer, API Gateway, Command Palette Service, Search Index,
Arcade Subsystem). Page de contenu classique : toggle **Preview / Raw** + bouton
copier. Comme le statut est de la **donnée structurée**, le **Raw** affiche le
**JSON source** (`status.json`), coloré et numéroté — extension `.json`, pas `.md`.

Le contenu vient d'un fichier **dédié** : [`src/status.json`](src/status.json) — un
objet `{ components, incidents }` :

```json
{
  "components": [
    { "id": "ide-engine", "name": "IDE Engine", "status": "operational", "uptime": 99.98 }
  ],
  "incidents": []
}
```

- **Preview** : en tête, un **bandeau global** affiche le statut agrégé (vert
  « Tous les systèmes sont opérationnels » quand tout va bien, sinon une pastille
  colorée reprenant le pire état du moment). En dessous, **la liste des composants** :
  chaque composant affiche son nom + un badge de statut coloré, puis la **barre
  d'historique sur 90 jours** typique des status pages (une rangée de petits
  segments colorés) et sa **légende** : `il y a 90 jours` (gauche) · `XX% uptime`
  (centre) · `aujourd'hui` (droite). La barre est purement **décorative** (pas de
  vraies données journalières) : ses couleurs reflètent le statut/uptime du
  composant. Enfin une **section incidents** : tant qu'il n'y en a aucun, elle
  affiche un état vide propre (« Aucun incident sur les 90 derniers jours »).
- **Statuts possibles** (set extensible) : `operational`, `degraded`,
  `partial-outage`, `major-outage`, `maintenance`. Chaque statut a son **libellé** et
  sa **couleur** (dérivée de la palette du thème, en clair comme en sombre) ; le sens
  passe par le **texte** du badge, pas seulement la couleur.
- **Un composant « dynamique »** : la plupart des composants ont un statut et un
  uptime **fixes** dans `status.json`. L'**Arcade Subsystem**, lui, est marqué
  *dynamique* — son uptime et son statut sont **calculés à l'exécution** (il reflète
  une partie « vivante » du site). Tant qu'il n'est pas pleinement actif, il tire le
  **bandeau global** vers un état dégradé ; c'est **voulu** (le portfolio invite à
  l'explorer). Dans la vue **Raw**, ce composant apparaît avec son marqueur (et non
  une valeur figée) : c'est la source brute.
- **API** : `GET /status` renvoie l'objet de statut **tel quel** (ressource unique,
  comme `/profile`), avec un champ `overall` = le statut global agrégé. Comme la
  page, l'API reflète l'état **calculé** de l'Arcade — les deux montrent le **même
  état**. `POST /status` (ou toute méthode autre que `GET`) → `405`.

Pour faire évoluer la page : modifie `status.json` (uptime/statut d'un composant,
ou ajout d'un composant). Le schéma d'incident est **déjà prévu** pour plus tard —
`{ id, title, status, date, resolution }` — la section incidents l'affichera en
timeline (avec l'ancienneté calculée depuis la date) dès qu'on remplira le tableau.

### Bouton « copier l'email »

À côté de l'email (section contact du README), un bouton **Copier** copie l'adresse
via `navigator.clipboard`, affiche **« Copié ! »** ~1,5 s puis revient à l'état
normal. Si l'API Clipboard est indisponible, un **repli** (`execCommand`) prend le
relais ; en cas d'échec, le bouton affiche brièvement « Échec ». Le bouton est
focusable au clavier et porte un `aria-label`, avec annonce vocale (`aria-live`).

### Image Open Graph / SEO

Le `<head>` de [`index.html`](index.html) contient le `<title>`, la
`meta description`, et les balises **Open Graph** + **Twitter Card**.

- **À faire** : créer une image de partage en **1200×630px** et la déposer dans
  **`public/og-image.png`** (référencée par `og:image` et `twitter:image`).
- **`og:url`** est un placeholder (`https://squirrel-dev.vercel.app`) : remplace-le
  par l'URL réelle après déploiement.

### Page 404 (route inconnue)

L'app **n'a pas de routeur** : elle est pilotée par onglets et vit à la racine
(`/`). Pour que les URL inconnues ne renvoient pas une erreur Vercel brute, deux
pièces travaillent ensemble :

1. **[`vercel.json`](vercel.json)** — un *rewrite SPA* renvoie **toute** route
   vers `index.html` (`"/(.*)" → "/index.html"`). On reste sur un build Vite
   standard ; c'est juste la règle de réécriture côté hébergeur.
2. **[`src/components/NotFound.jsx`](src/components/NotFound.jsx)** — comme l'app
   n'a aucune route cliente, **toute URL autre que `/` est inconnue**. Au
   démarrage, [`src/App.jsx`](src/App.jsx) compare `window.location.pathname` à
   `/` : s'il diffère, il affiche l'**écran 404** au lieu de l'app.

L'écran 404 est **thématique mais sobre** : un faux onglet `404.md`, un bloc
terminal `cat <chemin> → No such file or directory`, le titre **« Page
introuvable »** et un bouton **« ← Retour à l'accueil »**. Ce bouton remet l'URL
à `/` (`history.replaceState`, sans recharger) et réaffiche l'app sur le README.
Il est focusable au clavier avec focus visible (anneau d'accent global).

> **Personnaliser** : le texte, le titre et le faux onglet sont dans
> `NotFound.jsx` ; le style est dans le bloc « Page 404 » de
> [`src/styles.css`](src/styles.css), **uniquement via les variables de thème**
> (`--font-mono`, `--accent`, `--code-orange`…) — il s'adapte donc au thème clair
> **et** sombre sans retouche.

### Message console d'accueil

Au chargement, l'app écrit **une fois** dans la console du navigateur un petit
message d'accueil pour les devs qui ouvrent les devtools (ASCII art + accroche +
moyens de contact, stylé via `console.log('%c…', css)`). Il vit dans
[`src/lib/consoleGreeting.js`](src/lib/consoleGreeting.js) et est appelé **au
niveau module** dans [`src/main.jsx`](src/main.jsx) (donc une seule fois au
démarrage, pas à chaque render).

L'email et les liens GitHub/LinkedIn sont **dérivés de `profile`**
(`projects.json`) — **rien en dur**, même source que la section « Me contacter »
du README. Modifier `profile` met donc à jour le message console automatiquement.

---

## Paramètres (préférences d'affichage)

En **bas de la barre d'activité** (icône **engrenage**, façon VS Code), un bouton
ouvre un onglet **Settings** (comme une fiche projet : onglet fermable, sans
doublon). Sur mobile (sous 720px), l'engrenage est repris dans la rangée d'onglets
du drawer (« Réglages »), l'activity bar étant masquée.

Deux réglages pour l'instant :

- **Thème clair / sombre** — un interrupteur bascule entre les deux jeux de couleurs.
- **Couleur d'accent** — cinq pastilles prédéfinies (teal par défaut, bleu, violet,
  vert, ambre). Un lien « Réinitialiser » réapparaît dès qu'un accent non par défaut
  est choisi.

### Ce sont des préférences UTILISATEUR, pas du contenu

Ces réglages **ne vont pas dans `projects.json`**. Ils sont de l'état d'interface,
persisté dans le **`localStorage`** du navigateur via un contexte dédié
([`src/lib/preferences.jsx`](src/lib/preferences.jsx)) monté à la racine
([`src/main.jsx`](src/main.jsx)) — ainsi le thème/accent s'appliquent à toute l'app,
que l'onglet Settings soit ouvert ou non. Clés : `pref:theme` et `pref:accent`.

### Thème : par défaut, on suit le système

Tant que l'utilisateur **n'a pas touché** l'interrupteur, le thème **suit
`prefers-color-scheme`** du système (et réagit en direct s'il change). **Dès** qu'il
choisit manuellement, ce choix est persisté et on **arrête de suivre** le système.

### Comment c'est structuré (côté CSS)

- Le thème **sombre** est le `:root` par défaut de [`src/styles.css`](src/styles.css).
  Le thème **clair** est un **second jeu de variables** sous
  `:root[data-theme='light'] { … }` ; le contexte pose `data-theme` sur `<html>`.
  On **surcharge uniquement des variables**, jamais de patch au cas par cas.
- L'**accent** est appliqué au runtime en surchargeant `--accent` en inline sur
  `<html>`. `--tab-top-active` (liseré d'onglet actif) **dérive de `--accent`** et
  `--accent-status` (barre de statut) en est une variante assombrie via `color-mix`
  : elles **suivent l'accent choisi**.
- Les **icônes projets** `--icon-pro` (**ambre**) et `--icon-perso` (**teal**) sont
  au contraire **fixes** : elles ne suivent **pas** l'accent. `--icon-tool` (bleu)
  est également indépendant. (Accent par défaut = teal, donc l'icône perso coïncide
  avec l'accent par défaut — voulu.)
- Pour ajouter/retirer un accent : éditer `ACCENT_PRESETS` dans
  [`src/lib/preferences.jsx`](src/lib/preferences.jsx). Choisir des teintes de
  luminance proche du teal pour garder un bon contraste en clair **et** en sombre.
- **Icône de fichier à deux dimensions (forme ← extension, couleur ← type)** :
  l'icône d'un fichier combine **deux réglages indépendants**, appliqués de façon
  cohérente sur les **4 surfaces** où un fichier apparaît — onglets, explorateur,
  palette de commandes, recherche.
  - **Forme** = le **format**, dérivée de l'**extension** : `.json` → accolades
    `{ }` (fiches projet, changelog, services), `.exe` → manette (jeux), défaut /
    `.md` → document (README, about-me…). Un seul composant `FileTypeIcon` décide
    la forme : aucune surface ne la code en dur. Un `.json` affiche donc les
    accolades **quel que soit son rôle**.
  - **Couleur** = le **rôle**, dérivée du **type** : projets `pro` / `perso` →
    `--icon-pro` / `--icon-perso` ; jeux → `--icon-perso` ; **tout le reste**
    (README, about-me, changelog, services, et toute future page) → icône
    **système** (bleu `--icon-system`). À noter : un `.json` n'est **pas forcément
    un projet** — changelog/services sont des pages système, d'où leur couleur
    système malgré les accolades. Le **fallback ultime** est `--icon-system` : un
    type imprévu reste **visible** au lieu de disparaître.
  - Les **outils** (onglet/fiche) gardent leur **logo** et les **réglages** leur
    engrenage : rendus dédiés, hors de cette règle. Le **point de statut** coloré
    des fiches projet (explorateur) est **indépendant** de l'icône — inchangé.
  Une nouvelle page hérite donc automatiquement de la bonne forme **et** couleur.

### Pastilles d'outils en mode clair

Les logos d'outils sont forcés en **blanc** sur le fond `color` de l'outil (cf.
[ToolLogo](src/components/ToolLogo.jsx)). Les couleurs de marque étant en général
saturées/foncées, elles restent lisibles sur les deux thèmes. Le **fallback** sans
`color` (`--tool-badge-fallback`) reste un **gris suffisamment foncé en clair**
pour que la lettre/le logo blancs restent visibles. Si tu ajoutes un outil avec une
`color` très claire, prévois un logo lisible (ou laisse le fallback).

### Idées pour plus tard (non implémentées)

Notées en `TODO` dans [`src/components/SettingsView.jsx`](src/components/SettingsView.jsx) :
vue par défaut au chargement, taille de police de l'éditeur, ouvrir les liens dans un
nouvel onglet, réinitialisation globale des préférences.

---

## Accessibilité clavier

Le portfolio est entièrement utilisable au clavier, **sans jamais piéger le focus**
(Tab finit toujours par sortir vers le navigateur).

- **Skip link** : au tout premier `Tab`, un lien « Aller au contenu » apparaît en
  haut à gauche et saute directement à la zone éditeur (en sautant l'activity bar
  et la sidebar).
- **Onglets (pattern ARIA Tabs)** : la barre d'onglets est un `role="tablist"`,
  chaque onglet un `role="tab"` (`aria-selected` sur l'actif), relié à son contenu
  `role="tabpanel"` via `aria-controls` / `aria-labelledby`. Quand le focus est sur
  un onglet : **flèches gauche/droite** déplacent le focus (roving tabindex),
  **Entrée/Espace** activent l'onglet, et le bouton **×** de fermeture reste
  atteignable. Focus visible net (anneau teal).
- **Tab suit l'onglet actif** : seul le contenu de l'onglet **affiché** est dans le
  DOM, donc après les onglets, `Tab` entre dans le contenu réellement visible
  (les liens plateformes/repo de l'onglet actif sont atteignables). Les contenus des
  onglets inactifs ne sont pas rendus, donc jamais focusables.
- **Focus déplacé à l'ouverture** : activer un fichier dans l'explorateur ou un
  outil dans le panneau Tools (clic ou Entrée) déplace le focus vers le contenu
  qui vient de s'ouvrir (le tabpanel). L'usage souris n'est pas perturbé (focus
  programmatique, sans anneau visible).
- **Liens d'aide en fin de contenu** : à la toute fin de chaque onglet, deux liens
  masqués apparaissent au `Tab` :
  - **« ↑ Revenir au menu »** : redonne le focus au panneau actif de la sidebar
    (et ouvre le drawer sur mobile) ;
  - **« → Onglet suivant »** : affiché seulement s'il y a plus d'un onglet ouvert ;
    active l'onglet suivant (cycle) et lui donne le focus.

    Ce sont de vrais boutons, **pas un piège** : si on les ignore et continue au
    `Tab`, on sort normalement vers le navigateur.
- **Graph hors tabulation** : l'icône Graph de l'activity bar n'est pas atteignable
  au `Tab` (`tabindex="-1"`) — un graphe de nœuds n'a pas de parcours clavier utile
  — mais reste cliquable à la souris. Les autres icônes (Explorateur, Tools,
  Recherche, **API**, **Paramètres**) restent tabulables — l'API, elle, se navigue
  au clavier (liste d'endpoints).
- **Paramètres** : l'engrenage de l'activity bar est un bouton avec `aria-label`,
  tabulable et avec focus visible. Dans la page Settings, l'interrupteur de thème est
  un `role="switch"` (`aria-checked`), et les pastilles d'accent un
  `role="radiogroup"` de `role="radio"` (`aria-checked`, `aria-label` = nom de la
  couleur) — le tout focusable au clavier avec anneau `:focus-visible`.
- **Focus visible global** : tous les éléments interactifs (liens, boutons, items
  d'arborescence, items outils, toggle Preview/Raw, icônes de l'activity bar)
  reçoivent un anneau de focus net au clavier (`:focus-visible`, couleur d'accent),
  jamais supprimé sans remplacement.
- **ARIA des icônes** : les boutons-icônes sans texte (activity bar) portent un
  `aria-label`. Les icônes/logos décoratifs sont `aria-hidden`.

---

## 2. Lancer en local

```bash
npm install      # une seule fois
npm run dev      # serveur de dev → http://localhost:5173
```

Pour tester le build de production localement :

```bash
npm run build    # génère le dossier dist/
npm run preview  # sert dist/ → http://localhost:4173
```

---

## 3. Personnaliser le thème

Toutes les couleurs sont des variables CSS regroupées en haut de
[`src/styles.css`](src/styles.css), dans le bloc `:root`. Change par exemple
`--accent` (teal) ou `--icon-pro` / `--icon-perso` pour adapter la palette. Les
polices (`--font-mono`, `--font-sans`) y sont aussi.

> `--icon-pro` (ambre) et `--icon-perso` (teal) sont **fixes** : ils ne suivent
> **pas** l'accent. Changer l'accent (dans **Paramètres** ou via `--accent`) ne
> recolore donc pas les icônes pro/perso — modifie directement `--icon-pro` /
> `--icon-perso` pour ça.

Ici on modifie les **valeurs par défaut** (thème sombre = `:root`, thème clair =
`:root[data-theme='light']`). Pour basculer clair/sombre ou changer l'accent **sans
toucher au code**, voir la section **« Paramètres (préférences d'affichage) »** plus
haut — ces choix sont propres à chaque visiteur (localStorage).

---

## 4. Déployer sur Vercel

Le projet est un build Vite standard : aucune configuration supplémentaire n'est
nécessaire. Un fichier [`vercel.json`](vercel.json) ajoute juste un *rewrite SPA*
(toute route → `index.html`) pour que les URL inconnues passent par l'app (qui
affiche alors sa page 404, cf. « Page 404 »).

### Option A — depuis l'interface Vercel

1. Pousse le repo sur GitHub / GitLab / Bitbucket.
2. Sur [vercel.com](https://vercel.com), clique **Add New → Project** et importe le repo.
3. Vercel détecte automatiquement Vite :
   - **Framework Preset** : `Vite`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
4. Clique **Deploy**. C'est tout.

### Option B — depuis le CLI

```bash
npm i -g vercel
vercel           # déploiement de preview
vercel --prod    # déploiement en production
```

Chaque push sur la branche `main` redéploie automatiquement en production une fois
le projet relié à Vercel.
