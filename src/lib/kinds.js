// Libellés lisibles pour les "kinds" (natures) d'un projet.
// La liste est OUVERTE : toute valeur présente dans `kinds` s'affiche.
// LABELS ne sert qu'à embellir quelques valeurs connues ; toute valeur
// absente retombe sur un formatage automatique (capitale + tirets → espaces),
// donc une nouvelle nature s'affiche correctement sans toucher au code.
const LABELS = {
  'site-vitrine': 'Site vitrine',
  webapp: 'Web app',
  'app-native': 'App native',
  automatisation: 'Automatisation',
}

export function kindLabel(kind) {
  if (!kind) return ''
  if (LABELS[kind]) return LABELS[kind]
  const spaced = String(kind).replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
