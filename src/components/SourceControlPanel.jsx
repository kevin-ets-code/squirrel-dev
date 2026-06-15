import { useMemo } from 'react'
import { GitBranchIcon } from './icons.jsx'
import { buildHistory } from '../lib/history.js'

// Panneau "Source Control" : présente la timeline des projets comme un faux
// historique git. Tout est dérivé de projects.json (même source que
// l'explorateur / le graphe / le panneau Outils) — rien n'est codé en dur :
// la liste, l'ordre, les hash et le compteur en découlent. Cliquer un "commit"
// ouvre la fiche projet via le MÊME callback que l'explorateur (pas de doublon).
export default function SourceControlPanel({ projects, activeTab, onOpenProject }) {
  const commits = useMemo(() => buildHistory(projects), [projects])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Source Control</div>
      <div className="sidebar-section-label">
        HISTORIQUE<span className="section-count">{commits.length}</span>
      </div>

      {/* En-tête de branche décoratif (statique). */}
      <div className="sc-branch" aria-hidden="true">
        <GitBranchIcon size={14} />
        <span>main</span>
      </div>

      <div className="sidebar-tree">
        {commits.map((c) => (
          <button
            key={c.id}
            className={'file-row sc-commit' + (activeTab === c.id ? ' active' : '')}
            onClick={() => onOpenProject(c.project)}
          >
            <span className="sc-hash">{c.hash}</span>
            <span className="file-name sc-message">{c.project.name}</span>
            <span className="sc-meta">
              <span className={'sc-badge sc-badge-' + c.type}>{c.type}</span>
              <span className="sc-year">{c.year}</span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
