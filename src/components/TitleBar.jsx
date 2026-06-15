import { MenuIcon, CommandIcon } from './icons.jsx'

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TitleBar({ name, onToggleSidebar, onOpenPalette }) {
  return (
    <div className="title-bar">
      <div className="title-left">
        <div className="brand-badge" aria-label={name} title={name}>
          {initials(name)}
        </div>
        <button className="explorer-toggle" onClick={onToggleSidebar} aria-label="Ouvrir l'explorateur">
          <MenuIcon /> Explorer
        </button>
      </div>
      <div className="title-center">squirrel-dev | {name}</div>
      <div className="title-right">
        {/* Point d'entrée visible de la palette : indispensable sur mobile (le
            raccourci Ctrl/Cmd+K n'a pas de sens au doigt) ; sert aussi de rappel
            du raccourci sur desktop. */}
        <button
          className="command-trigger"
          onClick={onOpenPalette}
          aria-label="Ouvrir la palette de commandes (Ctrl/Cmd+K)"
          title="Palette de commandes (Ctrl/Cmd+K)"
        >
          <CommandIcon />
        </button>
      </div>
    </div>
  )
}
