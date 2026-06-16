import { useCallback, useEffect, useRef, useState } from 'react'
import useIsMobile from '../../lib/useIsMobile.js'

// Jeu Snake — second jeu débloquable.
//
// Architecture (cf. CLAUDE.md / GUIDE.md « partie ludique ») :
// - Rendu sur <canvas> : la grille, le serpent et la nourriture ne sont PAS du
//   DOM React. Tout l'état « chaud » du jeu (serpent, direction, nourriture) vit
//   dans des refs pour éviter les re-renders à chaque tick et les closures
//   périmées dans la boucle. React ne porte que ce qui s'affiche en surface :
//   statut (idle/playing/over), score courant, meilleur score, flash visuel.
// - Boucle de jeu : un seul setInterval (logique discrète = plus simple et stable
//   qu'un rAF + accumulateur pour un jeu en grille). La boucle est NETTOYÉE au
//   démontage. La vitesse augmente doucement avec le score : on relance
//   l'intervalle quand le pas de temps change (bucket de vitesse).
// - Le canvas LIT les variables CSS (getComputedStyle sur :root) à chaque draw,
//   donc il suit le thème (clair/sombre) et l'accent choisi au runtime sans code
//   en plus. C'est appelé ~10×/s, coût négligeable.
// - Reçoit { projects, tools } comme MemoryGame (signature homogène) même s'il ne
//   s'en sert pas encore (un futur logo d'outil comme nourriture pourra l'utiliser).
//
// Accessibilité : la zone de jeu est focusable (tabIndex 0) + aria-label, les
// scores sont lisibles (aria-live), et les contrôles tactiles mobiles sont de
// vrais <button>. Les flèches/ZQSD ne scrollent pas la page pendant la partie.

const GRID = 20 // cellules par côté
const BASE_MS = 130 // intervalle de départ (ms)
const MIN_MS = 70 // intervalle le plus rapide
const MAX_CANVAS_PX = 480 // taille max du canvas sur desktop
const BEST_KEY = 'squirrel-dev:snake-best'

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

function readBest() {
  try {
    const v = parseInt(localStorage.getItem(BEST_KEY) || '0', 10)
    return Number.isFinite(v) && v > 0 ? v : 0
  } catch {
    return 0
  }
}

function writeBest(v) {
  try {
    localStorage.setItem(BEST_KEY, String(v))
  } catch {
    /* localStorage indisponible : on ignore, le jeu reste jouable */
  }
}

// Place la nourriture sur une cellule libre (jamais sur le serpent). Renvoie null
// si la grille est pleine (victoire théorique : le serpent occupe tout).
function randomFood(snake) {
  const free = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!snake.some((c) => c.x === x && c.y === y)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.floor(Math.random() * free.length)]
}

// Dessine un rectangle arrondi (repli fillRect si roundRect indisponible).
function fillRound(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}

