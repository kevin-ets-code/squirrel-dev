import ContentPage from './ContentPage.jsx'
import ToolLogo from './ToolLogo.jsx'
import { fileName } from '../lib/fileName.js'

// Fiche détail d'un outil, ouverte en onglet dans l'éditeur.
// Reçoit l'outil résolu { id, label, description, url, logo, color } : l'id sert à
// l'identité, le label à l'affichage. Preview = fiche lisible ; Raw = JSON de l'objet.
// Le toggle Preview/Raw et la copie sont fournis par ContentPage.
export default function ToolView({ tool, projects, onOpenProject }) {
  const { label, category, description, url, logo, color } = tool
  const count = projects.length
  const hasDescription = typeof description === 'string' && description.trim() !== ''
  const hasUrl = typeof url === 'string' && url.trim() !== ''
  // Segment intermédiaire = catégorie de l'outil ; cohérent avec le groupe
  // « Autres » du panneau Outils quand category est vide/absent.
  const categoryCrumb = category && category.trim() !== '' ? category : 'Autres'

  const breadcrumb = (
    <>
      <span className="crumb">tools</span>
      <span className="crumb-sep">›</span>
      <span className="crumb">{categoryCrumb}</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">{fileName('tool', label)}</span>
    </>
  )

  const preview = (
    <>
      <header className="markdown-body">
          <div className="tool-title-row">
            <ToolLogo logo={logo} color={color} label={label} shape="circle" size={36} />
            <h1>{label}</h1>
          </div>
          <div className="project-meta">
            <span className="meta-chip">
              Utilisé dans {count} projet{count > 1 ? 's' : ''}
            </span>
            {hasUrl && (
              <a
                className="meta-chip tool-link-chip"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Site officiel ↗
              </a>
            )}
          </div>
        </header>

        {hasDescription && (
          <div className="markdown-body">
            <h2>Description</h2>
            <p>{description}</p>
          </div>
        )}

        <div className="markdown-body">
          <h2>Projets</h2>
          {count === 0 ? (
            <p>Aucun projet n'utilise cet outil.</p>
          ) : (
            <div className="tool-projects">
              {projects.map((p) => (
                <button
                  key={p.id}
                  className="tool-project-card"
                  onClick={() => onOpenProject(p)}
                >
                  <div className="tpc-head">
                    <span className="tpc-title">{p.title}</span>
                    <span
                      className="meta-chip tpc-type"
                      style={{
                        color: `var(--icon-${p.type})`,
                        borderColor: `var(--icon-${p.type})`,
                      }}
                    >
                      {p.type}
                    </span>
                  </div>
                  <div className="tpc-oneliner">{p.oneliner}</div>
                </button>
              ))}
            </div>
          )}
        </div>
    </>
  )

  return (
    <ContentPage
      breadcrumb={breadcrumb}
      preview={preview}
      rawText={JSON.stringify(tool, null, 2)}
      rawFormat="json"
    />
  )
}
