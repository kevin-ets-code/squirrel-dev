import { useEffect, useRef, useState } from 'react'

// Barre d'onglets INTERNE à la zone principale de la vue API (console / doc /
// logs). Sous-état piloté par App (`apiTab`), DISTINCT du système d'onglets de
// fichiers IDE (tabs/activeTab) — ce ne sont pas des fichiers ouvrables.
//
// Même pattern WAI-ARIA Tabs qu'EditorTabs : role="tablist" + role="tab",
// activation manuelle, roving tabindex (←/→, Home/End), Entrée/Espace activent.
// Chaque onglet est relié à son tabpanel (rendu dans ApiView) via aria-controls.
const API_TABS = [
  { id: 'console', label: 'Console' },
  { id: 'doc', label: 'Documentation' },
  { id: 'logs', label: 'Logs' },
]

export default function ApiTabs({ active, onSelect }) {
  const refs = useRef([])
  const activeIndex = Math.max(0, API_TABS.findIndex((t) => t.id === active))
  const [focusIndex, setFocusIndex] = useState(activeIndex)

  // Le focus clavier (roving) suit l'onglet actif quand il change.
  useEffect(() => {
    setFocusIndex(activeIndex)
  }, [activeIndex])

  const moveFocus = (next) => {
    const n = (next + API_TABS.length) % API_TABS.length
    setFocusIndex(n)
    refs.current[n]?.focus()
  }

  const onKeyDown = (e, i) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(i + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(i - 1)
        break
      case 'Home':
        e.preventDefault()
        moveFocus(0)
        break
      case 'End':
        e.preventDefault()
        moveFocus(API_TABS.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(API_TABS[i].id)
        break
      default:
        break
    }
  }

  return (
    <div className="api-tabs" role="tablist" aria-label="Sections de la vue API">
      {API_TABS.map((t, i) => {
        const selected = active === t.id
        return (
          <button
            key={t.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            id={`api-tab-${t.id}`}
            aria-selected={selected}
            aria-controls={`api-panel-${t.id}`}
            tabIndex={i === focusIndex ? 0 : -1}
            className={'api-tab' + (selected ? ' active' : '')}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
