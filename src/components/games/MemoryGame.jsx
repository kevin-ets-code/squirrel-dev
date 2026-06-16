import { useState, useCallback, useEffect, useRef } from 'react'
import ToolLogo from '../ToolLogo.jsx'
import { buildTools } from '../../lib/tools.js'

// Jeu Memory (jeu de paires) — premier jeu débloquable.
// Tout le contenu ludique DÉRIVE des outils du portfolio : on tire 8 outils au
// hasard parmi ceux déduits des `stack` (buildTools, même source que ToolsPanel
// et le graphe), jamais de liste codée en dur. Garde-fou : s'il y a moins de 8
// outils, on joue avec min(8, nb) paires (la grille s'adapte).
//
// État de jeu 100 % local (useState). Système de score aligné sur Snake/Squirrel
// MAIS direction inversée : ici « mieux » = MINIMISER. On suit deux métriques en
// direct (coups joués, temps écoulé) et on persiste DEUX records INDÉPENDANTS en
// localStorage : le plus PETIT nombre de coups et le plus COURT temps. Battre l'un
// n'oblige pas à battre l'autre.
//
// Un « coup » = une tentative de PAIRE : +1 chaque fois que le joueur a retourné
// une 2e carte et qu'on évalue l'appariement (jamais à la carte individuelle).
// Le chronomètre démarre au PREMIER flip (dès que le joueur touche sa première
// carte, pas au montage — on ne pénalise pas le temps de réflexion initial) et
// s'arrête à la victoire ; il est nettoyé au démontage / à la victoire / au reset.
//
// Accessible : chaque carte est un <button> focusable, avec un aria-label
// décrivant son état (cachée / révélée / appariée). Les coups et le message de
// record sont en aria-live polite ; le TEMPS ne l'est PAS (il changerait à chaque
// tick et spammerait le lecteur d'écran). L'animation respecte
// prefers-reduced-motion (gérée en CSS).

const PAIR_COUNT = 8
const FLIP_BACK_MS = 800
const TICK_MS = 250 // rafraîchissement de l'affichage du chrono

// Records persistants (localStorage). Lecture/écriture en try/catch comme Snake.
// Différence assumée avec Snake : ce sont des MINIMUMS à battre, pas des maximums.
const BEST_MOVES_KEY = 'squirrel-dev:memory-best-moves'
const BEST_TIME_KEY = 'squirrel-dev:memory-best-time' // stocké en millisecondes

