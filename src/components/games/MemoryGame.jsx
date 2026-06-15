import { useState, useCallback, useEffect, useRef } from 'react'
import ToolLogo from '../ToolLogo.jsx'
import { buildTools } from '../../lib/tools.js'

// Jeu Memory (jeu de paires) — premier jeu débloquable.
// Tout le contenu ludique DÉRIVE des outils du portfolio : on tire 8 outils au
// hasard parmi ceux déduits des `stack` (buildTools, même source que ToolsPanel
// et le graphe), jamais de liste codée en dur. Garde-fou : s'il y a moins de 8
// outils, on joue avec min(8, nb) paires (la grille s'adapte).
//
// État 100 % local (useState), aucune persistance, pas de score ni de timer.
// Accessible : chaque carte est un <button> focusable, avec un aria-label
// décrivant son état (cachée / révélée / appariée). L'animation de retournement
// respecte prefers-reduced-motion (gérée en CSS).

const PAIR_COUNT = 8
const FLIP_BACK_MS = 800

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Construit un deck mélangé de paires à partir d'un échantillon aléatoire d'outils.
function buildDeck(projects, tools) {
  const all = buildTools(projects, tools)
  const count = Math.min(PAIR_COUNT, all.length)
  const picked = shuffle(all).slice(0, count)
  const cards = []
  for (const tool of picked) {
    cards.push({ key: tool.id + '-a', pairId: tool.id, tool })
    cards.push({ key: tool.id + '-b', pairId: tool.id, tool })
  }
  return shuffle(cards)
}

export default function MemoryGame({ projects, tools }) {
  const [deck, setDeck] = useState(() => buildDeck(projects, tools))
  const [flipped, setFlipped] = useState([]) // indices retournés en cours (0, 1 ou 2)
  const [matched, setMatched] = useState({}) // pairId -> true
  const [lock, setLock] = useState(false) // bloque les clics pendant l'attente
  const timerRef = useRef(null)

  // Nettoie le timer en attente au démontage (évite un setState après unmount).
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    setDeck(buildDeck(projects, tools))
    setFlipped([])
    setMatched({})
    setLock(false)
  }, [projects, tools])

  const pairs = deck.length / 2
  const matchedCount = Object.keys(matched).length
  const won = pairs > 0 && matchedCount === pairs

  const handleFlip = (index) => {
    if (lock || won) return
    const card = deck[index]
    if (matched[card.pairId]) return // déjà appariée
    if (flipped.includes(index)) return // déjà retournée (ce tour-ci)

    if (flipped.length === 0) {
      setFlipped([index])
      return
    }
    // Deuxième carte du tour.
    const first = deck[flipped[0]]
    if (first.pairId === card.pairId) {
      // Paire trouvée : on la marque appariée (les deux cartes partagent pairId,
      // donc restent révélées) et on libère le tour immédiatement.
      setMatched((m) => ({ ...m, [card.pairId]: true }))
      setFlipped([])
    } else {
      // Échec : on montre les deux cartes, on bloque, puis on les recache.
      setFlipped([flipped[0], index])
      setLock(true)
      timerRef.current = setTimeout(() => {
        setFlipped([])
        setLock(false)
      }, FLIP_BACK_MS)
    }
  }

  if (pairs === 0) {
    return (
      <div className="memory-game">
        <p className="memory-empty">Aucun outil disponible pour générer une partie.</p>
      </div>
    )
  }

  const cols = Math.min(4, deck.length) // 4 colonnes (ou moins si tout petit deck)

  return (
    <div className="memory-game">
      <div className="memory-head">
        <h1 className="memory-title">Memory</h1>
        <p className="memory-sub">
          Retrouve les {pairs} paires d'outils. {matchedCount}/{pairs} trouvée
          {matchedCount > 1 ? 's' : ''}.
        </p>
      </div>

      {won && (
        <div className="memory-win" role="status" aria-live="polite">
          <span className="memory-win-emoji" aria-hidden="true">
            🎉
          </span>
          <span>Bravo, toutes les paires sont trouvées !</span>
          <button type="button" className="memory-replay" onClick={reset}>
            Rejouer
          </button>
        </div>
      )}

      <div
        className="memory-grid"
        style={{ '--memory-cols': cols }}
        role="group"
        aria-label="Grille de cartes Memory"
      >
        {deck.map((card, i) => {
          const isMatched = !!matched[card.pairId]
          const isRevealed = isMatched || flipped.includes(i)
          const label = isMatched
            ? `Paire trouvée : ${card.tool.label}`
            : isRevealed
              ? `Carte révélée : ${card.tool.label}`
              : `Carte cachée, position ${i + 1}`
          return (
            <button
              key={card.key}
              type="button"
              className={
                'memory-card' +
                (isRevealed ? ' is-revealed' : '') +
                (isMatched ? ' is-matched' : '')
              }
              onClick={() => handleFlip(i)}
              disabled={isMatched || lock || won}
              aria-label={label}
            >
              <span className="memory-card-inner">
                <span className="memory-card-face memory-card-back" aria-hidden="true">
                  ?
                </span>
                <span className="memory-card-face memory-card-front" aria-hidden="true">
                  <ToolLogo
                    logo={card.tool.logo}
                    color={card.tool.color}
                    label={card.tool.label}
                    shape="square"
                    size={40}
                  />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
