import ContentPage from './ContentPage.jsx'
import { fileName } from '../lib/fileName.js'
import {
  categoryLabel,
  categoryTag,
  categoryColorVar,
  uniqueChangelogCategories,
} from '../lib/changelog.js'

// Page changelog.json (onglet `changelog`). Le changelog est de la DONNÉE
// structurée (pas de la prose) : sa vue Raw est donc le JSON SOURCE
// (changelog.json), exactement comme une fiche projet — même chemin
// ContentPage/RawView (rawFormat="json" → coloration + gouttière + copie).
//
// Preview = rendu DENSE pleine largeur, façon sortie terminal (groupé par
// version). Pour chaque version : en-tête (numéro monospace + date à droite si
// présente), puis une LIGNE par changement = tag catégorie court (ADD/CHG/FIX…)
// + texte. On itère sur les clés PRÉSENTES dans `changes` (jamais les 6 en dur) ;
// une catégorie future est rendue (tag/couleur dérivés, repli neutre).
//
// Une LÉGENDE en tête (tag = libellé) est dérivée des catégories réellement
// présentes (uniqueChangelogCategories) → s'enrichit toute seule, rien en dur.
//
// La liste des versions vient UNIQUEMENT de changelog.json (prop) — jamais en dur.
export default function ChangelogView({ changelog = [] }) {
  const source = JSON.stringify(changelog, null, 2)
  const legendKeys = uniqueChangelogCategories(changelog)

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">{fileName('changelog', 'changelog')}</span>
    </>
  )

  const preview = (
    <div className="markdown-body changelog">
      <h1>Changelog</h1>

      {legendKeys.length > 0 && (
        <p className="changelog-legend">
          {legendKeys.map((key, i) => (
            <span key={key}>
              {i > 0 && <span className="changelog-legend-sep"> · </span>}
              <span className="changelog-tag" style={{ '--cat-color': categoryColorVar(key) }}>
                {categoryTag(key)}
              </span>
              {' = '}
              {categoryLabel(key)}
            </span>
          ))}
        </p>
      )}

      <div className="changelog-log">
        {changelog.map((entry) => (
          <section className="changelog-entry" key={entry.version}>
            <div className="changelog-entry-head">
              <h2 className="changelog-version">{entry.version}</h2>
              {entry.date && <span className="changelog-date">{entry.date}</span>}
            </div>
            {Object.entries(entry.changes || {}).flatMap(([key, items]) =>
              Array.isArray(items)
                ? items.map((item, i) => (
                    <p className="changelog-line" key={`${key}-${i}`}>
                      <span
                        className="changelog-tag"
                        style={{ '--cat-color': categoryColorVar(key) }}
                        title={categoryLabel(key)}
                      >
                        {categoryTag(key)}
                      </span>
                      <span className="changelog-text">{item}</span>
                    </p>
                  ))
                : [],
            )}
          </section>
        ))}
      </div>
    </div>
  )

  return (
    <ContentPage breadcrumb={breadcrumb} preview={preview} rawText={source} rawFormat="json" />
  )
}
