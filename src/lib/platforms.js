// Libellés lisibles pour les plateformes de distribution (`platforms[].store`).
// La liste est OUVERTE : tout store présent dans `platforms` s'affiche.
// LABELS ne sert qu'à embellir quelques stores connus ; tout store absent
// retombe sur un formatage automatique (capitale en tête), donc un nouveau
// store s'affiche correctement sans toucher au code. Le choix de l'icône (et
// son fallback générique) est géré côté composant (ProjectView).
const LABELS = {
  web: 'Web',
  ios: 'iOS',
  android: 'Android',
}

export function storeLabel(store) {
  if (!store) return ''
  if (LABELS[store]) return LABELS[store]
  return String(store).charAt(0).toUpperCase() + String(store).slice(1)
}
