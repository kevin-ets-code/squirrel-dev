import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// ============================================================
// Préférences UTILISATEUR (état UI, PAS du contenu).
// Ne vit PAS dans projects.json : persisté dans localStorage via ce contexte.
// Monté à la racine (main.jsx) pour que les effets s'appliquent à toute l'app,
// que l'onglet Settings soit ouvert ou non.
// ============================================================

const STORAGE_THEME = 'pref:theme' // 'dark' | 'light' | (absent = suivre le système)
const STORAGE_ACCENT = 'pref:accent' // hex | (absent = accent par défaut du thème)

// Palette d'accents prédéfinis (pas de picker libre). Valeurs de luminance
// proche du teal par défaut → bon contraste en sombre ET en clair.
export const ACCENT_PRESETS = [
  { id: 'teal', label: 'Teal', value: '#4ec9b0' }, // défaut (= --accent du :root)
  { id: 'blue', label: 'Bleu', value: '#569cd6' },
  { id: 'violet', label: 'Violet', value: '#c586c0' },
  { id: 'green', label: 'Vert', value: '#6dbf67' },
  { id: 'amber', label: 'Ambre', value: '#e0b341' },
]
export const DEFAULT_ACCENT = ACCENT_PRESETS[0].value

const PreferencesContext = createContext(null)

const prefersLight = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: light)').matches

function readStoredTheme() {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_THEME) : null
  return v === 'dark' || v === 'light' ? v : null
}

export function PreferencesProvider({ children }) {
  // explicitTheme = null tant que l'utilisateur n'a pas choisi → on suit le système.
  const [explicitTheme, setExplicitTheme] = useState(readStoredTheme)
  const [systemTheme, setSystemTheme] = useState(() => (prefersLight() ? 'light' : 'dark'))
  const [accent, setAccentState] = useState(
    () => (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_ACCENT) : null) || null,
  )

  // Suit le système EN DIRECT tant qu'aucun choix explicite n'a été fait.
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e) => setSystemTheme(e.matches ? 'light' : 'dark')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Thème effectif : choix explicite sinon thème système.
  const theme = explicitTheme ?? systemTheme
  const isSystemTheme = explicitTheme === null

  // Applique le thème : surcharge le jeu de variables via [data-theme] sur <html>.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Applique l'accent au runtime : surcharge --accent sur <html> (inline > feuille).
  // Vide => on retire la surcharge et l'accent par défaut du :root reprend.
  useEffect(() => {
    const root = document.documentElement
    if (accent) root.style.setProperty('--accent', accent)
    else root.style.removeProperty('--accent')
  }, [accent])

  // Toggle/choix explicite : persiste et arrête de suivre le système.
  const setTheme = useCallback((next) => {
    setExplicitTheme(next)
    localStorage.setItem(STORAGE_THEME, next)
  }, [])

  const setAccent = useCallback((value) => {
    setAccentState(value)
    localStorage.setItem(STORAGE_ACCENT, value)
  }, [])

  // Revient à l'accent par défaut du thème (retire la surcharge).
  const resetAccent = useCallback(() => {
    setAccentState(null)
    localStorage.removeItem(STORAGE_ACCENT)
  }, [])

  const value = {
    theme,
    setTheme,
    isSystemTheme,
    accent, // null = accent par défaut
    setAccent,
    resetAccent,
    presets: ACCENT_PRESETS,
    defaultAccent: DEFAULT_ACCENT,
  }

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within <PreferencesProvider>')
  return ctx
}
