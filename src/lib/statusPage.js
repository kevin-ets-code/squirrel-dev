// Sémantique de la page « status.json » (fausse status page SaaS) — SOURCE UNIQUE.
// La page (StatusView) ET l'endpoint GET /status relisent ce module ; aucune
// liste/logique de statut n'est dupliquée ailleurs.
//
// (Distinct de status.js, qui gère la pastille de statut des FICHES PROJET.)
//
// Les « composants d'infrastructure » sont en réalité les parties du portfolio.
// La donnée brute vit dans src/status.json. Un composant peut être marqué
// `dynamic` → son uptime/statut sont DÉRIVÉS à l'exécution (cf. resolveStatus,
// resolveArcade) plutôt que codés en dur dans le JSON.
//
// Statut global, uptime/statut de l'Arcade et total de jeux sont TOUJOURS dérivés,
// jamais en dur (le total vient de GAMES.length côté App, pas d'ici).

// ============================================================
// Set de STATUTS supportés (extensible) — libellés + sévérité + token couleur.
// Ajouter un statut = une entrée ici (+ un token --status-<key> dans styles.css).
// ============================================================

// Libellé FR par statut de composant. Fallback = clé capitalisée.
export const STATUS_LABELS = {
  operational: 'Opérationnel',
  degraded: 'Performance dégradée',
  'partial-outage': 'Panne partielle',
  'major-outage': 'Panne majeure',
  maintenance: 'Maintenance',
}

export function statusLabel(key) {
  return STATUS_LABELS[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '')
}

// Token CSS de couleur d'un statut (→ --status-<key>, repli neutre garanti).
export function statusColorVar(key) {
  return key && STATUS_LABELS[key] ? `var(--status-${key})` : 'var(--status-default)'
}

// Sévérité croissante (0 = meilleur). Un statut inconnu est traité comme neutre
// (juste au-dessus d'operational) pour rester déterministe sans planter.
const SEVERITY = {
  operational: 0,
  maintenance: 1,
  degraded: 2,
  'partial-outage': 3,
  'major-outage': 4,
}
const severityOf = (key) => (key in SEVERITY ? SEVERITY[key] : 1)

// ============================================================
// Bandeau global agrégé — dérivé du PIRE statut parmi TOUS les composants
// (Arcade incluse, jamais exclue).
// ============================================================

// Le cas « tout opérationnel » a son propre message ; les autres niveaux
// reprennent le libellé du pire statut.
const OVERALL_OK_LABEL = 'Tous les systèmes sont opérationnels'

export function overallStatus(components = []) {
  if (!components.length) return 'operational'
  return components.reduce(
    (worst, c) => (severityOf(c.status) > severityOf(worst) ? c.status : worst),
    'operational',
  )
}

export function overallLabel(status) {
  return status === 'operational' ? OVERALL_OK_LABEL : statusLabel(status)
}

// ============================================================
// Arcade Subsystem — dérivé du nombre de jeux débloqués (état utilisateur).
// 0 jeu → 0% / major-outage ; 0 < x < 100% → degraded ; 100% → operational.
// On NE LIT JAMAIS le détail des jeux ici (juste un compte + un total) : le lib
// reste pur et testable, la lecture du localStorage est faite côté App.
// ============================================================

export function resolveArcade(unlockedCount, total) {
  const safeTotal = total > 0 ? total : 0
  const uptime = safeTotal > 0 ? Math.round((unlockedCount / safeTotal) * 10000) / 100 : 0
  let status
  if (uptime <= 0) status = 'major-outage'
  else if (uptime >= 100) status = 'operational'
  else status = 'degraded'
  return { uptime, status }
}

// ============================================================
// Résolution complète : remplace chaque composant `dynamic` par ses valeurs
// calculées, puis dérive le statut global. Renvoie un objet prêt à afficher ET à
// renvoyer par l'API (même état des deux côtés).
// ============================================================

export function resolveStatus(raw, { unlockedCount = 0, totalGames = 0 } = {}) {
  const rawComponents = Array.isArray(raw?.components) ? raw.components : []
  const components = rawComponents.map((c) => {
    if (c.dynamic === 'arcade') {
      const { uptime, status } = resolveArcade(unlockedCount, totalGames)
      // On retire le marqueur `dynamic` du résultat résolu (il ne vaut que pour la
      // source brute) et on expose uptime/status calculés.
      const { dynamic, ...rest } = c
      return { ...rest, status, uptime }
    }
    return c
  })
  const overall = overallStatus(components)
  return {
    overall,
    components,
    incidents: Array.isArray(raw?.incidents) ? raw.incidents : [],
  }
}

// ============================================================
// Barre d'historique d'uptime « 90 jours » (style Atlassian/Statuspage) —
// DÉCORATIVE. Pas de vraies données journalières : les couleurs des ~90 segments
// sont DÉRIVÉES du statut/uptime du composant, de façon DÉTERMINISTE (jamais de
// random → la barre ne clignote pas entre deux rendus).
//   operational  → tout vert
//   major-outage → tout rouge
//   maintenance  → tout bleu (token maintenance)
//   degraded / partial-outage → barre MIXTE : la proportion verte correspond à
//     l'uptime, le reste est orange (degraded) / orange foncé (partial-outage).
//     → la barre évolue AVEC l'uptime (ex. Arcade : rouge 0% → vert+orange 33/66%
//       → vert 100%), en cohérence avec son badge.
// UPTIME_BAR_DAYS = source unique (nombre de segments ET libellé « il y a N jours »).
// ============================================================

export const UPTIME_BAR_DAYS = 90

export function uptimeSegments({ status, uptime } = {}, count = UPTIME_BAR_DAYS) {
  const green = statusColorVar('operational')
  if (status === 'operational') return Array(count).fill(green)
  if (status === 'major-outage' || status === 'maintenance') {
    return Array(count).fill(statusColorVar(status))
  }
  // degraded / partial-outage (ou statut non-vert inconnu) : mixte dérivé de l'uptime.
  const pct = Math.max(0, Math.min(100, Number(uptime) || 0))
  const filled = Math.round((pct / 100) * count)
  const rest = statusColorVar(status === 'partial-outage' ? 'partial-outage' : 'degraded')
  return Array.from({ length: count }, (_, i) => (i < filled ? green : rest))
}

// ============================================================
// Ancienneté d'un incident, dérivée de sa date (pour la future timeline).
// Renvoie « aujourd'hui », « hier », « il y a N jours »… ('' si pas de date).
// ============================================================

export function relativeAge(date, now = new Date()) {
  if (!date) return ''
  const then = new Date(date)
  if (Number.isNaN(then.getTime())) return ''
  const days = Math.floor((now - then) / 86400000)
  if (days <= 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} jours`
  const months = Math.floor(days / 30)
  if (months === 1) return 'il y a 1 mois'
  if (months < 12) return `il y a ${months} mois`
  const years = Math.floor(days / 365)
  return years === 1 ? 'il y a 1 an' : `il y a ${years} ans`
}
