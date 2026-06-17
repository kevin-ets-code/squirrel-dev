import {
  FilesIcon,
  PackageIcon,
  SearchIcon,
  GraphIcon,
  BracesIcon,
  GearIcon,
  GitBranchIcon,
  GamepadIcon,
} from './icons.jsx'

// Activity bar (48px). Explorateur / Recherche / Tools basculent le panneau (et la
// vue IDE), Graph bascule en vue graphe, API bascule en vue API, et l'engrenage
// (en bas) ouvre l'onglet Paramètres. (Le GitHub du profil reste accessible depuis
// le README.)
// L'icône « Jeux » n'apparaît QUE si le mode Jeux est débloqué (easterEggUnlocked).
export default function ActivityBar({
  view,
  panel,
  activeTab,
  easterEggUnlocked,
  onSelectPanel,
  onSelectGraph,
  onSelectApi,
  onSelectSettings,
}) {
  return (
    <div className="activity-bar">
      <button
        className={'activity-btn' + (view === 'ide' && panel === 'explorer' ? ' active' : '')}
        onClick={() => onSelectPanel('explorer')}
        aria-label="Explorateur"
        title="Explorateur"
      >
        <FilesIcon />
      </button>
      <button
        className={'activity-btn' + (view === 'ide' && panel === 'tools' ? ' active' : '')}
        onClick={() => onSelectPanel('tools')}
        aria-label="Outils"
        title="Outils"
      >
        <PackageIcon />
      </button>
      <button
        className={'activity-btn' + (view === 'ide' && panel === 'search' ? ' active' : '')}
        onClick={() => onSelectPanel('search')}
        aria-label="Recherche"
        title="Recherche"
      >
        <SearchIcon />
      </button>
      <button
        className={'activity-btn' + (view === 'ide' && panel === 'source' ? ' active' : '')}
        onClick={() => onSelectPanel('source')}
        aria-label="Source Control"
        title="Source Control"
      >
        <GitBranchIcon size={24} />
      </button>
      {easterEggUnlocked && (
        <button
          className={'activity-btn' + (view === 'ide' && panel === 'games' ? ' active' : '')}
          onClick={() => onSelectPanel('games')}
          aria-label="Jeux"
          title="Jeux"
        >
          <GamepadIcon />
        </button>
      )}
      <button
        className={'activity-btn' + (view === 'api' ? ' active' : '')}
        onClick={onSelectApi}
        aria-label="API"
        title="API"
      >
        <BracesIcon />
      </button>
      <button
        className={'activity-btn' + (view === 'graph' ? ' active' : '')}
        onClick={onSelectGraph}
        aria-label="Graphe de connaissances"
        title="Graphe de connaissances"
        tabIndex={-1}
      >
        <GraphIcon />
      </button>
      <button
        className={'activity-btn activity-btn-bottom' + (activeTab === 'settings' ? ' active' : '')}
        onClick={onSelectSettings}
        aria-label="Paramètres"
        title="Paramètres"
      >
        <GearIcon />
      </button>
    </div>
  )
}
