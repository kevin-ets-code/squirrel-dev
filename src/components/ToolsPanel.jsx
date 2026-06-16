import { useMemo } from 'react'
import ToolLogo from './ToolLogo.jsx'
import { buildTools, toolTabId } from '../lib/tools.js'
import { fileName } from '../lib/fileName.js'

// Panneau "Outils" : liste tous les outils uniques (par id) déduits des stacks,
// triés par nombre d'utilisations décroissant. Affiche le label, identifie par id.
export default function ToolsPanel({ projects, tools, activeTab, onOpenTool }) {
  const list = useMemo(() => buildTools(projects, tools), [projects, tools])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Outils</div>
      <div className="sidebar-section-label">
        OUTILS<span className="section-count">{list.length}</span>
      </div>
      <div className="sidebar-tree">
        {list.map((t) => (
          <button
            key={t.id}
            className={'file-row' + (activeTab === toolTabId(t.id) ? ' active' : '')}
            onClick={() => onOpenTool(t.id)}
          >
            <ToolLogo logo={t.logo} color={t.color} label={t.label} shape="square" size={18} />
            <span className="file-name">{fileName('tool', t.label)}</span>
            <span className="tool-count" title={`${t.count} projet(s)`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>
    </aside>
  )
}
