// Autocomplétion de la console API — SOURCE DE SUGGESTION (fonction pure).
//
// `getSuggestions(input, data)` prend la ligne de requête en cours de frappe et
// la donnée ({ profile, projects, tools }) et renvoie la liste des complétions
// valides À CE POINT précis. Tout est DÉRIVÉ de api-endpoints.js (ressources,
// routes, énumérateurs `params`) et de projects.json (ids) — aucune liste ni
// aucun path codé en dur. Fonction PURE (aucun état, aucun DOM) → testable
// isolément ; c'est le point d'extension pour la query string en v2.
//
// v1 = path + ids uniquement. On s'arrête au `?` : la query string n'est pas
// complétée (mais elle est préservée dans `apply`, jamais écrasée).
//
// Forme d'une suggestion :
//   { id, value, apply, kind: 'method' | 'resource' | 'id', hint? }
// - value : texte affiché (segment inséré : `GET`, `/projects`, `bibliogo`) ;
// - apply : la ligne d'entrée COMPLÈTE résultante (remplacement total → la
//   console n'a qu'à faire onChange(apply)) ;
// - hint  : libellé secondaire dérivé (label d'endpoint, titre projet, label
//   outil), purement cosmétique.

import { API_RESOURCES } from './api-endpoints.js'
import { allowedValues } from './api-engine.js'

// Table de routes à plat — même dérivation que le moteur (pas de duplication de
// liste : on relit la source unique API_RESOURCES).
const ROUTES = API_RESOURCES.flatMap((r) => r.endpoints)

// Ressources racines = 1ers segments statiques des routes (projects, tools,
// profile, stats), dans l'ordre de déclaration. Dérivé, jamais en dur.
const ROOT_SEGMENTS = [
  ...new Set(
    ROUTES.map((r) => r.path.split('/').filter(Boolean)[0]).filter(
      (seg) => seg && !seg.startsWith(':'),
    ),
  ),
]

// Label d'un endpoint racine (pour le hint) : la route dont le path === `/<root>`.
const rootLabel = (root) => ROUTES.find((r) => r.path === '/' + root)?.label || null

// Trouve la route « enfant dynamique » d'un path committé : même nombre de
// segments + 1, segments statiques identiques, dernier segment = `:param`.
// Renvoie { route, param } ou null. Générique : ne sait rien de « projects » ni
// « tools » en particulier.
function dynamicChild(committedSegs) {
  for (const route of ROUTES) {
    const tSegs = route.path.split('/').filter(Boolean)
    if (tSegs.length !== committedSegs.length + 1) continue
    if (!tSegs[tSegs.length - 1].startsWith(':')) continue
    let ok = true
    for (let i = 0; i < committedSegs.length; i++) {
      if (tSegs[i] !== committedSegs[i]) {
        ok = false
        break
      }
    }
    if (ok) return { route, param: tSegs[tSegs.length - 1].slice(1) }
  }
  return null
}

// Map id → libellé lisible (hint), dérivée de la donnée. Projets via title/name,
// outils via label. Les espaces d'ids ne se chevauchent pas en pratique.
function buildLabelMap(data) {
  const labels = {}
  for (const p of data.projects) labels[p.id] = p.title || p.name
  for (const s of data.services || []) labels[s.id] = s.title || s.id
  // Les outils sont énumérés par le `params.derive` des endpoints ; pour le hint
  // on relit le même registre dérivé via le détail d'outil (label inclus).
  // On évite d'importer buildTools ici : le hint outil reste optionnel.
  if (data.tools) {
    for (const [id, t] of Object.entries(data.tools)) {
      if (t && t.label) labels[id] = t.label
    }
  }
  return labels
}

// Filtre par PRÉFIXE insensible à la casse.
const startsWithCI = (text, prefix) =>
  text.toLowerCase().startsWith(prefix.toLowerCase())

