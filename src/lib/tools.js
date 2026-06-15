// Déduit les outils depuis les "stack" de tous les projets.
// Même source que le graphe : rien n'est codé en dur.

export const TOOL_TAB_PREFIX = 'tool:'

export function toolTabId(name) {
  return TOOL_TAB_PREFIX + name
}

export function isToolTab(id) {
  return typeof id === 'string' && id.startsWith(TOOL_TAB_PREFIX)
}

export function toolNameFromTab(id) {
  return id.slice(TOOL_TAB_PREFIX.length)
}

// Résout l'id d'un outil vers son label d'affichage via la map "tools".
// Fallback sur l'id si l'entrée est absente (avec un avertissement, une seule
// fois par id pour éviter de spammer la console).
const warnedIds = new Set()
export function toolLabel(tools, id) {
  const entry = tools && tools[id]
  if (entry && entry.label) return entry.label
  if (!warnedIds.has(id)) {
    console.warn(
      `[tools] id "${id}" absent de la map "tools" (ou sans label) — affichage de l'id en fallback.`,
    )
    warnedIds.add(id)
  }
  return id
}

// Métadonnées complètes d'un outil (label, description, url, logo, color) depuis son id.
export function toolEntry(tools, id) {
  const entry = (tools && tools[id]) || {}
  return {
    id,
    label: entry.label || toolLabel(tools, id),
    description: entry.description || '',
    url: entry.url || '',
    logo: entry.logo || '',
    color: entry.color || '',
  }
}

// Liste des outils uniques (par id) déduits des stacks, triés par nombre
// d'utilisations décroissant. -> [{ id, label, projects: [...], count }]
export function buildTools(projects, tools) {
  const map = new Map()
  for (const p of projects) {
    for (const id of p.stack || []) {
      if (!map.has(id)) map.set(id, [])
      map.get(id).push(p)
    }
  }
  return [...map.entries()]
    .map(([id, projs]) => {
      const entry = (tools && tools[id]) || {}
      return {
        id,
        label: toolLabel(tools, id),
        logo: entry.logo || '',
        color: entry.color || '',
        projects: projs,
        count: projs.length,
      }
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

// Projets qui utilisent un outil donné (par id).
export function toolProjects(projects, toolId) {
  return projects.filter((p) => (p.stack || []).includes(toolId))
}
