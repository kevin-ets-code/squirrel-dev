import ContentPage from './ContentPage.jsx'
import ToolLogo from './ToolLogo.jsx'
import { fileName } from '../lib/fileName.js'
import { toolEntry } from '../lib/tools.js'

// Page services.json (onglet `services`). Les services sont de la DONNÉE
// structurée (pas de la prose) : la vue Raw est donc le JSON SOURCE
// (services.json), exactement comme une fiche projet — même chemin
// ContentPage/RawView (rawFormat="json" → coloration + gouttière + copie).
//
// Preview = une CARTE par service, dans l'ordre des données. Chaque carte :
//  - title + tagline ;
//  - description ;
//  - « Pour qui : … » ;
//  - prestations (deliverables) en liste ;
//  - stack en pastilles ToolLogo CLIQUABLES (ouvrent la fiche outil via
//    onOpenTool ; logo/label/couleur résolus via `tools`) — SECTION OMISE si
//    la stack est vide ;
//  - projets liés en chips CLIQUABLES (ouvrent le projet via onOpenProject) —
//    ids résolus via `projects`, inconnus IGNORÉS, SECTION OMISE si rien.
//
// Toute la donnée vient de services.json (prop) — rien en dur.
export default function ServicesView({ services = [], tools = {}, projects = [], onOpenProject, onOpenTool }) {
  const source = JSON.stringify(services, null, 2)

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">{fileName('services', 'services')}</span>
    </>
  )

  const preview = (
    <div className="markdown-body services">
      <h1>Services</h1>

      <div className="service-grid">
        {services.map((service) => {
          const stack = Array.isArray(service.stack) ? service.stack : []
          const related = (Array.isArray(service.relatedProjects) ? service.relatedProjects : [])
            .map((id) => projects.find((p) => p.id === id))
            .filter(Boolean)

          return (
            <section className="service-card" key={service.id}>
              <h2 className="service-title">{service.title}</h2>
              {service.tagline && <p className="service-tagline">{service.tagline}</p>}
              {service.description && <p className="service-description">{service.description}</p>}

              {service.forWho && (
                <p className="service-forwho">
                  <span className="service-forwho-label">Pour qui :</span> {service.forWho}
                </p>
              )}

              {Array.isArray(service.deliverables) && service.deliverables.length > 0 && (
                <>
                  <h3 className="service-subhead">Prestations</h3>
                  <ul className="service-deliverables">
                    {service.deliverables.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </>
              )}

              {stack.length > 0 && (
                <>
                  <h3 className="service-subhead">Outils</h3>
                  <ul className="service-stack">
                    {stack.map((id) => {
                      const t = toolEntry(tools, id)
                      return (
                        <li key={id}>
                          <button
                            type="button"
                            className="service-tool"
                            onClick={() => onOpenTool?.(id)}
                          >
                            <ToolLogo logo={t.logo} color={t.color} label={t.label} shape="square" size={20} />
                            <span className="service-tool-label">{t.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}

              {related.length > 0 && (
                <>
                  <h3 className="service-subhead">Projets liés</h3>
                  <ul className="service-related">
                    {related.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="service-related-chip"
                          onClick={() => onOpenProject?.(p)}
                        >
                          {p.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )

  return (
    <ContentPage breadcrumb={breadcrumb} preview={preview} rawText={source} rawFormat="json" />
  )
}