export function getSuggestions(input, data) {
  if (!data) return []
  const raw = input || ''
  const leadTrimmed = raw.replace(/^\s+/, '')
  const spaceIdx = leadTrimmed.indexOf(' ')

  // --- Premier token, pas encore d'espace ---
  if (spaceIdx === -1) {
    // Path direct sans méthode (méthode GET implicite, parseRequest le tolère).
    if (leadTrimmed.startsWith('/')) {
      return pathSuggestions('', leadTrimmed, data)
    }
    // Sinon on tape la méthode. Seule GET est supportée.
    if (startsWithCI('GET', leadTrimmed) && 'GET' !== leadTrimmed) {
      return [{ id: 'method:get', value: 'GET', apply: 'GET ', kind: 'method', hint: 'Seule méthode supportée' }]
    }
    return []
  }

  // --- Méthode + espace : mode path ---
  const method = leadTrimmed.slice(0, spaceIdx)
  const rest = leadTrimmed.slice(spaceIdx + 1)
  return pathSuggestions(method, rest, data)
}

// Suggestions de path/ids. `method` peut être '' (méthode implicite). `rest` est
// tout ce qui suit la méthode (path + éventuelle query). On s'arrête au `?`.
function pathSuggestions(method, rest, data) {
  const qIdx = rest.indexOf('?')
  const pathPart = qIdx === -1 ? rest : rest.slice(0, qIdx)
  const querySuffix = qIdx === -1 ? '' : rest.slice(qIdx) // '?…' conservé tel quel

  // Segmentation : on retire un éventuel `/` de tête, puis on découpe. Le dernier
  // segment est celui en cours de frappe ; les précédents sont « committés ».
  const withoutLead = pathPart.startsWith('/') ? pathPart.slice(1) : pathPart
  const segs = withoutLead.split('/')
  const current = segs[segs.length - 1]
  const committedSegs = segs.slice(0, -1)

  // Reconstruit une ligne d'entrée complète pour un path donné.
  const prefix = method ? method + ' ' : ''
  const toApply = (path) => prefix + path + querySuffix

  let candidates = []

  if (committedSegs.length === 0) {
    // Niveau racine : on complète une ressource (/projects, /tools, …).
    candidates = ROOT_SEGMENTS.map((root) => ({
      id: 'resource:' + root,
      value: '/' + root,
      apply: toApply('/' + root),
      kind: 'resource',
      hint: rootLabel(root),
    }))
  } else if (committedSegs.length === 1) {
    // Sous-ressource dynamique : on complète un id, énuméré via la source unique.
    const child = dynamicChild(committedSegs)
    if (child) {
      const def = (child.route.params || []).find((p) => p.param === child.param)
      const ids = def ? allowedValues(def, data) : []
      const labels = buildLabelMap(data)
      const base = '/' + committedSegs[0]
      candidates = ids.map((id) => ({
        id: 'id:' + base + '/' + id,
        value: id,
        apply: toApply(base + '/' + id),
        kind: 'id',
        hint: labels[id] || null,
      }))
    }
  }
  // committedSegs.length >= 2 → hors v1, aucune suggestion.

  // Filtre par préfixe sur le segment courant, et on masque une suggestion
  // identique au path déjà tapé (pas de suggestion-miroir inutile).
  const typedPath = pathPart.startsWith('/') ? pathPart : pathPart ? '/' + pathPart : ''
  return candidates
    .filter((c) => startsWithCI(segValue(c), current))
    .filter((c) => fullPath(c, committedSegs) !== typedPath)
}

// Texte de comparaison pour le filtre préfixe : pour une ressource, le nom sans
// le `/` de tête ; pour un id, l'id nu.
function segValue(c) {
  return c.kind === 'resource' ? c.value.replace(/^\//, '') : c.value
}

// Path complet représenté par une suggestion (pour la détection de miroir).
function fullPath(c, committedSegs) {
  if (c.kind === 'resource') return c.value // déjà un path complet (/projects)
  return '/' + [...committedSegs, c.value].join('/') // id : base + id
}
