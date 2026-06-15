import { GraphIcon, PackageIcon } from './icons.jsx'

// Affiché à la place du canvas quand on demande le Graph sur petit écran.
// (Le chunk React Flow n'est pas chargé dans ce cas.)
export default function GraphUnavailable({ onOpenTools }) {
  return (
    <div className="graph-unavailable">
      <div className="gu-icon">
        <GraphIcon size={48} />
      </div>
      <h2>Le graphe nécessite un écran plus large</h2>
      <p>
        La vue Graph nécessite un écran plus large (au moins 720px). Ouvre ce
        portfolio sur un ordinateur ou une tablette en mode paysage pour explorer
        le graphe des projets et outils.
      </p>
      <p>
        En attendant, le panneau <strong>Tools</strong> permet de voir quels
        projets utilisent chaque outil.
      </p>
      <button className="gu-btn" onClick={onOpenTools}>
        <PackageIcon size={16} color="currentColor" />
        Ouvrir le panneau Tools
      </button>
    </div>
  )
}
