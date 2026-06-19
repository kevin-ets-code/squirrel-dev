import { useMemo } from 'react'
import ToolLogo from './ToolLogo.jsx'
import Folder from './Folder.jsx'
import { buildTools, toolTabId, toolCategoryLabel } from '../lib/tools.js'
import { fileName } from '../lib/fileName.js'

// Libellé du groupe fourre-tout pour les outils sans category.
const OTHERS = 'Autres'

// Regroupe les outils par category. Les catégories sont DÉRIVÉES de la donnée
// (aucune liste en dur) : un outil sans category tombe dans "Autres".
// Ordre des groupes : alphabétique par nom de catégorie, "Autres" toujours en
// dernier. Outils triés alphabétiquement par label dans chaque groupe.
function groupByCategory(list) {
  const groups = new Map()
  for (const t of list) {
    const cat = t.category || OTHERS
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat).push(t)
  }
  return [...groups.entries()]
    .map(([category, tools]) => ({
      category,
      tools: tools.slice().sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => {
      if (a.category === OTHERS) return 1
      if (b.category === OTHERS) return -1
      return a.category.localeCompare(b.category)
    })
}

// Panneau "Outils" : liste tous les outils uniques (par id) déduits des stacks,
// groupés par catégorie dans des dossiers repliables (comme pro/perso de
// l'explorateur). Affiche le label, identifie par id.
export default function ToolsPanel({ projects, tools, activeTab, onOpenTool }) {
  const list = useMemo(() => buildTools(projects, tools), [projects, tools])
  const groups = useMemo(() => groupByCategory(list), [list])

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Outils</div>
      <div className="sidebar-section-label">
        OUTILS<span className="section-count">{list.length}</span>
      </div>
      <div className="sidebar-tree">
        {groups.map((g) => (
          <Folder key={g.category} label={toolCategoryLabel(g.category)} count={g.tools.length}>
            {g.tools.map((t) => (
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
          </Folder>
        ))}
      </div>
    </aside>
  )
}
