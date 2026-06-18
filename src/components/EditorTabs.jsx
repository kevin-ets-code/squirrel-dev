import { useEffect, useRef, useState } from 'react'
import { FileIcon, CloseIcon, GearIcon, GamepadIcon } from './icons.jsx'
import ToolLogo from './ToolLogo.jsx'
import { fileName } from '../lib/fileName.js'

// Pages « système » de l'explorateur (README, about-me, konami-code, et toute
// page victory-<jeu>) : elles partagent la couleur fixe --icon-system, comme dans
// la Sidebar. Dérivé (pas une liste en dur) pour que tout futur type 'victory-x'
// hérite automatiquement de la couleur système — sinon il retomberait sur une
// var CSS --icon-victory-x inexistante (l'icône perdrait sa couleur).
// NB : asymétrie assumée avec fileName.js, qui garde une table explicite
// EXT_BY_TYPE. Les deux répondent à des besoins distincts (couleur système ici,
// extension là) ; ne pas « harmoniser » par réflexe — il n'y a rien à réparer
// côté fileName.js, sa table est la source unique lisible des extensions.
const isSystemTabType = (type) =>
  type === 'readme' || type === 'about' || type === 'konami' || type.startsWith('victory-')

// Couleur de l'icône d'un onglet selon son type (alignée sur la Sidebar) :
// - pages système -> --icon-system (bleu fixe) ;
// - jeu -> --icon-perso (inchangé) ;
// - sinon (projets 'pro' / 'perso') -> --icon-<type>.
// (Les types 'tool' et 'settings' ont leur propre rendu et n'utilisent pas ceci.)
function tabIconColor(type) {
  if (isSystemTabType(type)) return 'var(--icon-system)'
  if (type === 'game') return 'var(--icon-perso)'
  return `var(--icon-${type})`
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
