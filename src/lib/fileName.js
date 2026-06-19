// Nom de fichier AFFICHÉ d'une page, avec l'extension qui reflète sa SOURCE BRUTE
// (vue Raw), pas son mode d'affichage. SOURCE UNIQUE pour la sidebar, les onglets
// et les breadcrumbs : une même entité affiche donc partout exactement le même
// nom (zéro divergence). Ne pas re-coder une extension en dur ailleurs.
//
//   projet (type 'pro' / 'perso') & outil ('tool')   -> .json
//       (leur vue Raw est le JSON de l'objet, cf. ProjectView / ToolView)
//   données structurées ('changelog', 'services')   -> .json
//       (ce sont de la DONNÉE, pas de la prose : leur vue Raw est le JSON source
//        — changelog.json / services.json — comme une fiche projet, pas du
//        markdown généré)
//   pages éditoriales / système en prose ('readme', 'about', 'konami',
//       'victory-snake', 'victory-memory', 'victory-squirrel') -> .md  (leur vue
//       Raw est du markdown source)
//   jeu ('game')   -> .exe   (clin d'œil « exécutable » ; un jeu n'a pas de Raw)
//   autres ('settings'…)   -> aucune extension
//
// NB : l'extension reflète la SOURCE BRUTE, pas l'appartenance « projet ». Un
// .json n'est donc PAS forcément un projet (changelog/services sont des pages
// système stockées en .json) — la couleur d'icône d'onglet se dérive du TYPE,
// pas de l'extension (cf. tabIconColor dans EditorTabs.jsx).
//
// `type`  = type de l'entité : project.type, ou tab.type ('tool', 'readme',
//           'about', 'changelog', 'services', 'konami', 'victory-snake',
//           'victory-memory', 'victory-squirrel', 'game', 'settings').
// `base`  = nom nu, sans extension (project.name, label d'outil, label de jeu…).
const EXT_BY_TYPE = {
  pro: 'json',
  perso: 'json',
  tool: 'json',
  readme: 'md',
  about: 'md',
  changelog: 'json',
  services: 'json',
  konami: 'md',
  'victory-snake': 'md',
  'victory-memory': 'md',
  'victory-squirrel': 'md',
  game: 'exe',
}

export function fileName(type, base) {
  const ext = EXT_BY_TYPE[type]
  return ext ? `${base}.${ext}` : base
}

// Extension nue d'un type (sans le point), ou '' si le type n'en a pas
// (ex. 'settings'). Même source que fileName (EXT_BY_TYPE) : la table reste la
// SOURCE UNIQUE. Sert à dériver le rendu (couleur d'icône d'onglet) de
// l'extension plutôt que d'une liste de types en dur.
export function extension(type) {
  return EXT_BY_TYPE[type] || ''
}
