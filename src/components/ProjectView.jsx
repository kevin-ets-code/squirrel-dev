import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'
import { projectToMarkdown } from '../lib/markdown.js'
import { statusVariant } from '../lib/status.js'
import { fileName } from '../lib/fileName.js'

// Fiche projet. Preview = en-tête React + markdown ; Raw = JSON brut de l'objet.
// Le toggle Preview/Raw et la copie sont fournis par ContentPage.
export default function ProjectView({ project, tools }) {
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
