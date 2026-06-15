// Construit un document markdown lisible à partir des champs d'un projet.
// C'est la source du mode "Preview" (rendu via react-markdown).

import { toolLabel } from './tools.js'

// Corps de la fiche (sections), hors en-tête.
// Le titre, l'oneliner et la ligne de méta (type/année/status) sont rendus
// en React dans ProjectView pour permettre des badges colorés.
// `tools` (map id -> {label,...}) sert à résoudre les ids de la stack vers leur label.
export function projectToMarkdown(project, tools) {
  const lines = []

  lines.push('## Le problème')
  lines.push('')
  lines.push(project.problem)
  lines.push('')

  lines.push('## La solution')
  lines.push('')
  lines.push(project.solution)
  lines.push('')

  // Résultats chiffrés (label/valeur) — affiché seulement si non vide.
  if (Array.isArray(project.metrics) && project.metrics.length > 0) {
    lines.push('## Résultats')
    lines.push('')
    lines.push('| Indicateur | Valeur |')
    lines.push('| --- | --- |')
    for (const m of project.metrics) {
      lines.push(`| ${m.label} | ${m.value} |`)
    }
    lines.push('')
  }

  // Faits marquants qualitatifs — affiché seulement si non vide.
  if (Array.isArray(project.highlights) && project.highlights.length > 0) {
    lines.push('## Points clés')
    lines.push('')
    for (const h of project.highlights) {
      lines.push(`- ${h}`)
    }
    lines.push('')
  }

  if (Array.isArray(project.stack) && project.stack.length > 0) {
    lines.push('## Stack')
    lines.push('')
    for (const techId of project.stack) {
      lines.push(`- \`${toolLabel(tools, techId)}\``)
    }
    lines.push('')
  }

  const hasLinks = project.demo || project.repo
  if (hasLinks) {
    lines.push('## Liens')
    lines.push('')
    if (project.demo) lines.push(`- [Voir la démo](${project.demo})`)
    if (project.repo) lines.push(`- [Voir le code](${project.repo})`)
    lines.push('')
  }

  return lines.join('\n')
}

// Markdown de la partie texte du README d'accueil, construit depuis `profile`
// et l'objet `readme` de projects.json. La section « Me contacter » (avec le
// bouton copier-email) est rendue à part, en React, dans ReadmeView.
export function readmeToMarkdown(profile, readme = {}) {
  const lines = []
  lines.push(`# ${profile.name}`)
  lines.push('')
  lines.push(`**${profile.role}** · ${profile.location}`)
  lines.push('')
  if (profile.tagline) {
    lines.push(`*${profile.tagline}*`)
    lines.push('')
  }
  lines.push('---')
  lines.push('')

  if (readme.intro) {
    lines.push('## Qui je suis')
    lines.push('')
    lines.push(readme.intro)
    lines.push('')
  }

  if (readme.approach) {
    lines.push('## Mon approche')
    lines.push('')
    lines.push(readme.approach)
    lines.push('')
  }

  if (readme.navigation) {
    lines.push('## Naviguer ce portfolio')
    lines.push('')
    lines.push(readme.navigation)
    lines.push('')
  }

  return lines.join('\n')
}
