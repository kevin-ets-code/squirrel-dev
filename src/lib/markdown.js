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

  // Les plateformes de distribution (web/ios/android) sont rendues en riche
  // dans l'en-tête React de ProjectView (icônes cliquables). La section markdown
  // "Liens" ne garde donc que le lien `repo` (code), distinct des plateformes.
  if (project.repo) {
    lines.push('## Liens')
    lines.push('')
    lines.push(`- [Voir le code](${project.repo})`)
    lines.push('')
  }

  return lines.join('\n')
}

// Page « À propos » (onglet about-me).
//
// Le RÉCIT (prose) et la ligne méta de la carte d'identité « vivent dans la
// page » (texte de présentation, pas de la donnée structurée à requêter via
// l'API) : on les centralise ici en CONSTANTES pour qu'AboutView (Preview) et la
// vue Raw partagent EXACTEMENT la même source — zéro duplication. En revanche la
// timeline lit `profile.experiences` (source unique côté donnée).

// Ligne méta scannable de la carte d'identité (sous le nom/rôle, eux dérivés du
// profil). Codée dans la page (décision « hybride »).
export const ABOUT_IDENTITY = '📍 Paris · 6 ans de pratique · Weweb, Xano, Supabase, Webflow, Bubble'

// Récit en prose (markdown). Texte exact, ne pas reformuler.
export const ABOUT_PROSE = [
  "J'ai passé douze ans dans la restauration, du service à la direction de salle. Un métier où l'on apprend à lire un besoin vite, à tenir sous pression et à soigner chaque détail de l'expérience. La création d'applications, elle, ne m'a jamais quitté — c'était là, en arrière-plan, depuis toujours. J'ai fini par franchir le pas, simplement pour changer de vie.",
  "Je me suis formé en autodidacte, à coups de formations en ligne et de projets personnels, jusqu'à en faire mon métier. Cela fait aujourd'hui six ans que je construis des sites et des applications en no-code et low-code, dont quatre au sein d'une agence spécialisée — de vrais projets, de vrais clients, de vraies contraintes de livraison.",
  "Ma façon de travailler tient en quelques principes. Partir du besoin réel plutôt que de la technique pour la technique. Livrer un travail soigné, sans sur-ingénierie. Et refuser l'opposition stérile entre « vrai code » et no-code : j'utilise l'outil juste pour le projet, du no-code pur au low-code quand un site ou une application demande du sur-mesure.",
  "Depuis deux ans, l'intelligence artificielle fait partie intégrante de ma manière de concevoir. Je la dirige comme un véritable binôme : je pense l'architecture et les décisions, elle exécute sous mon contrôle. C'est un levier qui m'a permis d'aller plus loin techniquement, et je l'assume pleinement.",
  "Ce portfolio en est d'ailleurs la preuve vivante : il a été pensé et construit pas à pas avec Claude Code.",
].join('\n\n')

// Source brute (vue Raw) de la page À propos : carte d'identité + récit + la
// timeline d'expériences (dérivée de `profile.experiences`). Reflète fidèlement
// ce qu'affiche le Preview.
export function aboutToMarkdown(profile) {
  const lines = []
  lines.push(`# ${profile.name}`)
  lines.push('')
  lines.push(`**${profile.role}**`)
  lines.push('')
  lines.push(ABOUT_IDENTITY)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(ABOUT_PROSE)
  lines.push('')

  const experiences = Array.isArray(profile.experiences) ? profile.experiences : []
  if (experiences.length > 0) {
    lines.push('## Expériences')
    lines.push('')
    for (const exp of experiences) {
      lines.push(`### ${exp.role}`)
      lines.push('')
      lines.push(`*${exp.period} · ${exp.context}*`)
      lines.push('')
      lines.push(exp.description)
      lines.push('')
    }
  }

  return lines.join('\n').trimEnd() + '\n'
}

// NB : changelog et services n'ont plus de helper markdown ici. Ce sont des
// pages de DONNÉE (.json) dont la vue Raw est le JSON source brut
// (JSON.stringify dans ChangelogView / ServicesView), comme une fiche projet —
// pas du markdown généré. Seules les pages en PROSE (projet, about, README)
// gardent un helper de rendu markdown ci-dessus/dessous.

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