export default function SnakeGame(/* { projects, tools } */) {
  const isMobile = useIsMobile()

  const [status, setStatus] = useState('idle') // 'idle' | 'playing' | 'over'
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)
  const [eatPulse, setEatPulse] = useState(0) // re-déclenche le flash CSS à chaque prise

  // État « chaud » du jeu : en refs pour la boucle (pas de re-render par tick).
  const snakeRef = useRef([])
  const dirRef = useRef(DIRS.right) // direction effectivement appliquée au dernier pas
  const nextDirRef = useRef(DIRS.right) // direction en attente (anti demi-tour)
  const foodRef = useRef({ x: 0, y: 0 })
  const scoreRef = useRef(0)
  const statusRef = useRef('idle')
  const intervalRef = useRef(null)
  const tickMsRef = useRef(BASE_MS)
  const flashTimerRef = useRef(null)

  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const sizeRef = useRef(MAX_CANVAS_PX) // taille CSS courante (carré)

  // statusRef suit l'état (utilisé dans les handlers clavier/tactiles sans closure périmée).
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // --- Rendu canvas ----------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const css = getComputedStyle(document.documentElement)
    const accent = css.getPropertyValue('--accent').trim() || '#4ec9b0'
    const bg = css.getPropertyValue('--bg-editor').trim() || '#1e1e1e'
    const grid = css.getPropertyValue('--border-soft').trim() || '#2b2b2b'

    const size = sizeRef.current
    const cell = size / GRID

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)

    // Quadrillage discret.
    ctx.strokeStyle = grid
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < GRID; i++) {
      const p = Math.round(i * cell) + 0.5
      ctx.moveTo(p, 0)
      ctx.lineTo(p, size)
      ctx.moveTo(0, p)
      ctx.lineTo(size, p)
    }
    ctx.stroke()

    // Nourriture : carré accent évidé (anneau) pour la distinguer du corps plein.
    const f = foodRef.current
    const fx = f.x * cell
    const fy = f.y * cell
    ctx.fillStyle = accent
    fillRound(ctx, fx + 2, fy + 2, cell - 4, cell - 4, Math.max(2, cell * 0.18))
    ctx.fillStyle = bg
    const hole = cell * 0.34
    fillRound(ctx, fx + (cell - hole) / 2, fy + (cell - hole) / 2, hole, hole, hole * 0.3)

    // Serpent : corps plein accent ; tête éclaircie d'un voile blanc translucide.
    const snake = snakeRef.current
    const radius = Math.max(2, cell * 0.22)
    for (let i = 0; i < snake.length; i++) {
      const c = snake[i]
      ctx.fillStyle = accent
      fillRound(ctx, c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2, radius)
      if (i === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
        fillRound(ctx, c.x * cell + 1, c.y * cell + 1, cell - 2, cell - 2, radius)
      }
    }
  }, [])

  // Dimensionne le canvas pour la largeur dispo, en cellules carrées, net en DPR.
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const avail = wrap.clientWidth || MAX_CANVAS_PX
    // Taille CSS = multiple entier de GRID pour des cellules pile carrées.
    const target = Math.min(avail, MAX_CANVAS_PX)
    const cell = Math.max(8, Math.floor(target / GRID))
    const cssSize = cell * GRID
    const dpr = window.devicePixelRatio || 1
    sizeRef.current = cssSize
    canvas.style.width = cssSize + 'px'
    canvas.style.height = cssSize + 'px'
    canvas.width = Math.round(cssSize * dpr)
    canvas.height = Math.round(cssSize * dpr)
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // dessin en px CSS
    draw()
  }, [draw])

  useEffect(() => {
    resize()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resize()) : null
    if (ro && wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', resize)
    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [resize])

  // --- Boucle de jeu ---------------------------------------------------------
  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const gameOver = useCallback(() => {
    stopLoop()
    statusRef.current = 'over'
    setStatus('over')
    setBest((prev) => {
      const next = Math.max(prev, scoreRef.current)
      if (next > prev) writeBest(next)
      return next
    })
    draw()
  }, [stopLoop, draw])

  const step = useCallback(() => {
    const dir = nextDirRef.current
    dirRef.current = dir
    const snake = snakeRef.current
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }

    // Murs mortels.
    if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID) {
      gameOver()
      return
    }

    const willEat = head.x === foodRef.current.x && head.y === foodRef.current.y
    // Corps qui occupera l'espace après le pas : la queue se libère si on ne mange pas.
    const occupied = willEat ? snake : snake.slice(0, snake.length - 1)
    if (occupied.some((c) => c.x === head.x && c.y === head.y)) {
      gameOver()
      return
    }

    snakeRef.current = [head, ...occupied]

    if (willEat) {
      const newScore = scoreRef.current + 1
      scoreRef.current = newScore
      setScore(newScore)
      setEatPulse((p) => p + 1)
      const food = randomFood(snakeRef.current)
      if (!food) {
        // Grille pleine : victoire — on s'arrête proprement.
        gameOver()
        return
      }
      foodRef.current = food
      // Accélération douce : relance l'intervalle si le pas de temps change.
      const nextMs = Math.max(MIN_MS, BASE_MS - newScore * 4)
      if (nextMs !== tickMsRef.current) {
        tickMsRef.current = nextMs
        stopLoop()
        intervalRef.current = setInterval(step, nextMs)
      }
    }

    draw()
  }, [gameOver, stopLoop, draw])

  const start = useCallback(
    (initialDir) => {
      stopLoop()
      const mid = Math.floor(GRID / 2)
      // Serpent initial de 3 cellules, orienté vers la droite.
      snakeRef.current = [
        { x: mid, y: mid },
        { x: mid - 1, y: mid },
        { x: mid - 2, y: mid },
      ]
      const dir = initialDir || DIRS.right
      dirRef.current = dir
      nextDirRef.current = dir
      foodRef.current = randomFood(snakeRef.current) || { x: 0, y: 0 }
      scoreRef.current = 0
      tickMsRef.current = BASE_MS
      setScore(0)
      statusRef.current = 'playing'
      setStatus('playing')
      draw()
      intervalRef.current = setInterval(step, BASE_MS)
      // Focus la zone pour capter le clavier (sans scroller la page).
      wrapRef.current?.focus({ preventScroll: true })
    },
    [stopLoop, draw, step],
  )

  // Changement de direction (clavier ET boutons tactiles partagent cette logique).
  // Garde anti demi-tour : on refuse l'inverse exact de la direction courante.
  const turn = useCallback(
    (name) => {
      const d = DIRS[name]
      if (!d) return
      const st = statusRef.current
      if (st === 'idle') {
        start(d)
        return
      }
      if (st !== 'playing') return
      const cur = dirRef.current
      if (d.x === -cur.x && d.y === -cur.y) return // demi-tour interdit
      nextDirRef.current = d
    },
    [start],
  )

  const onKeyDown = useCallback(
    (e) => {
      let name = null
      switch (e.key) {
        case 'ArrowUp':
        case 'z':
        case 'Z':
          name = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          name = 'down'
          break
        case 'ArrowLeft':
        case 'q':
        case 'Q':
          name = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          name = 'right'
          break
        case ' ':
        case 'Enter':
          // Espace/Entrée : démarre (idle) ou rejoue (game over).
          if (statusRef.current !== 'playing') {
            e.preventDefault()
            start()
          }
          return
        default:
          return
      }
      // Empêche les flèches de scroller la page pendant le jeu.
      e.preventDefault()
      turn(name)
    },
    [turn, start],
  )

  // Nettoyage au démontage : boucle + timer de flash.
  useEffect(
    () => () => {
      stopLoop()
      clearTimeout(flashTimerRef.current)
    },
    [stopLoop],
  )

  // Flash visuel discret à chaque prise (auto-désactivé, respecte
  // prefers-reduced-motion côté CSS).
  const [flashOn, setFlashOn] = useState(false)
  useEffect(() => {
    if (eatPulse === 0) return
    setFlashOn(true)
    clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFlashOn(false), 180)
  }, [eatPulse])

  const padBtn = (name, label, glyph) => (
    <button
      type="button"
      className="snake-pad-btn"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault() // évite le scroll/zoom tactile et garde le focus géré à la main
        turn(name)
      }}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  )

  return (
    <div className="snake-game">
      <div className="snake-head">
        <h1 className="snake-title">Snake</h1>
        <p className="snake-scores" aria-live="polite">
          Score <strong>{score}</strong> · Meilleur <strong>{best}</strong>
        </p>
      </div>

      <div
        ref={wrapRef}
        className={'snake-stage' + (flashOn ? ' is-eating' : '') + (status === 'over' ? ' is-over' : '')}
        tabIndex={0}
        role="application"
        aria-label="Jeu Snake. Flèches ou ZQSD pour diriger le serpent. Espace pour démarrer ou rejouer."
        onKeyDown={onKeyDown}
      >
        <canvas ref={canvasRef} className="snake-canvas" />

        {status === 'idle' && (
          <div className="snake-overlay">
            <p className="snake-overlay-title">Snake</p>
            <p className="snake-overlay-sub">
              {isMobile ? 'Appuie sur une flèche pour démarrer' : 'Une touche (flèches / ZQSD) pour démarrer'}
            </p>
            <button type="button" className="snake-btn" onClick={() => start()}>
              Démarrer
            </button>
          </div>
        )}

        {status === 'over' && (
          <div className="snake-overlay" role="status" aria-live="polite">
            <p className="snake-overlay-title">Game Over</p>
            <p className="snake-overlay-sub">
              Score {score} / meilleur {best}
            </p>
            <button type="button" className="snake-btn" onClick={() => start()}>
              Rejouer
            </button>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="snake-pad" role="group" aria-label="Contrôles directionnels">
          <div className="snake-pad-row">{padBtn('up', 'Haut', '▲')}</div>
          <div className="snake-pad-row">
            {padBtn('left', 'Gauche', '◀')}
            {padBtn('down', 'Bas', '▼')}
            {padBtn('right', 'Droite', '▶')}
          </div>
        </div>
      )}
    </div>
  )
}
