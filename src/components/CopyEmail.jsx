import { useState, useEffect, useRef } from 'react'
import { CopyIcon, CheckIcon } from './icons.jsx'
import { copyText } from '../lib/clipboard.js'

// Bouton "copier l'email" : feedback "Copié !" ~1,5s puis retour à l'état normal.
export default function CopyEmail({ email }) {
  const [status, setStatus] = useState('idle') // idle | copied | error
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = async () => {
    const ok = await copyText(email)
    setStatus(ok ? 'copied' : 'error')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus('idle'), 1500)
  }

  const label =
    status === 'copied'
      ? 'Copié !'
      : status === 'error'
        ? 'Échec'
        : 'Copier'

  return (
    <button
      type="button"
      className={'copy-email' + (status !== 'idle' ? ' is-' + status : '')}
      onClick={handleCopy}
      aria-label={`Copier l'adresse email ${email}`}
    >
      {status === 'copied' ? <CheckIcon /> : <CopyIcon />}
      <span className="copy-email-label">{label}</span>
      {/* annonce vocale du résultat sans bouger le focus */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {status === 'copied' ? 'Adresse email copiée' : status === 'error' ? 'Échec de la copie' : ''}
      </span>
    </button>
  )
}
