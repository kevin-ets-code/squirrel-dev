import { FilesIcon, PackageIcon, SearchIcon, GraphIcon, GearIcon, GitBranchIcon } from './icons.jsx'

// Rangée d'onglets en haut du drawer mobile : remplace l'activity bar (masquée
// sous 720px) pour basculer entre les panneaux de la sidebar + le Graph, et
// ouvrir les Paramètres (l'engrenage de l'activity bar n'existant pas en mobile).
export default function MobilePanelTabs({
  view,
  panel,
  activeTab,
  onSelectPanel,
  onSelectGraph,
  onSelectSettings,
}) {
  const isPanel = (p) => view === 'ide' && panel === p

  return (
    <div className="mobile-panel-tabs" role="tablist" aria-label="Panneaux">
      <button
        className={'mpt-btn' + (isPanel('explorer') ? ' active' : '')}
        onClick={() => onSelectPanel('explorer')}
      >
        <FilesIcon size={18} />
        <span>Explorer</span>
      </button>
      <button
        className={'mpt-btn' + (isPanel('tools') ? ' active' : '')}
        onClick={() => onSelectPanel('tools')}
      >
        <PackageIcon size={18} />
        <span>Tools</span>
      </button>
      <button
        className={'mpt-btn' + (isPanel('search') ? ' active' : '')}
        onClick={() => onSelectPanel('search')}
      >
        <SearchIcon size={18} />
        <span>Recherche</span>
      </button>
      <button
        className={'mpt-btn' + (isPanel('source') ? ' active' : '')}
        onClick={() => onSelectPanel('source')}
      >
        <GitBranchIcon size={18} />
        <span>Git</span>
      </button>
      <button
        className={'mpt-btn' + (view === 'graph' ? ' active' : '')}
        onClick={onSelectGraph}
      >
        <GraphIcon size={18} />
        <span>Graph</span>
      </button>
      <button
        className={'mpt-btn' + (view === 'ide' && activeTab === 'settings' ? ' active' : '')}
        onClick={onSelectSettings}
      >
        <GearIcon size={18} />
        <span>Réglages</span>
      </button>
    </div>
  )
}
