import { usePreferences } from '../lib/preferences.jsx'

// Page Paramètres (rendue dans un onglet, comme une fiche projet/outil).
// MVP : thème sombre/clair + accent prédéfini. Préférences persistées en
// localStorage via usePreferences (état UTILISATEUR, hors projects.json).
//
// TODO (idées Settings pour plus tard, NE PAS implémenter ici) :
//   - vue par défaut au chargement (IDE / Graph)
//   - taille de police de l'éditeur
//   - ouvrir les liens dans un nouvel onglet
//   - réinitialisation globale des préférences
export default function SettingsView() {
  const { theme, setTheme, isSystemTheme, accent, setAccent, resetAccent, presets, defaultAccent } =
    usePreferences()

  const isLight = theme === 'light'
  const currentAccent = accent || defaultAccent

  return (
    <div className="settings-view">
      <div className="settings-breadcrumb">paramètres</div>
      <h1 className="settings-title">Paramètres</h1>
      <p className="settings-lead">
        Préférences d'affichage, enregistrées dans ce navigateur.
      </p>

      {/* Thème ------------------------------------------------------------ */}
      <section className="settings-section">
        <h2 className="settings-section-title">Apparence</h2>

        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-label">Thème clair</span>
            <span className="settings-row-hint">
              {isSystemTheme
                ? 'Suit actuellement le réglage de votre système.'
                : 'Choix manuel — ne suit plus le système.'}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isLight}
            className={'settings-switch' + (isLight ? ' on' : '')}
            onClick={() => setTheme(isLight ? 'dark' : 'light')}
          >
            <span className="settings-switch-knob" aria-hidden="true" />
            <span className="visually-hidden">{isLight ? 'Activé' : 'Désactivé'}</span>
          </button>
        </div>
      </section>

      {/* Accent ----------------------------------------------------------- */}
      <section className="settings-section">
        <h2 className="settings-section-title">Couleur d'accent</h2>
        <p className="settings-row-hint settings-section-hint">
          Applique la couleur aux liens, focus, onglets et autres éléments mis en valeur.
        </p>

        <div className="settings-swatches" role="radiogroup" aria-label="Couleur d'accent">
          {presets.map((p) => {
            const selected = currentAccent.toLowerCase() === p.value.toLowerCase()
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={p.label}
                title={p.label}
                className={'settings-swatch' + (selected ? ' selected' : '')}
                style={{ '--swatch': p.value }}
                onClick={() => setAccent(p.value)}
              />
            )
          })}
        </div>

        {accent && (
          <button type="button" className="settings-reset" onClick={resetAccent}>
            Réinitialiser (teal par défaut)
          </button>
        )}
      </section>
    </div>
  )
}
