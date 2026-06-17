import { useState, useRef, useEffect, useCallback } from 'react'
import RawView from './RawView.jsx'
import { CloseIcon } from './icons.jsx'
import { httpStatusVariant, parseRequest } from '../lib/api-engine.js'

// Onglet Logs de la vue API — historique de session EN PLEIN ÉCRAN (plus la
// section étroite de la sidebar) + panneau de détail en SPLIT INTERNE.
//
// - Liste à gauche : méthode + path + code coloré (httpStatusVariant), plus
//   récent en tête (l'ordre vient déjà de App). Cliquer une ligne SÉLECTIONNE
//   le log et ouvre le détail — SANS ré-exécuter (on lit le `body` stocké à la
//   création du log + la query parsée via parseRequest, du pur parsing).
// - Détail à droite : statut, path complet, query parsée, corps via RawView
//   (copie incluse) et un bouton « Rejouer » — SEUL chemin qui ré-exécute
//   (remonte via onReplay = replayLog d'App). Fermeture × + Échap, focus rendu.
// - Le split est strictement interne à la zone éditeur (flex, jamais d'overlay) ;
//   sous une largeur étroite il s'empile (CSS), toujours dans la zone.
export default function ApiLogsPanel({ logs, onReplay }) {
  const [selectedId, setSelectedId] = useState(null)
  const rowRefs = useRef({})
  const detailRef = useRef(null)

  const selected = logs.find((l) => l.id === selectedId) || null

  // Si le log sélectionné disparaît (historique borné à 50), on referme le détail.
  useEffect(() => {
    if (selectedId != null && !logs.some((l) => l.id === selectedId)) {
      setSelectedId(null)
    }
  }, [logs, selectedId])

  const closeDetail = useCallback(() => {
    const id = selectedId
    setSelectedId(null)
    // Focus rendu à la ligne de log qui avait ouvert le détail.
    requestAnimationFrame(() => rowRefs.current[id]?.focus())
  }, [selectedId])

  // Focus le panneau de détail à son ouverture.
  useEffect(() => {
    if (selected) detailRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  if (logs.length === 0) {
    return (
      <div className="api-logs-view">
        <p className="api-logs-empty-full">
          Aucune requête pour l'instant. Lance une requête depuis la console.
        </p>
      </div>
    )
  }

  const query = selected ? parseRequest(selected.input).query : {}
  const queryKeys = Object.keys(query)

  return (
    <div className={'api-logs-view' + (selected ? ' has-detail' : '')}>
      <div className="api-logs-list">
        {logs.map((l) => (
          <button
            key={l.id}
            ref={(el) => (rowRefs.current[l.id] = el)}
            className={'api-log-row' + (l.id === selectedId ? ' active' : '')}
            onClick={() => setSelectedId(l.id)}
            aria-pressed={l.id === selectedId}
            title={`${l.status} ${l.statusText}`}
          >
            <span className={'api-method api-method-' + l.method.toLowerCase()}>{l.method}</span>
            <span className="file-name api-path">{l.path}</span>
            <span className={'api-log-code api-code-' + httpStatusVariant(l.status)}>
              {l.status}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="api-log-detail"
          ref={detailRef}
          tabIndex={-1}
          role="region"
          aria-label={`Détail de la requête ${selected.method} ${selected.path}`}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              closeDetail()
            }
          }}
        >
          <div className="api-log-detail-head">
            <span className="api-log-detail-title">Détail de la requête</span>
            <button
              className="api-log-detail-close"
              onClick={closeDetail}
              aria-label="Fermer le détail"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="api-status">
            <span className="api-status-req">
              {selected.method} {selected.path}
            </span>
            <span className={'api-status-code api-code-' + httpStatusVariant(selected.status)}>
              {selected.status} {selected.statusText}
            </span>
          </div>

          {queryKeys.length > 0 && (
            <div className="api-log-detail-query">
              <h4>Query</h4>
              <ul>
                {queryKeys.map((k) => (
                  <li key={k}>
                    <code className="api-doc-param-name">{k}</code>
                    <span className="api-log-query-sep">=</span>
                    <code>{query[k]}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="api-log-detail-body">
            <RawView content={JSON.stringify(selected.body, null, 2)} format="json" />
          </div>

          <div className="api-log-detail-actions">
            <button className="api-send-btn" onClick={() => onReplay(selected)}>
              Rejouer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
