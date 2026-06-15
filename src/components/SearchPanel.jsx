import { useMemo, useState } from 'react'
import { FileIcon } from './icons.jsx'

// Panneau de recherche : filtre les projets par nom, titre, stack…
export default function SearchPanel({ projects, onOpenProject }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => {
      const haystack = [p.name, p.title, p.oneliner, p.type, ...(p.stack || [])]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, projects])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Recherche</div>
      <div className="search-field">
        <input
          type="text"
          value={query}
          autoFocus
          placeholder="Rechercher un projet…"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="search-count">
        {results.length} résultat{results.length > 1 ? 's' : ''}
      </div>
      <div className="sidebar-tree">
        {results.map((p) => (
          <button key={p.id} className="file-row" onClick={() => onOpenProject(p)}>
            <FileIcon color={`var(--icon-${p.type})`} />
            <span className="file-name">{p.name}.md</span>
          </button>
        ))}
      </div>
    </aside>
  )
}