function readBest(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    const v = parseInt(raw, 10)
    return Number.isFinite(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

function writeBest(key, v) {
  try {
    localStorage.setItem(key, String(v))
  } catch {
    /* localStorage indisponible : on ignore, le jeu reste jouable */
  }
}

// mm:ss lisible (les minutes ne sont pas paddées, les secondes oui : « 1:09 »).
function formatTime(ms) {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

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

  // Score de la partie en cours.
  const [moves, setMoves] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)

  // Records persistants (null = pas encore de record).
  const [bestMoves, setBestMoves] = useState(() => readBest(BEST_MOVES_KEY))
  const [bestTime, setBestTime] = useState(() => readBest(BEST_TIME_KEY))

  // Records battus cette partie (pour la célébration sur l'écran de victoire).
  const [newMovesRecord, setNewMovesRecord] = useState(false)
  const [newTimeRecord, setNewTimeRecord] = useState(false)

  const timerRef = useRef(null) // timer de recachage des cartes non appariées
  const chronoRef = useRef(null) // intervalle du chronomètre
  const startRef = useRef(null) // timestamp du premier flip (null tant que pas démarré)
  const finalizedRef = useRef(false) // garde : la victoire n'est finalisée qu'une fois

  // Nettoie les timers en attente au démontage (évite un setState après unmount
  // et un chrono qui fuit).
  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
      clearInterval(chronoRef.current)
    },
    [],
  )

  // Démarre le chrono au tout premier flip de la partie (idempotent via startRef).
  const startChrono = useCallback(() => {
    if (startRef.current !== null) return
    startRef.current = Date.now()
    clearInterval(chronoRef.current)
    chronoRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current)
    }, TICK_MS)
  }, [])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    clearInterval(chronoRef.current)
    chronoRef.current = null
    startRef.current = null
    finalizedRef.current = false
    setDeck(buildDeck(projects, tools))
    setFlipped([])
    setMatched({})
    setLock(false)
    setMoves(0)
    setElapsedMs(0)
    setNewMovesRecord(false)
    setNewTimeRecord(false)
  }, [projects, tools])

  const pairs = deck.length / 2
  const matchedCount = Object.keys(matched).length
  const won = pairs > 0 && matchedCount === pairs

  // À la victoire : arrête le chrono, fige le temps final et compare aux records.
  // Les deux records sont indépendants ; finalizedRef garantit un seul passage
  // (robuste au double-invoke d'effet de React.StrictMode).
  useEffect(() => {
    if (!won || finalizedRef.current) return
    finalizedRef.current = true
    clearInterval(chronoRef.current)
    chronoRef.current = null
    const finalMs = startRef.current !== null ? Date.now() - startRef.current : 0
    setElapsedMs(finalMs)

    const movesBeat = bestMoves == null || moves < bestMoves
    const timeBeat = bestTime == null || finalMs < bestTime
    if (movesBeat) {
      setBestMoves(moves)
      writeBest(BEST_MOVES_KEY, moves)
    }
    if (timeBeat) {
      setBestTime(finalMs)
      writeBest(BEST_TIME_KEY, finalMs)
    }
    setNewMovesRecord(movesBeat)
    setNewTimeRecord(timeBeat)
  }, [won, moves, bestMoves, bestTime])

  const handleFlip = (index) => {
    if (lock || won) return
    const card = deck[index]
    if (matched[card.pairId]) return // déjà appariée
    if (flipped.includes(index)) return // déjà retournée (ce tour-ci)

    if (flipped.length === 0) {
      // Première carte du tour. Au tout premier flip de la partie : lance le chrono.
      startChrono()
      setFlipped([index])
      return
    }
    // Deuxième carte du tour = un COUP (une tentative de paire).
    setMoves((m) => m + 1)
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

  const recordMessage =
    newMovesRecord && newTimeRecord
      ? 'Nouveau record de coups et de temps !'
      : newMovesRecord
        ? 'Nouveau record de coups !'
        : newTimeRecord
          ? 'Nouveau record de temps !'
          : null

  return (
    <div className="memory-game">
      <div className="memory-head">
        <h1 className="memory-title">Memory</h1>
        <p className="memory-sub">
          Retrouve les {pairs} paires d'outils. {matchedCount}/{pairs} trouvée
          {matchedCount > 1 ? 's' : ''}.
        </p>
        <p className="memory-stats">
          {/* Coups en aria-live (annoncé). Temps SANS live (sinon spam à chaque tick). */}
          <span aria-live="polite">
            Coups <strong>{moves}</strong>
          </span>
          <span className="memory-stats-sep" aria-hidden="true">
            ·
          </span>
          <span>
            Temps <strong>{formatTime(elapsedMs)}</strong>
          </span>
        </p>
        <p className="memory-records">
          Record · Coups <strong>{bestMoves ?? '—'}</strong>
          <span className="memory-stats-sep" aria-hidden="true">
            ·
          </span>
          Temps <strong>{bestTime != null ? formatTime(bestTime) : '—'}</strong>
        </p>
      </div>

      {won && (
        <div className="memory-win" role="status" aria-live="polite">
          <span className="memory-win-emoji" aria-hidden="true">
            🎉
          </span>
          <span>Bravo, toutes les paires sont trouvées !</span>
          <span className="memory-win-stats">
            {moves} coups · {formatTime(elapsedMs)}
          </span>
          {recordMessage && <span className="memory-record-flash">{recordMessage}</span>}
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
