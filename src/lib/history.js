// Historique "git" narratif dérivé de projects.json (aucun vrai git).
// Même source que l'explorateur / le graphe / le panneau Outils : rien en dur.

// Hash court (7 caractères hex) DÉTERMINISTE dérivé de l'id d'un projet.
// Fonction PURE de l'id (FNV-1a 32 bits) : pour un id donné, le hash ne change
// jamais d'un reload à l'autre. Purement cosmétique (faux hash de commit).
export function shortHash(id) {
  const s = String(id)
  let h = 0x811c9dc5 // FNV offset basis
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) // FNV prime
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}

// `year` peut être un nombre (2026) ou une chaîne ("2023") dans le JSON.
function yearNum(year) {
  const n = Number(year)
  return Number.isFinite(n) ? n : 0
}

// Liste des "commits" = tous les projets, triés par année DÉCROISSANTE puis par
// id (ordre stable, déterministe). -> [{ id, project, hash, year, title, type }]
export function buildHistory(projects) {
  return projects
    .map((p) => ({
      id: p.id,
      project: p,
      hash: shortHash(p.id),
      year: p.year,
      title: p.title,
      type: p.type,
    }))
    .sort(
      (a, b) => yearNum(b.year) - yearNum(a.year) || String(a.id).localeCompare(String(b.id)),
    )
}
