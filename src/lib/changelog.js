// Helpers du changelog — sémantique des catégories et dérivations.
//
// La liste des versions vit UNIQUEMENT dans src/changelog.json : la page
// (ChangelogView) et l'API (api-endpoints.js) la relisent, jamais de duplication.
// Ce module centralise ce qui touche aux CATÉGORIES de changement (libellés,
// couleurs, filtrage) — tout est dérivé, rien n'est codé en dur côté versions.
//
// Le rendu et l'API ITÈRENT sur les clés présentes dans `changes`, ils ne
// supposent jamais les trois catégories : ajouter `removed` / `deprecated` /
// `security` dans le JSON fonctionne sans toucher au code (libellés déjà prévus,
// couleur de repli pour toute clé inconnue).

// Libellés lisibles des catégories connues. Les trois futures (removed,
// deprecated, security) sont déjà prévues ; toute clé absente d'ici retombe sur
// un libellé dérivé (categoryLabel).
export const CHANGELOG_CATEGORY_LABELS = {
  added: 'Ajouté',
  changed: 'Modifié',
  fixed: 'Corrigé',
  removed: 'Retiré',
  deprecated: 'Déprécié',
  security: 'Sécurité',
}

// Catégories CONNUES = clés de CHANGELOG_CATEGORY_LABELS. C'est la source des
// valeurs acceptées par le filtre `?category` de l'API : une catégorie connue
// mais ABSENTE des données reste une requête valide (→ count: 0), seul l'inconnu
// renvoie 400. (À distinguer de uniqueChangelogCategories, qui dérive les
// catégories réellement PRÉSENTES — utilisé par la légende de la page.)
export const KNOWN_CHANGELOG_CATEGORIES = Object.keys(CHANGELOG_CATEGORY_LABELS)

// Abréviations courtes (style logs) des catégories connues. Affichées comme tag
// de ligne dans la page (Preview) ; le texte porte le sens (pas que la couleur).
export const CHANGELOG_CATEGORY_TAGS = {
  added: 'ADD',
  changed: 'CHG',
  fixed: 'FIX',
  removed: 'RM',
  deprecated: 'DEP',
  security: 'SEC',
}

// Libellé d'une catégorie : connu, sinon fallback (première lettre capitalisée).
export function categoryLabel(key) {
  return CHANGELOG_CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

// Tag court d'une catégorie : connu, sinon fallback = clé en MAJ tronquée à 3
// caractères (cohérent avec ADD/CHG/FIX… ; pas de crash sur clé inconnue).
export function categoryTag(key) {
  return CHANGELOG_CATEGORY_TAGS[key] || key.toUpperCase().slice(0, 3)
}

// Variable CSS de couleur d'une catégorie (cf. tokens --changelog-* dans
// styles.css). Catégorie inconnue → couleur de repli neutre.
const COLOR_TOKENS = {
  added: 'var(--changelog-added)',
  changed: 'var(--changelog-changed)',
  fixed: 'var(--changelog-fixed)',
}
export function categoryColorVar(key) {
  return COLOR_TOKENS[key] || 'var(--changelog-default)'
}

// Union DÉRIVÉE des catégories réellement PRÉSENTES dans le changelog (ordre
// stable : added, changed, fixed d'abord si présents, puis le reste par ordre
// d'apparition). Sert à la LÉGENDE de la page (s'enrichit toute seule). La
// validation API `?category`, elle, s'appuie sur KNOWN_CHANGELOG_CATEGORIES.
export function uniqueChangelogCategories(changelog) {
  const present = new Set()
  for (const entry of changelog || []) {
    for (const key of Object.keys(entry.changes || {})) present.add(key)
  }
  const known = ['added', 'changed', 'fixed', 'removed', 'deprecated', 'security'].filter((k) =>
    present.has(k),
  )
  const extras = [...present].filter((k) => !known.includes(k))
  return [...known, ...extras]
}

// Filtre « réduit » par catégorie : ne garde que les versions contenant cette
// catégorie (liste non vide) et réduit chaque entrée à la SEULE catégorie
// demandée — `version` / `date` conservés. Source unique du comportement de
// l'endpoint GET /changelog?category=… .
export function filterByCategory(changelog, category) {
  return (changelog || [])
    .filter((entry) => Array.isArray(entry.changes?.[category]) && entry.changes[category].length > 0)
    .map((entry) => ({
      version: entry.version,
      ...(entry.date != null ? { date: entry.date } : {}),
      changes: { [category]: entry.changes[category] },
    }))
}
