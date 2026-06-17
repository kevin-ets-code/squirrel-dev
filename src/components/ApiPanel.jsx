import Folder from './Folder.jsx'
import { API_RESOURCES, API_ENDPOINT_COUNT } from '../lib/api-endpoints.js'

// Sidebar contextuelle de la vue API (affichée quand view === 'api'). Désormais
// une SEULE section : ENDPOINTS, groupés par ressource via Folder et dérivés de
// la source unique src/lib/api-endpoints.js. Clic = PRÉ-REMPLIR la console
// (onSelectEndpoint), sans exécuter — App bascule alors sur l'onglet interne
// Console et focalise le champ.
//
// La Documentation et les Logs ne vivent PLUS ici : ils sont des onglets
// internes de la zone principale (ApiView) — pas de duplication.
export default function ApiPanel({ onSelectEndpoint }) {
  return (
    <aside className="sidebar api-panel">
      <div className="sidebar-header">API</div>

      <div className="sidebar-section-label">
        ENDPOINTS<span className="section-count">{API_ENDPOINT_COUNT}</span>
      </div>
      <div className="sidebar-tree">
        {API_RESOURCES.map((r) => (
          <Folder key={r.resource} label={r.resource} count={r.endpoints.length}>
            {r.endpoints.map((ep) => (
              <button
                key={ep.id}
                className="file-row api-endpoint"
                onClick={() => onSelectEndpoint(ep)}
                title={ep.description}
              >
                <span className={'api-method api-method-' + ep.method.toLowerCase()}>
                  {ep.method}
                </span>
                <span className="file-name api-path">{ep.path}</span>
              </button>
            ))}
          </Folder>
        ))}
      </div>
    </aside>
  )
}
