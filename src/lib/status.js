// Mappe une valeur de "status" vers une variante de couleur.
//   green = en ligne / actif
//   warn  = en cours, en test, prototype (jaune/orange)
//   gray  = archivé / inconnu
const GREEN = ['En ligne']
const WARN = ['En test fermé', 'En cours', 'Prototype']
const GRAY = ['Archivé']

export function statusVariant(status) {
  if (!status) return null
  if (GREEN.includes(status)) return 'green'
  if (WARN.includes(status)) return 'warn'
  if (GRAY.includes(status)) return 'gray'
  return 'gray' // valeur non répertoriée → gris neutre
}

// Variable CSS de couleur correspondante (pour la pastille de la sidebar).
export function statusColor(status) {
  const v = statusVariant(status)
  if (!v) return null
  return `var(--status-${v})`
}
