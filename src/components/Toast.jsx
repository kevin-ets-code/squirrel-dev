import { useEffect } from 'react'

// Toast maison (zéro dépendance) : un seul toast à la fois, piloté depuis App
// (state toastMessage). Auto-dismiss après ~3s. Même mécanique de feedback
// temporaire que CopyEmail (effet + setTimeout), mais déclenchée d'en haut.
// Accessible (role="status" + aria-live) ; l'animation d'entrée respecte
// prefers-reduced-motion (gérée en CSS).
export default function Toast({ message, onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [message, duration, onDismiss])

  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        🎮
      </span>
      <span className="toast-message">{message}</span>
    </div>
  )
}
