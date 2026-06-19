import { useMemo, useState } from 'react'
import { FileTypeIcon } from './icons.jsx'
import ToolLogo from './ToolLogo.jsx'
import { buildTools } from '../lib/tools.js'
import { fileName } from '../lib/fileName.js'

// Panneau de recherche : filtre projets ET outils par nom, titre, stack…
//
// La liste est dérivée de la MÊME source que la palette de commandes : projets
// bruts + outils via buildTools(projects, tools). Aucune donnée en dur, aucune
// logique d'ouverture re-codée — on appelle les callbacks existants d'App.jsx
// (openProject / openTool, mêmes gardes anti-doublon).
export default function SearchPanel({ projects, tools, onOpenProject, onOpenTool }) {
  const [query, setQuery] = useState('')

  // Items unifiés : un projet ou un outil, chacun avec son haystack de recherche,
  // son icône et son ouverture (callback existant).
  const items = useMemo(() => {
    const projectItems = projects.map((p) => ({
      key: 'project:' + p.id,
      label: fileName(p.type, p.name),
      haystack: [p.name, p.title, p.oneliner, p.type, ...(p.stack || [])]
        .join(' ')
        .toLowerCase(),
      icon: <FileTypeIcon type={p.type} color={`var(--icon-${p.type})`} />,
      open: () => onOpenProject(p),
    }))

    const toolItems = buildTools(projects, tools).map((t) => ({
      key: 'tool:' + t.id,
      label: fileName('tool', t.label),
      haystack: `${t.label} ${t.count} projet${t.count > 1 ? 's' : ''}`.toLowerCase(),
      icon: <ToolLogo logo={t.logo} color={t.color} label={t.label} shape="square" size={18} />,
      open: () => onOpenTool(t.id),
    }))

    return [...projectItems, ...toolItems]
  }, [projects, tools, onOpenProject, onOpenTool])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.haystack.includes(q))
  }, [query, items])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Recherche</div>
      <div className="search-field">
        <input
          type="text"
          value={query}
          autoFocus
          placeholder="Rechercher un projet, un outil…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="search-count">
        {results.length} résultat{results.length > 1 ? 's' : ''}
      </div>
      <div className="sidebar-tree">
        {results.map((item) => (
          <button key={item.key} className="file-row" onClick={item.open}>
            {item.icon}
            <span className="file-name">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
