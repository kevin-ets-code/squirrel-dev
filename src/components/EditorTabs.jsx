import { useEffect, useRef, useState } from 'react'
import { FileTypeIcon, CloseIcon, GearIcon } from './icons.jsx'
import ToolLogo from './ToolLogo.jsx'
import { fileName } from '../lib/fileName.js'

// COULEUR de l'icône d'un onglet, DÉRIVÉE DU TYPE de l'entité (pas de
// l'extension, ni d'une liste en dur). C'est l'une des DEUX dimensions
// orthogonales de l'icône : la couleur dit « quel rôle » (ici), la FORME dit
// « quel format » (cf. FileTypeIcon, dérivée de l'extension). La vraie sémantique
// de couleur = « fiche projet » vs « page système » — et un .json n'est PAS
// forcément un projet (changelog/services sont des pages système en .json) ; se
// baser sur l'extension les colorerait à tort en couleur projet.
// - 'game' (.exe) -> --icon-perso (inchangé) ;
// - FICHE PROJET ('pro' / 'perso') -> --icon-<type> (--icon-pro / --icon-perso) ;
// - TOUT LE RESTE = page système (README/about, changelog/services, konami,
//   victory-*, et toute future page) -> --icon-system (bleu fixe). C'est aussi le
//   FALLBACK ULTIME : un type imprévu retombe sur une icône VISIBLE (var CSS
//   garantie existante), pas sur une var inexistante (icône invisible).
// (Les types 'tool' et 'settings' ont leur propre rendu et n'utilisent pas ceci.)
function tabIconColor(type) {
  if (type === 'game') return 'var(--icon-perso)'
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
            ) : (
              // Forme dérivée de l'extension (.json = accolades, .exe = manette,
              // défaut = document) ; couleur dérivée du type (tabIconColor).
              <FileTypeIcon type={tab.type} size={14} color={color} />
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
