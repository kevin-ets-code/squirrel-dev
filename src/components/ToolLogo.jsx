// Pastille d'outil : fond rempli de la couleur de l'outil (gris neutre si vide),
// forme contrôlée par `shape` ("circle" : fiche outil / graphe ; "square" :
// sidebar, coins légèrement arrondis).
// - si `logo` est défini : logo SVG monochrome forcé en BLANC, centré ;
// - sinon : la PREMIÈRE LETTRE du label en blanc, monospace, centrée (fallback).
export default function ToolLogo({ logo, color, label, shape = 'circle', size = 32 }) {
  const bg = color || 'var(--tool-badge-fallback)'
  const initial = (label || '?').trim().charAt(0).toUpperCase()

  return (
    <span
      className={'tool-logo-badge tool-logo-' + shape}
      style={{ background: bg, width: size, height: size }}
      aria-hidden="true"
    >
      {logo ? (
        <img className="tool-logo-img" src={logo} alt="" />
      ) : (
        <span className="tool-logo-letter" style={{ fontSize: Math.round(size * 0.52) }}>
          {initial}
        </span>
      )}
    </span>
  )
}
