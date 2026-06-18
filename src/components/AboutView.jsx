import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'
import { aboutToMarkdown, ABOUT_IDENTITY, ABOUT_PROSE } from '../lib/markdown.js'

// Page « À propos » (onglet about-me). Même mécanisme que ReadmeView : une page
// de contenu enveloppée dans ContentPage (toggle Preview/Raw + copie mutualisés).
//
// Trois parties (Preview) :
//  a. carte d'identité (nom/rôle DÉRIVÉS du profil, ligne méta codée dans la page) ;
//  b. récit en prose (ABOUT_PROSE, markdown) ;
//  c. timeline d'expériences en cartes, lue depuis `profile.experiences` (source
//     unique côté donnée — jamais en dur ici).
//
// Raw = le markdown source complet (aboutToMarkdown), comme le README.
export default function AboutView({ profile }) {
  const source = aboutToMarkdown(profile)
  const experiences = Array.isArray(profile.experiences) ? profile.experiences : []

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">about-me.md</span>
    </>
  )

  const preview = (
    <>
      <div className="markdown-body about-card">
        <h1>{profile.name}</h1>
        <p className="about-role">{profile.role}</p>
        <p className="about-meta">{ABOUT_IDENTITY}</p>
      </div>

      <MarkdownView source={ABOUT_PROSE} />

      {experiences.length > 0 && (
        <div className="markdown-body about-experiences">
          <h2>Expériences</h2>
          <ol className="exp-timeline">
            {experiences.map((exp, i) => (
              <li className="exp-card" key={i}>
                <span className="exp-period">{exp.period}</span>
                <h3 className="exp-role">{exp.role}</h3>
                <p className="exp-context">{exp.context}</p>
                <p className="exp-description">{exp.description}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )

  return (
    <ContentPage breadcrumb={breadcrumb} preview={preview} rawText={source} rawFormat="markdown" />
  )
}
