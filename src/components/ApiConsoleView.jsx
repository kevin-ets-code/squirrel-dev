import { useRef, useEffect, useMemo, useState } from 'react'
import RawView from './RawView.jsx'
import { BracesIcon } from './icons.jsx'
import { httpStatusVariant } from '../lib/api-engine.js'
import { getSuggestions } from '../lib/api-autocomplete.js'

// Zone principale de la vue API : la console fonctionnelle.
// - zone requête : champ contrôlé + bouton Send (Entrée via <form onSubmit>),
//   AVEC autocomplétion (combobox) : un dropdown suggère, pendant la frappe, ce
//   qui est valide à ce point (path + ids en v1), dérivé de getSuggestions
//   (api-autocomplete.js, source unique api-endpoints.js + projects.json) ;
// - zone réponse : ligne de statut (méthode + code colorés) + corps JSON via
//   RawView (coloration, numéros de ligne ET bouton copier réutilisés tels quels) ;
// - état vide propre avant la première requête.
// L'état (value/result) vit dans App ; ce composant est piloté par props.
//
// Accessibilité : même pattern que la palette de commandes — l'input est une
// combobox (aria-expanded/-controls/-activedescendant), la liste une listbox,
// chaque ligne une option (aria-selected). PAS de focus trap : Tab complète si
// le dropdown est ouvert, sinon sort normalement (la nav globale reste ouverte).
//
// Clavier : ↑/↓ naviguer ; Tab compléter ; Entrée = compléter si le dropdown est
// ouvert (jamais d'exécution accidentelle), sinon exécuter (form submit) ; Échap
// ferme le dropdown sans vider ni exécuter. Choisir une suggestion COMPLÈTE le
// champ sans exécuter (cohérent avec le reste de l'app : seul Send/Entrée exécute).
export default function ApiConsoleView({ value, onChange, onSend, result, focusSignal, data }) {
  const inputRef = useRef(null)
  const listRef = useRef(null)
  // Dernière valeur issue d'une action UTILISATEUR (frappe/complétion) : sert à
  // distinguer un changement de `value` venu de l'extérieur (clic endpoint
  // sidebar, rejeu de log) — qui NE doit PAS ouvrir le dropdown — d'une frappe.
  const lastUserValueRef = useRef(value)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const suggestions = useMemo(() => getSuggestions(value, data), [value, data])
  const showDropdown = open && suggestions.length > 0

  // Focalise le champ quand App pousse un signal (clic sur un endpoint).
  useEffect(() => {
    if (focusSignal) inputRef.current?.focus()
  }, [focusSignal])

  // Changement de `value` venu de l'extérieur (pré-remplissage / rejeu) : on
  // ferme le dropdown (pas d'ouverture intempestive) et on resynchronise la ref.
  useEffect(() => {
    if (value !== lastUserValueRef.current) {
      lastUserValueRef.current = value
      setOpen(false)
    }
  }, [value])

  // Si la liste rétrécit sous l'index actif, on revient en tête.
  useEffect(() => {
    setActiveIndex((i) => (i >= suggestions.length ? 0 : i))
  }, [suggestions.length])

  // Garde l'item actif dans la fenêtre visible de la liste.
  useEffect(() => {
    if (!showDropdown) return
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, showDropdown])

  const handleChange = (e) => {
    const v = e.target.value
    lastUserValueRef.current = v
    onChange(v)
    setOpen(true)
    setActiveIndex(0)
  }

  // Applique une suggestion : remplace le champ par la ligne complète résultante,
  // SANS exécuter. Reste ouvert (montre le niveau suivant si dispo, sinon le
  // dropdown se vide naturellement) ; replace le curseur en fin de champ.
  const applySuggestion = (s) => {
    lastUserValueRef.current = s.apply
    onChange(s.apply)
    setOpen(true)
    setActiveIndex(0)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setOpen(false)
    onSend(value)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!showDropdown) return
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      if (!showDropdown) return
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Tab') {
      // Compléter si une suggestion est surlignée ; sinon Tab par défaut (sortie).
      if (showDropdown && suggestions[activeIndex]) {
        e.preventDefault()
        applySuggestion(suggestions[activeIndex])
      }
    } else if (e.key === 'Enter') {
      // Dropdown ouvert → compléter (jamais exécuter) ; fermé → laisse le form
      // submit exécuter (comportement historique de la console).
      if (showDropdown && suggestions[activeIndex]) {
        e.preventDefault()
        applySuggestion(suggestions[activeIndex])
      }
    } else if (e.key === 'Escape') {
      if (showDropdown) {
        e.preventDefault()
        setOpen(false)
      }
    }
  }

  return (
    <div className="api-console">
      <form className="api-req" onSubmit={handleSubmit}>
        <div className="api-ac">
          <input
            ref={inputRef}
            className="api-req-input"
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            placeholder="GET /projects"
            aria-label="Requête API (méthode et chemin, ex. GET /projects)"
            spellCheck={false}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="api-ac-list"
            aria-autocomplete="list"
            aria-activedescendant={showDropdown ? `api-ac-opt-${activeIndex}` : undefined}
          />
          {showDropdown && (
            <ul className="api-ac-list" id="api-ac-list" role="listbox" ref={listRef}>
              {suggestions.map((s, i) => (
                <li
                  key={s.id}
                  id={`api-ac-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className="api-ac-option"
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()} // garde le focus sur l'input
                  onClick={() => applySuggestion(s)}
                >
                  <span className="api-ac-value">{s.value}</span>
                  {s.hint && <span className="api-ac-hint">{s.hint}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="submit" className="api-send-btn">
          Send
        </button>
      </form>

      <div className="api-res">
        {result ? (
          <>
            <div className="api-status" role="status" aria-live="polite">
              <span className="api-status-req">
                {result.method} {result.path}
              </span>
              <span className={'api-status-code api-code-' + httpStatusVariant(result.status)}>
                {result.status} {result.statusText}
              </span>
            </div>
            <RawView content={JSON.stringify(result.body, null, 2)} format="json" />
          </>
        ) : (
          <div className="api-console-empty">
            <BracesIcon size={40} />
            <h2>Console API</h2>
            <p>
              Tape une requête puis Entrée — par exemple <code>GET /projects</code>. Les
              endpoints disponibles sont listés dans la barre latérale (clique pour
              pré-remplir).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
