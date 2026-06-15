import { useState, useRef, useEffect } from 'react'
import { CopyIcon, CheckIcon } from './icons.jsx'
import { copyText } from '../lib/clipboard.js'

// Bouton "copier" générique et discret (style VS Code). Copie `text` dans le
// presse-papier ; au clic, l'icône passe brièvement à un check (~1,5s).
// Accessible : type=button, aria-label, annonce vocale (aria-live).
// Composant unique réutilisé (ex. vue Raw) — pas de copie re-codée par page.
export default function CopyButton({ text, label = 'Copier la source', className = '' }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async () => {
    const ok = await copyText(text)
    setCopied(ok)
    clearTimeout(timer.current)
    if (ok) timer.current = setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      className={'copy-btn' + (copied ? ' is-copied' : '') + (className ? ' ' + className : '')}
      onClick={handleCopy}
      aria-label={copied ? 'Copié' : label}
      title={label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span className="visually-hidden" role="status" aria-live="polite">
        {copied ? 'Contenu copié' : ''}
      </span>
    </button>
  )
}
