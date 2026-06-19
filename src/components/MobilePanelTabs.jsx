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

// Rangée d'onglets en haut du drawer mobile : remplace l'activity bar (masquée
// sous 720px) pour basculer entre les panneaux de la sidebar + le Graph + l'API,
// et ouvrir les Paramètres (l'engrenage de l'activity bar n'existant pas en mobile).
// L'onglet « Jeux » n'apparaît QUE si le mode Jeux est débloqué (easterEggUnlocked).
export default function MobilePanelTabs({
  view,
  panel,
  activeTab,
  easterEggUnlocked,
  onSelectPanel,
  onSelectGraph,
  onSelectApi,
  onSelectSettings,
}) {
  const isPanel = (p) => view === 'ide' && panel === p

  // État actif de chaque bouton : SOURCE UNIQUE réutilisée pour la classe
  // visuelle ET pour aria-pressed (pas de double expression à maintenir).
  // Ce ne sont pas des onglets (pas de tabpanel associé) mais des boutons
  // d'action qui basculent le panneau affiché → role="group" + aria-pressed,
  // surtout PAS role="tablist"/"tab" (qui exigerait de vrais tabpanels).
  const active = {
    explorer: isPanel('explorer'),
    tools: isPanel('tools'),
    search: isPanel('search'),
    source: isPanel('source'),
    games: isPanel('games'),
    api: view === 'api',
    graph: view === 'graph',
    settings: view === 'ide' && activeTab === 'settings',
  }

  return (
    <div className="mobile-panel-tabs" role="group" aria-label="Panneaux">
      <button
        className={'mpt-btn' + (active.explorer ? ' active' : '')}
        aria-pressed={active.explorer}
        onClick={() => onSelectPanel('explorer')}
      >
        <FilesIcon size={18} />
        <span>Explorer</span>
      </button>
      <button
        className={'mpt-btn' + (active.tools ? ' active' : '')}
        aria-pressed={active.tools}
        onClick={() => onSelectPanel('tools')}
      >
        <PackageIcon size={18} />
        <span>Tools</span>
      </button>
      <button
        className={'mpt-btn' + (active.search ? ' active' : '')}
        aria-pressed={active.search}
        onClick={() => onSelectPanel('search')}
      >
        <SearchIcon size={18} />
        <span>Recherche</span>
      </button>
      <button
        className={'mpt-btn' + (active.source ? ' active' : '')}
        aria-pressed={active.source}
        onClick={() => onSelectPanel('source')}
      >
        <GitBranchIcon size={18} />
        <span>Git</span>
      </button>
      {easterEggUnlocked && (
        <button
          className={'mpt-btn' + (active.games ? ' active' : '')}
          aria-pressed={active.games}
          onClick={() => onSelectPanel('games')}
        >
          <GamepadIcon size={18} />
          <span>Jeux</span>
        </button>
      )}
      <button
        className={'mpt-btn' + (active.api ? ' active' : '')}
        aria-pressed={active.api}
        onClick={onSelectApi}
      >
        <BracesIcon size={18} />
        <span>API</span>
      </button>
      <button
        className={'mpt-btn' + (active.graph ? ' active' : '')}
        aria-pressed={active.graph}
        onClick={onSelectGraph}
      >
        <GraphIcon size={18} />
        <span>Graph</span>
      </button>
      <button
        className={'mpt-btn' + (active.settings ? ' active' : '')}
        aria-pressed={active.settings}
        onClick={onSelectSettings}
      >
        <GearIcon size={18} />
        <span>Réglages</span>
      </button>
    </div>
  )
}
