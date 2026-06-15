import { useEffect, useMemo, useRef, useState } from 'react'
import { FileIcon, CommandIcon } from './icons.jsx'
import ToolLogo from './ToolLogo.jsx'
import { buildTools } from '../lib/tools.js'
import { usePreferences } from '../lib/preferences.jsx'

// Palette de commandes (style VS Code, Ctrl/Cmd+K).
//
// La liste est ENTIÈREMENT dérivée de projects.json + des actions déjà en place :
// rien n'est codé en dur ici (un projet/outil ajouté au JSON y apparaît tout seul).
// La palette ne RE-CODE aucune logique d'ouverture : elle appelle les mêmes
// callbacks que la sidebar / le panneau Tools / les Paramètres (mêmes gardes,
// pas de doublon d'onglet).
//
// Accessibilité :
// - role="dialog" + aria-modal ; l'input est une combobox (aria-activedescendant),
//   la liste une listbox, chaque ligne une option (aria-selected sur l'active).
// - EXCEPTION ASSUMÉE à la règle « jamais de focus trap » : la palette EST une
//   modale temporaire, donc le focus est piégé dedans tant qu'elle est ouverte
//   (Tab neutralisé). À la fermeture (Échap, clic dehors, exécution), le focus est
//   RENDU à l'élément qui l'avait avant l'ouverture (cleanup de l'effet de montage),
//   et on retombe sur la nav globale sans piège.

// Match « fuzzy » par sous-séquence (couvre aussi le substring) sur du texte déjà
// en minuscules.
function fuzzyMatch(text, q) {
  if (!q) return true
  let i = 0
  for (let c = 0; c < text.length && i < q.length; c++) {
    if (text[c] === q[i]) i++
  }
  return i === q.length
}

export default function CommandPalette({
  open,
  onClose,
  projects,
  tools,
  onOpenProject,
  onOpenTool,
  onOpenReadme,
  onOpenSettings,
  onToggleView,
}) {
  if (!open) return null
  return (
    <CommandPaletteInner
      onClose={onClose}
      projects={projects}
      tools={tools}
      onOpenProject={onOpenProject}
      onOpenTool={onOpenTool}
      onOpenReadme={onOpenReadme}
      onOpenSettings={onOpenSettings}
      onToggleView={onToggleView}
    />
  )
}

// Composant interne : monté uniquement quand la palette est ouverte, ce qui
// réinitialise naturellement query/index à chaque ouverture et permet de RENDRE
// le focus dans le cleanup de l'effet de montage.
function CommandPaletteInner({
  onClose,
  projects,
  tools,
  onOpenProject,
  onOpenTool,
  onOpenReadme,
  onOpenSettings,
  onToggleView,
}) {
  const { theme, setTheme } = usePreferences()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Toutes les commandes, dérivées de la même source que le graphe / le panneau
  // Tools / la sidebar. Chaque item ne fait qu'APPELER un callback existant.
  const { actionItems, projectItems, toolItems } = useMemo(() => {
    const projectItems = projects.map((p) => ({
      key: 'project:' + p.id,
      label: `${p.name}.md`,
      hint: p.title,
      icon: <FileIcon color={`var(--icon-${p.type})`} />,
      run: () => onOpenProject(p),
    }))

    const toolItems = buildTools(projects, tools).map((t) => ({
      key: 'tool:' + t.id,
      label: t.label,
      hint: `${t.count} projet${t.count > 1 ? 's' : ''}`,
      icon: <ToolLogo logo={t.logo} color={t.color} label={t.label} shape="square" size={18} />,
      run: () => onOpenTool(t.id),
    }))

    const actionItems = [
      { key: 'action:readme', label: 'Ouvrir le README', run: onOpenReadme },
      { key: 'action:settings', label: 'Ouvrir les paramètres', run: onOpenSettings },
      { key: 'action:view', label: 'Basculer la vue IDE / Graphe', run: onToggleView },
      {
        key: 'action:theme',
        label: 'Basculer le thème clair / sombre',
        run: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
    ].map((a) => ({ ...a, isAction: true, icon: <CommandIcon size={16} /> }))

    return { actionItems, projectItems, toolItems }
  }, [projects, tools, onOpenProject, onOpenTool, onOpenReadme, onOpenSettings, onToggleView, theme, setTheme])

  // Filtrage : préfixe ">" => actions uniquement (convention VS Code), sinon tout.
  const results = useMemo(() => {
    const trimmed = query.trim()
    const actionsOnly = trimmed.startsWith('>')
    const q = (actionsOnly ? trimmed.slice(1) : trimmed).trim().toLowerCase()
    const pool = actionsOnly ? actionItems : [...actionItems, ...projectItems, ...toolItems]
    return pool.filter(
      (item) =>
        fuzzyMatch(item.label.toLowerCase(), q) ||
        (item.hint && item.hint.toLowerCase().includes(q)),
    )
  }, [query, actionItems, projectItems, toolItems])

  // Au montage : focus l'input. Au démontage (fermeture) : RENDRE le focus à
  // l'élément qui l'avait avant l'ouverture (fin du piège de focus).
  useEffect(() => {
    const previouslyFocused = document.activeElement
    inputRef.current?.focus()
    return () => {
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [])

  // Garde l'item actif dans la fenêtre visible de la liste.
  useEffect(() => {
    const node = listRef.current?.querySelector('[aria-selected="true"]')
    node?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, results])

  // Si la liste rétrécit sous l'index actif, on revient en tête.
  useEffect(() => {
    setActiveIndex((i) => (i >= results.length ? 0 : i))
  }, [results.length])

  const runItem = (item) => {
    onClose() // démonte la palette -> le cleanup rend le focus ; les actions qui
    item.run() // déplacent le focus (focusPanel) le reprennent ensuite (rAF).
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length) setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length) setActiveIndex((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = results[activeIndex]
      if (item) runItem(item)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      // Piège de focus : la palette est une modale, on garde le focus dedans.
      e.preventDefault()
    }
  }

  return (
    <div
      className="cmd-palette-overlay"
      onMouseDown={(e) => {
        // clic dans le vide (hors du panneau) => ferme
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="cmd-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Palette de commandes"
      >
        <input
          ref={inputRef}
          className="cmd-palette-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Rechercher un projet, un outil, une action…  (préfixe « > » pour les actions)"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmd-palette-list"
          aria-autocomplete="list"
          aria-activedescendant={results.length ? `cmd-opt-${activeIndex}` : undefined}
          aria-label="Palette de commandes : rechercher"
        />
        <ul className="cmd-palette-list" id="cmd-palette-list" role="listbox" ref={listRef}>
          {results.length === 0 ? (
            <li className="cmd-palette-empty" role="presentation">
              Aucun résultat
            </li>
          ) : (
            results.map((item, i) => (
              <li
                key={item.key}
                id={`cmd-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className="cmd-option"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()} // garde le focus sur l'input
                onClick={() => runItem(item)}
              >
                <span className="cmd-option-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="cmd-option-label">{item.label}</span>
                {item.hint && <span className="cmd-option-hint">{item.hint}</span>}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
