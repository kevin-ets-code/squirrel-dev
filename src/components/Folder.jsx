import { useState } from 'react'
import { ChevronIcon } from './icons.jsx'

// Dossier repliable réutilisable : chevron + nom + compteur.
// Utilisé par l'explorateur (groupes pro/perso) et le panneau Outils
// (groupes par catégorie). Mêmes classes CSS (folder, folder-row, folder-count).
export default function Folder({ label, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="folder">
      <button className="folder-row" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronIcon open={open} />
        <span className="folder-name">{label}</span>
        <span className="folder-count">{count}</span>
      </button>
      {open && <div className="folder-children">{children}</div>}
    </div>
  )
}
