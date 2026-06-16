import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'
import { projectToMarkdown } from '../lib/markdown.js'
import { statusVariant } from '../lib/status.js'
import { kindLabel } from '../lib/kinds.js'
import { storeLabel } from '../lib/platforms.js'
import { fileName } from '../lib/fileName.js'
import { ExternalLinkIcon } from './icons.jsx'

// Fiche projet. Preview = en-tête React + markdown ; Raw = JSON brut de l'objet.
// Le toggle Preview/Raw et la copie sont fournis par ContentPage.
export default function ProjectView({ project, tools }) {
  const kinds = Array.isArray(project.kinds) ? project.kinds : []
  // On garde toute plateforme ayant un `store` ; l'URL est optionnelle (avec URL
  // → tag cliquable + icône lien ; sans URL → simple étiquette informative).
  const platforms = (Array.isArray(project.platforms) ? project.platforms : []).filter(
    (p) => p && p.store,
  )
  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb">{project.type}</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">{fileName(project.type, project.name)}</span>
    </>
  )

  const preview = (
    <>
      <header className="markdown-body project-header">
        <h1>{project.title}</h1>
        <p className="project-oneliner">
          <em>{project.oneliner}</em>
        </p>
        <div className="project-meta">
          <span className="meta-chip">
            {project.type === 'pro' ? 'Projet pro' : 'Projet perso'} · {project.year}
          </span>
          {project.status && (
            <span className={'status-chip status-' + statusVariant(project.status)}>
              {project.status}
            </span>
          )}
          {kinds.map((kind) => (
            <span key={kind} className="meta-chip kind-chip">
              {kindLabel(kind)}
            </span>
          ))}
          {platforms.map((p) =>
            p.url ? (
              <a
                key={p.store + '|' + p.url}
                className="meta-chip kind-chip platform-tag"
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                title={'Ouvrir sur ' + storeLabel(p.store)}
                aria-label={'Ouvrir sur ' + storeLabel(p.store)}
              >
                <span>{storeLabel(p.store)}</span>
                <ExternalLinkIcon size={12} />
              </a>
            ) : (
              <span key={p.store} className="meta-chip kind-chip">
                {storeLabel(p.store)}
              </span>
            ),
          )}
        </div>
      </header>
      <MarkdownView source={projectToMarkdown(project, tools)} />
    </>
  )

  return (
    <ContentPage
      breadcrumb={breadcrumb}
      preview={preview}
      rawText={JSON.stringify(project, null, 2)}
      rawFormat="json"
    />
  )
}
