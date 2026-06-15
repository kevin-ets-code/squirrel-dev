import { useState, useEffect } from 'react'

// Vrai si l'écran est sous le seuil mobile (par défaut 720px, le même seuil
// que celui qui masque l'activity bar). Se met à jour au redimensionnement.
export default function useIsMobile(maxWidth = 720) {
  const query = `(max-width: ${maxWidth}px)`
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setIsMobile(e.matches)
    setIsMobile(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return isMobile
}
