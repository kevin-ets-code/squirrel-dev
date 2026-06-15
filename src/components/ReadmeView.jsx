import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'
import CopyEmail from './CopyEmail.jsx'
import { readmeToMarkdown } from '../lib/markdown.js'

// Page d'accueil (onglet README). Preview = prose markdown (depuis l'objet
// `readme` de projects.json) + section contact en React (bouton copier-email).
// Raw = le MARKDOWN SOURCE brut (le README n'est pas du JSON).
// Le toggle Preview/Raw et la copie sont fournis par ContentPage.
export default function ReadmeView({ profile, readme }) {
  const source = readmeToMarkdown(profile, readme)

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">README.md</span>
    </>
  )

  const preview = (
    <>
      <MarkdownView source={source} />

      <div className="markdown-body contact-block">
        <h2>Me contacter</h2>
        <div className="contact-list">
          <div className="contact-row">
            <span className="contact-label">Email</span>
            <a className="contact-value" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
            <CopyEmail email={profile.email} />
          </div>

          {profile.links?.github && (
            <a
              className="contact-row contact-link"
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-label">GitHub</span>
              <span className="contact-value">
                {profile.links.github.replace(/^https?:\/\//, '')} ↗
              </span>
            </a>
          )}

          {profile.links?.linkedin && (
            <a
              className="contact-row contact-link"
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-label">LinkedIn</span>
              <span className="contact-value">
                {profile.links.linkedin.replace(/^https?:\/\//, '')} ↗
              </span>
            </a>
          )}
        </div>
      </div>
    </>
  )

  return (
    <ContentPage breadcrumb={breadcrumb} preview={preview} rawText={source} rawFormat="markdown" />
  )
}
