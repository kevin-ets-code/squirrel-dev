// Liens d'aide clavier placés à la toute fin du contenu de l'onglet actif.
// Masqués visuellement, révélés au focus (Tab). Ce ne sont PAS un focus trap :
// si l'utilisateur continue au Tab, il sort normalement vers le navigateur.
export default function ContentEndNav({ hasMultipleTabs, onBackToMenu, onNextTab }) {
  return (
    <nav className="content-end-nav" aria-label="Aide à la navigation clavier">
      <button type="button" className="cen-link" onClick={onBackToMenu}>
        ↑ Revenir au menu
      </button>
      {hasMultipleTabs && (
        <button type="button" className="cen-link" onClick={onNextTab}>
          → Onglet suivant
        </button>
      )}
    </nav>
  )
}
