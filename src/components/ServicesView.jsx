import ContentPage from './ContentPage.jsx'
import ToolLogo from './ToolLogo.jsx'
import { servicesToMarkdown } from '../lib/markdown.js'
import { toolEntry } from '../lib/tools.js'

// Page services.md (onglet `services`). Même mécanisme que ReadmeView /
// AboutView / ChangelogView : page de contenu enveloppée dans ContentPage
// (toggle Preview/Raw + copie mutualisés). Le Raw est le markdown source
// (servicesToMarkdown).
//
// Preview = une CARTE par service, dans l'ordre des données. Chaque carte :
//  - title + tagline ;
//  - description ;
//  - « Pour qui : … » ;
//  - prestations (deliverables) en liste ;
//  - stack en pastilles ToolLogo (logo/label/couleur résolus via `tools`) —
//    SECTION OMISE si la stack est vide ;
//  - projets liés en chips CLIQUABLES (ouvrent le projet via onOpenProject) —
//    ids résolus via `projects`, inconnus IGNORÉS, SECTION OMISE si rien.
//
// Toute la donnée vient de services.json (prop) — rien en dur.
export default function ServicesView({ services = [], tools = {}, projects = [], onOpenProject }) {
  const source = servicesToMarkdown(services, tools, projects)

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">services.md</span>
    </>
  )

  const preview = (
    <div className="markdown-body services">
      <h1>Services</h1>

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
                      <li className="service-tool" key={id}>
                        <ToolLogo logo={t.logo} color={t.color} label={t.label} shape="square" size={20} />
                        <span className="service-tool-label">{t.label}</span>
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
  )

  return (
    <ContentPage breadcrumb={breadcrumb} preview={preview} rawText={source} rawFormat="markdown" />
  )
}
