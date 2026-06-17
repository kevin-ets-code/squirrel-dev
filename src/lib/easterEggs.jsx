import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// ============================================================
// État des easter eggs (déblocage du « mode Jeux »).
// État d'INTERFACE, pas du contenu → ne vit PAS dans projects.json : persisté
// dans localStorage via ce contexte, monté à la racine (main.jsx) pour que tous
// les composants (App, palette, panneau Jeux, page konami-code.md) partagent le
// MÊME état de déblocage.
//
// Couche 1 (cette étape) : easterEggUnlocked → débloque le panneau « Jeux » + la
//   page konami-code.md (Konami Code OU commande cachée « > konami »).
// Couche 2 (étapes suivantes) : gamesUnlocked[id] → chaque jeu se débloque en
//   résolvant son énigme. unlockGame(id) est déjà prête pour ça.
// ============================================================

const STORAGE_KEY = 'squirrel-dev:easter-eggs'

const DEFAULT_STATE = {
  easterEggUnlocked: false,
  gamesUnlocked: {},
  // Pages-récompense persistantes, une par jeu (flags à PLAT, même objet
  // localStorage). Rétrocompat : un état stocké ancien n'a que snakeVictory ; les
  // deux autres retombent sur false via la lecture défensive de readStored.
  snakeVictory: false,
  memoryVictory: false,
  squirrelVictory: false,
}

// Lecture défensive : localStorage peut throw (mode privé, quota) et le JSON
// peut être absent/corrompu → on retombe toujours sur l'état par défaut.
function readStored() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return {
      easterEggUnlocked: !!parsed.easterEggUnlocked,
      gamesUnlocked:
        parsed.gamesUnlocked && typeof parsed.gamesUnlocked === 'object'
          ? parsed.gamesUnlocked
          : {},
      snakeVictory: !!parsed.snakeVictory,
      memoryVictory: !!parsed.memoryVictory,
      squirrelVictory: !!parsed.squirrelVictory,
    }
  } catch {
    return DEFAULT_STATE
  }
}

const EasterEggsContext = createContext(null)

export function EasterEggsProvider({ children }) {
  const [state, setState] = useState(readStored)

  // Persiste à chaque changement (try/catch : l'écriture peut échouer ; l'état
  // reste alors valide en mémoire pour la session).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* localStorage indisponible : on ignore, l'état vit en mémoire. */
    }
  }, [state])

  // Couche 1 : débloque le mode Jeux. Idempotent (ne réécrit pas si déjà fait).
  const unlockKonami = useCallback(() => {
    setState((s) => (s.easterEggUnlocked ? s : { ...s, easterEggUnlocked: true }))
  }, [])

  // Couche 2 (servira plus tard) : marque un jeu comme débloqué. Idempotent.
  const unlockGame = useCallback((id) => {
    setState((s) =>
      s.gamesUnlocked[id] ? s : { ...s, gamesUnlocked: { ...s.gamesUnlocked, [id]: true } },
    )
  }, [])

  // Victoire-récompense d'un jeu (grille parfaite Snake, partie parfaite Memory,
  // palier Squirrel) : débloque la page victory-<jeu>.md. Primitive GÉNÉRIQUE
  // paramétrée par l'id du jeu → flag à plat `<id>Victory`. Persisté dans le MÊME
  // objet localStorage que les autres flags. Idempotent.
  const unlockVictory = useCallback((id) => {
    const key = id + 'Victory'
    setState((s) => (s[key] ? s : { ...s, [key]: true }))
  }, [])

  // Alias conservé pour la rétrocompat de l'API (anciens appels Snake).
  const unlockSnakeVictory = useCallback(() => unlockVictory('snake'), [unlockVictory])

  const value = {
    easterEggUnlocked: state.easterEggUnlocked,
    gamesUnlocked: state.gamesUnlocked,
    snakeVictory: state.snakeVictory,
    memoryVictory: state.memoryVictory,
    squirrelVictory: state.squirrelVictory,
    unlockKonami,
    unlockGame,
    unlockVictory,
    unlockSnakeVictory,
  }

  return <EasterEggsContext.Provider value={value}>{children}</EasterEggsContext.Provider>
}

export function useEasterEggs() {
  const ctx = useContext(EasterEggsContext)
  if (!ctx) throw new Error('useEasterEggs must be used within <EasterEggsProvider>')
  return ctx
}
