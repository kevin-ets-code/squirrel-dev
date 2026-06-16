// Panneau latéral du Graph : contrôles (filtres catégories + recherche + hint
// d'interaction). N'embarque aucune logique de graphe — il pilote juste l'état
// partagé (cats/search) remonté dans App, que GraphView consomme pour calculer
// la visibilité. Affiché à la place du panel courant quand view === 'graph'.
export default function GraphPanel({ cats, search, onToggleCat, onShowAll, onSearchChange }) {
  const allOn = cats.pro && cats.perso && cats.tools

  return (
    <aside className="sidebar graph-panel">
      <div className="sidebar-header">Graph</div>

      <div className="graph-panel-body">
        <div className="gfilter-group" role="group" aria-label="Filtrer par catégorie">
          <button
            className={'gfilter-btn' + (allOn ? ' active' : '')}
            onClick={onShowAll}
          >
            Tous
          </button>
          <button
            className={'gfilter-btn' + (cats.pro ? ' active' : '')}
            onClick={() => onToggleCat('pro')}
          >
            Pro
          </button>
          <button
            className={'gfilter-btn' + (cats.perso ? ' active' : '')}
            onClick={() => onToggleCat('perso')}
          >
            Perso
          </button>
          <button
            className={'gfilter-btn' + (cats.tools ? ' active' : '')}
            onClick={() => onToggleCat('tools')}
          >
            Outils
          </button>
        </div>

        <input
          className="gfilter-search"
          type="text"
          value={search}
          placeholder="Filtrer les nœuds…"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <p className="graph-panel-hint">simple clic = focus · double-clic = ouvrir</p>
    </aside>
  )
}
