// Nom de fichier AFFICHÉ d'une page, avec l'extension qui reflète sa SOURCE BRUTE
// (vue Raw), pas son mode d'affichage. SOURCE UNIQUE pour la sidebar, les onglets
// et les breadcrumbs : une même entité affiche donc partout exactement le même
// nom (zéro divergence). Ne pas re-coder une extension en dur ailleurs.
//
//   projet (type 'pro' / 'perso') & outil ('tool')   -> .json
//       (leur vue Raw est le JSON de l'objet, cf. ProjectView / ToolView)
//   pages système ('readme', 'about', 'changelog', 'services', 'konami',
//       'victory-snake', 'victory-memory', 'victory-squirrel') -> .md  (leur vue
//       Raw est du markdown source)
//   jeu ('game')   -> .exe   (clin d'œil « exécutable » ; un jeu n'a pas de Raw)
//   autres ('settings'…)   -> aucune extension
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
  changelog: 'md',
  services: 'md',
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
