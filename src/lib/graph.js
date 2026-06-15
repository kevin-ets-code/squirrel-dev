// Construit nœuds + liens du graphe de connaissances à partir des projets.
// Tout est déduit du JSON : 1 nœud par projet, 1 nœud par outil unique
// (identifié par son id de stack), et un edge projet → outil pour chaque techno.
// Les nœuds outils utilisent l'id pour l'identité/les liens, le label pour l'affichage.

import { toolLabel } from './tools.js'

const PROJECT_X = 0
const TOOL_X = 560
const PROJECT_GAP = 200
const TOOL_GAP = 74

export function buildGraph(projects, toolsMap) {
  // id d'outil -> liste des projets qui l'utilisent
  const toolUsage = new Map()
  for (const p of projects) {
    for (const toolId of p.stack || []) {
      if (!toolUsage.has(toolId)) toolUsage.set(toolId, [])
      toolUsage.get(toolId).push(p.id)
    }
  }

  // outils triés : les plus partagés d'abord (ils ressortent)
  const tools = [...toolUsage.entries()]
    .map(([toolId, projectIds]) => ({
      toolId,
      label: toolLabel(toolsMap, toolId),
      projectIds,
      degree: projectIds.length,
    }))
    .sort((a, b) => b.degree - a.degree || a.label.localeCompare(b.label))

  // hauteurs pour centrer la colonne projets face à la colonne outils
  const toolsHeight = Math.max(0, (tools.length - 1) * TOOL_GAP)
  const projectsHeight = Math.max(0, (projects.length - 1) * PROJECT_GAP)
  const projectStartY = (toolsHeight - projectsHeight) / 2

  const nodes = []
  const edges = []

  projects.forEach((p, i) => {
    nodes.push({
      id: projectNodeId(p.id),
      kind: 'project',
      label: p.name,
      sub: p.type,
      project: p,
      position: { x: PROJECT_X, y: projectStartY + i * PROJECT_GAP },
    })
  })

  tools.forEach((t, i) => {
    const id = toolNodeId(t.toolId)
    const entry = (toolsMap && toolsMap[t.toolId]) || {}
    nodes.push({
      id,
      kind: 'tool',
      label: t.label, // affichage
      toolId: t.toolId, // identité
      logo: entry.logo || '',
      brandColor: entry.color || '',
      degree: t.degree,
      position: { x: TOOL_X, y: i * TOOL_GAP },
    })
    for (const projectId of t.projectIds) {
      edges.push({
        id: `${projectNodeId(projectId)}->${id}`,
        source: projectNodeId(projectId),
        target: id,
      })
    }
  })

  return { nodes, edges }
}

export function projectNodeId(id) {
  return `project:${id}`
}

export function toolNodeId(toolId) {
  return `tool:${toolId}`
}
