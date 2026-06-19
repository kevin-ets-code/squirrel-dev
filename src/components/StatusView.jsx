import ContentPage from './ContentPage.jsx'
import { fileName } from '../lib/fileName.js'
import {
  statusLabel,
  statusColorVar,
  overallLabel,
  relativeAge,
  uptimeSegments,
  UPTIME_BAR_DAYS,
} from '../lib/statusPage.js'

// Page status.json (onglet `status`) — fausse status page SaaS. Les « composants
// d'infrastructure » sont en réalité les parties du portfolio (IDE, Graph, API…).
//
// Le status est de la DONNÉE structurée : la vue Raw est donc le JSON SOURCE
// (status.json), exactement comme une fiche projet — même chemin ContentPage/
// RawView (rawFormat="json"). Le Raw montre la SOURCE BRUTE : l'Arcade y apparaît
// avec son marqueur `dynamic`, PAS ses valeurs calculées (attendu, c'est la source).
//
// Preview = vraie status page, depuis l'objet RÉSOLU (`resolved`, calculé dans
// App.jsx) :
//  - bandeau global : statut agrégé (pire de TOUS les composants) + libellé ;
//  - liste des composants : nom + badge texte+couleur, puis la BARRE d'historique
//    « 90 jours » (segments décoratifs, aria-hidden) + sa légende (« il y a 90
//    jours » · « XX% uptime » · « aujourd'hui »). L'uptime textuel vit dans la
//    légende (l'Arcade en valeurs CALCULÉES depuis les jeux débloqués). La barre
//    réagit donc au déblocage des jeux comme le reste (même source dérivée) ;
//  - incidents : timeline ; v1 vide → état vide propre.
//
// Rien en dur : statut global, uptime/statut Arcade viennent de `resolved`.
export default function StatusView({ statusRaw = {}, resolved = {} }) {
  const source = JSON.stringify(statusRaw, null, 2)
  const components = Array.isArray(resolved.components) ? resolved.components : []
  const incidents = Array.isArray(resolved.incidents) ? resolved.incidents : []
  const overall = resolved.overall || 'operational'

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">{fileName('status', 'status')}</span>
    </>
  )

  const preview = (
    <div className="markdown-body status">
      <h1>Status</h1>

      <div
        className="status-banner"
        style={{ '--status-color': statusColorVar(overall) }}
        role="status"
      >
        <span className="status-banner-dot" />
        <span className="status-banner-label">{overallLabel(overall)}</span>
      </div>

      <h2 className="status-subhead">Composants</h2>
      <ul className="status-components">
        {components.map((c) => (
          <li className="status-component" key={c.id}>
            <div className="status-component-row">
              <span className="status-component-name">{c.name}</span>
              <span
                className="status-badge"
                style={{ '--status-color': statusColorVar(c.status) }}
              >
                {statusLabel(c.status)}
              </span>
            </div>

            <div className="uptime-bar">
              {/* Barre décorative (pas de vraies données journalières) → masquée aux
                  lecteurs d'écran ; statut/uptime restent portés par le badge et la
                  légende. NB : classe `uptime-bar*` et NON `status-bar*` — cette
                  dernière est déjà la barre de pied de page de l'app (StatusBar). */}
              <div className="uptime-bar-track" aria-hidden="true">
                {uptimeSegments(c).map((color, i) => (
                  <span className="uptime-bar-seg" key={i} style={{ '--seg-color': color }} />
                ))}
              </div>
              <div className="uptime-bar-legend">
                <span className="uptime-bar-legend-start">il y a {UPTIME_BAR_DAYS} jours</span>
                <span className="uptime-bar-legend-uptime">
                  {typeof c.uptime === 'number' ? `${c.uptime}% uptime` : '—'}
                </span>
                <span className="uptime-bar-legend-end">aujourd'hui</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="status-subhead">Incidents</h2>
      {incidents.length === 0 ? (
        <p className="status-incidents-empty">
          Aucun incident sur les 90 derniers jours.
        </p>
      ) : (
        <ul className="status-incidents">
          {incidents.map((inc) => {
            const age = relativeAge(inc.date)
            return (
              <li className="status-incident" key={inc.id}>
                <div className="status-incident-head">
                  <span className="status-incident-title">{inc.title}</span>
                  {inc.status && (
                    <span
                      className="status-badge"
                      style={{ '--status-color': statusColorVar(inc.status) }}
                    >
                      {statusLabel(inc.status)}
                    </span>
                  )}
                </div>
                {age && <span className="status-incident-age">{age}</span>}
                {inc.resolution && (
                  <p className="status-incident-resolution">{inc.resolution}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  return (
    <ContentPage breadcrumb={breadcrumb} preview={preview} rawText={source} rawFormat="json" />
  )
}
