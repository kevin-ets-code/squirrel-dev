import { useEffect, useRef, useState } from 'react'
import { FileIcon, CloseIcon, GearIcon, GamepadIcon } from './icons.jsx'
import ToolLogo from './ToolLogo.jsx'
import { fileName, extension } from '../lib/fileName.js'

// Couleur de l'icône d'un onglet, DÉRIVÉE DE L'EXTENSION du fichier (source
// unique : EXT_BY_TYPE via fileName.js) plutôt que d'une liste de types en dur —
// ainsi toute future page hérite automatiquement de la bonne icône :
// - 'game' (.exe, branche GamepadIcon) -> --icon-perso (inchangé) ;
// - extension .md (README, about-me, changelog, services, konami-code,
//   victory-*, et toute future page .md) -> --icon-system (bleu fixe) ;
// - projets .json ('pro' / 'perso') -> --icon-<type> (--icon-pro / --icon-perso) ;
// - FALLBACK ULTIME -> --icon-system : var CSS garantie existante. Un type futur
//   imprévu retombe sur une icône VISIBLE au lieu d'une var inexistante (qui
//   rendait l'icône invisible) — le piège est désarmé, pas déplacé.
// (Les types 'tool' et 'settings' ont leur propre rendu et n'utilisent pas ceci.)
function tabIconColor(type) {
  if (type === 'game') return 'var(--icon-perso)'
  if (extension(type) === 'md') return 'var(--icon-system)'
  if (type === 'pro' || type === 'perso') return `var(--icon-${type})`
  return 'var(--icon-system)'
}

// Barre d'onglets — pattern WAI-ARIA Tabs.
// Activation manuelle : flèches gauche/droite déplacent le focus (roving
// tabindex), Entrée/Espace activent l'onglet focalisé. Chaque onglet est relié
// à son tabpanel via aria-controls / id.
export default function EditorTabs({ tabs, activeTab, onActivate, onClose, focusActiveSignal }) {
  const tabRefs = useRef([])
  const [focusIndex, setFocusIndex] = useState(0)

  const activeIndex = tabs.findIndex((t) => t.id === activeTab)

  // Le focus clavier (roving) suit l'onglet actif quand celui-ci change.
  useEffect(() => {
    if (activeIndex >= 0) setFocusIndex(activeIndex)
  }, [activeIndex])

  // Signal externe (lien « Onglet suivant ») : donne le focus à l'onglet actif.
  useEffect(() => {
    if (focusActiveSignal && activeIndex >= 0) {
      tabRefs.current[activeIndex]?.focus()
    }
  }, [focusActiveSignal]) // eslint-disable-line react-hooks/exhaustive-deps

  const moveFocus = (nextIndex) => {
    const n = (nextIndex + tabs.length) % tabs.length
    setFocusIndex(n)
    tabRefs.current[n]?.focus()
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
        moveFocus(tabs.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onActivate(tabs[i].id)
        break
      default:
        break
    }
  }

  return (
    <div className="editor-tabs" role="tablist" aria-label="Onglets ouverts">
      {tabs.map((tab, i) => {
        const color = tabIconColor(tab.type)
        const selected = activeTab === tab.id
        const roving = i === focusIndex ? 0 : -1
        // Nom affiché = nom nu (tab.name) + extension reflétant la source brute,
        // via le helper central (même chaîne que sidebar/breadcrumb). tab.name
        // reste nu pour le fallback d'initiale de ToolLogo.
        const label = fileName(tab.type, tab.name)
        return (
          <div
            key={tab.id}
            ref={(el) => (tabRefs.current[i] = el)}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={roving}
            className={'tab' + (selected ? ' active' : '')}
            onClick={() => onActivate(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.type === 'tool' ? (
              <ToolLogo logo={tab.logo} color={tab.color} label={tab.name} shape="square" size={15} />
            ) : tab.type === 'settings' ? (
              <GearIcon size={14} color="var(--accent)" />
            ) : tab.type === 'game' ? (
              <span className="tab-game-icon" style={{ color }}>
                <GamepadIcon size={14} />
              </span>
            ) : (
              <FileIcon size={14} color={color} />
            )}
            <span className="tab-name">{label}</span>
            <button
              className="tab-close"
              tabIndex={roving}
              aria-label={`Fermer ${label}`}
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
            >
              <CloseIcon />
            </button>
          </div>
        )
      })}
    </div>
  )
}
