import { useState } from 'react'
import RawView from './RawView.jsx'
import { API_RESOURCES } from '../lib/api-endpoints.js'
import { allowedValues, resolveExample, executeRequest, httpStatusVariant } from '../lib/api-engine.js'

// Onglet Documentation de la vue API — rendu inspiré de Swagger UI / OpenAPI
// (rendu maison, aucune marque ni asset tiers). ENTIÈREMENT généré depuis la
// source unique src/lib/api-endpoints.js (API_RESOURCES) : jamais de liste
// dupliquée. Les valeurs de query (allowedValues), l'exemple d'URL
// (resolveExample) et l'exemple de réponse (executeRequest, donc le vrai moteur)
// sont résolus via les mêmes helpers que la console — toujours alignés sur la
// donnée réelle. Lecture seule.
//
// Chaque endpoint = carte dépliable teintée par sa méthode (token --api-method-*).
// Au dépli, deux bandes nettement séparées : « Paramètres » (path :param requis /
// query optionnels + valeurs) et « Réponses » (tableau Code/Description dérivé de
// la forme de l'endpoint + exemple réel via RawView). Le bouton « Essayer » ne fait
// que pré-remplir la console (onSelectEndpoint = selectEndpoint d'App, le MÊME que
// la sidebar) : aucune exécution inline, la Console reste le seul lieu d'exécution.

// Paramètres de chemin (`:id`) dérivés du template du path — surfacés comme
// REQUIS, à part des paramètres de query (optionnels).
function pathParams(path) {
  return path
    .split('/')
    .filter((s) => s.startsWith(':'))
    .map((s) => s.slice(1))
}

// Codes de réponse DÉRIVÉS de la forme de l'endpoint (jamais en dur) : 200
// toujours ; 400 si l'endpoint accepte des paramètres de query (valeur invalide) ;
// 404 si l'endpoint a un :param de chemin (id inconnu). Le 405 (méthode ≠ GET) est
// universel à l'API → mentionné une fois dans l'intro, pas répété par carte.
function responseCodes(ep) {
  const codes = [{ code: 200, desc: 'Réponse OK.' }]
  if ((ep.query || []).length > 0) {
    codes.push({ code: 400, desc: 'Paramètre de requête invalide.' })
  }
  if (pathParams(ep.path).length > 0) {
    codes.push({ code: 404, desc: 'Ressource introuvable.' })
  }
  return codes
}

function EndpointCard({ ep, apiData, onSelectEndpoint }) {
  const [open, setOpen] = useState(false)
  const reqPath = resolveExample(ep, apiData)
  // Exemple de réponse = vraie exécution via le moteur (corps réel de la donnée).
  const example = executeRequest(`${ep.method} ${reqPath}`, apiData)
  const pParams = pathParams(ep.path)
  const qParams = ep.query || []
  const hasParams = pParams.length > 0 || qParams.length > 0
  const codes = responseCodes(ep)
  const bodyId = `api-doc-body-${ep.id}`
  const method = ep.method.toLowerCase()

  return (
    <div className={'api-doc-card api-doc-card-' + method + (open ? ' open' : '')}>
      <button
        className="api-doc-card-head"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={'api-method api-method-' + method}>{ep.method}</span>
        <span className="api-path api-doc-path">{ep.path}</span>
        <span className="api-doc-desc">{ep.description}</span>
        <span className="api-doc-chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div className="api-doc-card-body" id={bodyId}>
          <section className="api-doc-band">
            <h4>Paramètres</h4>
            {hasParams ? (
              <ul className="api-doc-params">
                {pParams.map((p) => (
                  <li key={'p-' + p}>
                    <code className="api-doc-param-name">{p}</code>
                    <span className="api-doc-param-tag req">requis</span>
                    <span className="api-doc-param-desc">Paramètre de chemin.</span>
                  </li>
                ))}
                {qParams.map((q) => {
                  const vals = allowedValues(q, apiData)
                  return (
                    <li key={'q-' + q.param}>
                      <code className="api-doc-param-name">{q.param}</code>
                      <span className="api-doc-param-tag opt">optionnel</span>
                      <span className="api-doc-param-desc">{q.description}</span>
                      {vals.length > 0 && (
                        <span className="api-doc-param-vals">{vals.join(' · ')}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="api-doc-empty">Aucun paramètre.</p>
            )}
          </section>

          <section className="api-doc-band">
            <div className="api-doc-band-head">
              <h4>Réponses</h4>
              <button
                type="button"
                className="api-doc-try"
                onClick={() => onSelectEndpoint(ep)}
                aria-label={`Essayer ${ep.method} ${ep.path} dans la console`}
              >
                Essayer dans la console
              </button>
            </div>
            <table className="api-doc-responses">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <span className={'api-doc-code api-code-' + httpStatusVariant(c.code)}>
                        {c.code}
                      </span>
                    </td>
                    <td>{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="api-doc-example">
              <span className="api-doc-example-label">
                Exemple{' '}
                <span className="api-doc-example-req">
                  {ep.method} {reqPath}
                </span>
              </span>
              <RawView content={JSON.stringify(example.body, null, 2)} format="json" />
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default function ApiDocPanel({ apiData, onSelectEndpoint }) {
  return (
    <div className="api-doc-panel">
      <div className="api-doc-intro">
        <h2>API du portfolio</h2>
        <p>
          Une petite API REST interrogée côté client : aucune vraie requête réseau,
          tout est dérivé de <code>projects.json</code>.
        </p>
        <p className="api-doc-readonly" role="note">
          <span className="api-method api-method-get">GET</span>
          API en lecture seule — méthode <code>GET</code> uniquement. Toute autre
          méthode renvoie <code>405</code>.
        </p>
      </div>

      {API_RESOURCES.map((r) => (
        <section key={r.resource} className="api-doc-resource">
          <h3 className="api-doc-resource-title">{r.resource}</h3>
          {r.endpoints.map((ep) => (
            <EndpointCard
              key={ep.id}
              ep={ep}
              apiData={apiData}
              onSelectEndpoint={onSelectEndpoint}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
