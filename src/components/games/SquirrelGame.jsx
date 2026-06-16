import { useCallback, useEffect, useRef, useState } from 'react'
import useIsMobile from '../../lib/useIsMobile.js'
import { buildTools } from '../../lib/tools.js'

// Jeu Squirrel — endless runner type « Dino Chrome », troisième jeu débloquable.
//
// Architecture (même esprit que SnakeGame, cf. CLAUDE.md / GUIDE.md « partie ludique ») :
// - Rendu sur <canvas> : l'écureuil, le sol et les obstacles ne sont PAS du DOM
//   React. Tout l'état « chaud » (hauteur de saut, vitesse, obstacles, distance)
//   vit dans des refs : la boucle tourne en requestAnimationFrame sans déclencher
//   de re-render par frame. React ne porte que la surface : statut (idle/playing/
//   over), score affiché, meilleur score, et l'animation de game over.
// - Boucle : requestAnimationFrame avec un dt borné (physique continue = plus
//   naturel qu'un setInterval pour un runner). Annulée au démontage et au game over.
// - Le canvas LIT les variables CSS (getComputedStyle sur :root) à chaque draw,
//   donc il suit le thème (clair/sombre) et l'accent choisi au runtime. L'écureuil
//   est en var(--accent), le sol/les obstacles en couleurs neutres du thème.
// - Reçoit { projects, tools } comme les autres jeux (signature homogène) même
//   s'il ne s'en sert pas.
//
// Modèle de saut « Mario » : à l'appui on donne une vitesse verticale ; tant que
// la touche reste MAINTENUE et que l'écureuil MONTE encore (et sous un plafond de
// durée), la gravité appliquée est RÉDUITE → il monte plus haut. Dès qu'on relâche
// (ou qu'on dépasse le plafond, ou qu'on atteint le sommet), la gravité PLEINE
// reprend → la chute s'accélère. Relâcher tôt = petit saut. Pas de double saut.
//
// Accessibilité : zone focusable (tabIndex 0) role="application" + aria-label
// décrivant les contrôles ; scores en aria-live ; contrôles tactiles = vrais
// <button> focusables. Espace/flèches ne scrollent pas la page pendant la partie.

const MAX_CANVAS_PX = 600 // largeur max du canvas sur desktop
const ASPECT = 0.42 // hauteur = largeur × ASPECT (bande horizontale type Dino)
const BEST_KEY = 'squirrel-dev:squirrel-best'
const SCORE_DIV = 10 // distance px ÷ SCORE_DIV = score affiché

// Résolution de bake des silhouettes blanches (px) : assez haute pour rester
// nette une fois redimensionnée dans un bloc-obstacle à n'importe quel DPR.
// Même approche que la nourriture du Snake (cf. SnakeGame).
const LOGO_BAKE_PX = 128

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

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

// Toutes les constantes dérivées de la taille courante du canvas (W, H en px CSS),
// pour que la physique et les silhouettes restent proportionnées à n'importe
// quelle largeur / DPR. Recalculé à chaque frame (coût négligeable).
function metrics(W, H) {
  const groundY = Math.round(H * 0.84) // y (écran) du haut du sol
  const bodyW = H * 0.2
  const bodyH = H * 0.34
  const crouchH = bodyH * 0.55
  const crouchW = bodyW * 1.25
  const leftX = Math.max(36, W * 0.12) // X fixe de l'écureuil

  // Saut : on vise un sommet `apex` atteint en `tApex` secondes en maintenant.
  // Cinématique à décélération constante : v0 = 2·apex/t, g = v0/t.
  const apex = H * 0.46
  const tApex = 0.4
  const jumpV0 = (2 * apex) / tApex
  const gHold = jumpV0 / tApex // gravité réduite tant qu'on monte en maintenant
  const gFall = gHold * 2.4 // gravité pleine (relâché / redescente / plafond)
  const maxHold = tApex // plafond de DURÉE du maintien → borne la hauteur

  // Vitesse de défilement : croît avec la distance, plafonnée.
  const speed0 = H * 1.3
  const speedMax = speed0 * 1.9

  return {
    groundY,
    bodyW,
    bodyH,
    crouchH,
    crouchW,
    leftX,
    jumpV0,
    gHold,
    gFall,
    maxHold,
    speed0,
    speedMax,
  }
}

export default function SquirrelGame({ projects, tools }) {
  const isMobile = useIsMobile()

  const [status, setStatus] = useState('idle') // 'idle' | 'playing' | 'over'
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  // État « chaud » : en refs pour la boucle (pas de re-render par frame).
  const statusRef = useRef('idle')
  const hRef = useRef(0) // hauteur de l'écureuil AU-DESSUS du sol (px, ≥ 0)
  const vRef = useRef(0) // vitesse verticale (px/s, positif = vers le haut)
  const onGroundRef = useRef(true)
  const jumpHoldRef = useRef(0) // temps de maintien écoulé pendant la montée (s)
  const holdingJumpRef = useRef(false)
  const holdingDownRef = useRef(false)
  const obstaclesRef = useRef([]) // { x, y, w, h, kind: 'ground' | 'air', logo: id|null }
  const traveledRef = useRef(0) // distance parcourue (px) = score brut
  const spawnDistRef = useRef(0) // distance restante avant le prochain obstacle
  const scoreShownRef = useRef(0) // dernier score (entier) poussé dans React
  const rafRef = useRef(null)
  const lastRef = useRef(0)

  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const sizeRef = useRef({ w: MAX_CANVAS_PX, h: Math.round(MAX_CANVAS_PX * ASPECT) })

  // Logos d'outils préchargés et déjà reteintés en BLANC (silhouette), prêts à
  // dessiner sur les blocs-obstacles (même pattern que la nourriture du Snake).
  const logoSpritesRef = useRef(new Map()) // id -> <canvas> offscreen (silhouette blanche)
  const logoColorsRef = useRef(new Map()) // id -> color de marque (hex), '' si absente
  const logoIdsRef = useRef([]) // ids effectivement chargés (pool de tirage)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  // Préchargement des logos d'outils (outils avec champ logo non vide). PIÈGE
  // résolu comme dans SnakeGame : drawImage ignore les filtres CSS, donc on
  // pré-cuit chaque logo en silhouette BLANCHE via globalCompositeOperation
  // 'source-in' + fillRect blanc — fait UNE fois au chargement, le draw reste
  // léger (aucune image rechargée par frame). On mémorise aussi la color de
  // marque de chaque outil. Si AUCUN outil n'a de logo, les refs restent vides
  // et le rendu retombe seul sur le bloc plein d'origine (cf. draw).
  useEffect(() => {
    const withLogo = buildTools(projects, tools).filter((t) => t.logo)
    let cancelled = false
    for (const t of withLogo) {
      const img = new Image()
      img.onload = () => {
        if (cancelled) return
        try {
          const off = document.createElement('canvas')
          off.width = LOGO_BAKE_PX
          off.height = LOGO_BAKE_PX
          const octx = off.getContext('2d')
          // Contain : on fait tenir le logo dans le carré sans le déformer.
          const iw = img.naturalWidth || LOGO_BAKE_PX
          const ih = img.naturalHeight || LOGO_BAKE_PX
          const scale = Math.min(LOGO_BAKE_PX / iw, LOGO_BAKE_PX / ih)
          const dw = iw * scale
          const dh = ih * scale
          octx.drawImage(img, (LOGO_BAKE_PX - dw) / 2, (LOGO_BAKE_PX - dh) / 2, dw, dh)
          // Reteinte BLANCHE : on ne garde que la silhouette (alpha) remplie de blanc.
          octx.globalCompositeOperation = 'source-in'
          octx.fillStyle = '#ffffff'
          octx.fillRect(0, 0, LOGO_BAKE_PX, LOGO_BAKE_PX)
          logoSpritesRef.current.set(t.id, off)
          logoColorsRef.current.set(t.id, t.color || '')
          if (!logoIdsRef.current.includes(t.id)) logoIdsRef.current.push(t.id)
        } catch {
          /* image problématique (taint, SVG vide…) : on l'ignore, repli bloc plein */
        }
      }
      img.src = t.logo
    }
    return () => {
      cancelled = true
    }
  }, [projects, tools])

  // --- Rendu canvas ----------------------------------------------------------
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const css = getComputedStyle(document.documentElement)
    const accent = css.getPropertyValue('--accent').trim() || '#4ec9b0'
    const bg = css.getPropertyValue('--bg-editor').trim() || '#1e1e1e'
    const ground = css.getPropertyValue('--border').trim() || '#3a3a3a'
    const obstacle = css.getPropertyValue('--fg-muted').trim() || '#858585'
    // Repli du fond de bloc quand l'outil tiré n'a pas de color (même règle que
    // ToolLogo / la nourriture Snake). Résolu ici car le canvas n'accepte pas
    // fillStyle = 'var(--…)'.
    const toolBadgeFallback = css.getPropertyValue('--tool-badge-fallback').trim() || '#5a5a5a'

    const { w: W, h: H } = sizeRef.current
    const m = metrics(W, H)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Sol : une ligne nette + un léger remplissage sous le niveau.
    ctx.fillStyle = ground
    ctx.fillRect(0, m.groundY, W, 2)
    ctx.fillStyle = 'rgba(127, 127, 127, 0.06)'
    ctx.fillRect(0, m.groundY + 2, W, H - m.groundY)

    // Obstacles = blocs-logos d'outils (fil rouge avec Memory et la nourriture
    // Snake). Le BLOC reste un rectangle plein = c'est la HITBOX VISIBLE (la
    // collision est calculée sur ce rectangle, jamais sur la silhouette du logo).
    // Fond = couleur de marque de l'outil (repli fallback), logo blanc baké
    // centré dessus. Si aucun logo n'est chargé (o.logo null ou sprite absent),
    // repli sur le bloc plein neutre d'origine. Position bas/haut INCHANGÉE pour
    // que le joueur lise instantanément s'il faut sauter ou se baisser.
    for (const o of obstaclesRef.current) {
      const ox = Math.round(o.x)
      const oy = Math.round(o.y)
      const ow = Math.round(o.w)
      const oh = Math.round(o.h)
      const sprite = o.logo ? logoSpritesRef.current.get(o.logo) : null
      if (sprite) {
        ctx.fillStyle = logoColorsRef.current.get(o.logo) || toolBadgeFallback
        ctx.fillRect(ox, oy, ow, oh)
        // Logo blanc centré, ~62 % de la plus petite dimension du bloc → carré
        // non déformé (le sprite est carré, aspect déjà préservé au bake).
        const side = Math.min(ow, oh) * 0.62
        ctx.drawImage(sprite, ox + (ow - side) / 2, oy + (oh - side) / 2, side, side)
      } else {
        ctx.fillStyle = obstacle
        ctx.fillRect(ox, oy, ow, oh)
      }
    }

    // Écureuil en blocs (3 états : debout / saut = debout plus haut / accroupi).
    const crouching = holdingDownRef.current && onGroundRef.current
    const bw = crouching ? m.crouchW : m.bodyW
    const bh = crouching ? m.crouchH : m.bodyH
    const bottom = m.groundY - hRef.current
    const by = bottom - bh
    const bx = m.leftX

    ctx.fillStyle = accent
    // Queue en PANACHE : empilement de blocs qui part du HAUT du dos (arrière =
    // gauche, l'écureuil regarde à droite) et REMONTE en arc au-dessus du corps,
    // au lieu de descendre au sol. C'est elle qui fait « écureuil » plutôt que
    // « dino ». Tout est exprimé en fractions de bh/bw : en accroupi (bh réduit)
    // le panache s'abaisse et s'aplatit tout seul, tout en restant AU-DESSUS du
    // sol (le bloc le plus bas s'arrête à by + 0.48·bh, le sol est à by + bh).
    ctx.fillRect(bx + bw * 0.06, by + bh * 0.12, bw * 0.26, bh * 0.36) // racine, haut du dos
    ctx.fillRect(bx - bw * 0.02, by - bh * 0.04, bw * 0.24, bh * 0.32) // montée vers l'arrière
    ctx.fillRect(bx + bw * 0.04, by - bh * 0.18, bw * 0.26, bh * 0.26) // plume, au-dessus du dos
    // Corps (masse principale, bas-avant) — descend jusqu'au sol.
    ctx.fillRect(bx + bw * 0.28, by + bh * 0.44, bw * 0.56, bh * 0.56)
    // Tête (haut-avant, l'écureuil regarde à droite).
    ctx.fillRect(bx + bw * 0.56, by + bh * 0.12, bw * 0.44, bh * 0.4)
    // Oreille (petit bloc au-dessus de la tête).
    ctx.fillRect(bx + bw * 0.64, by, bw * 0.14, bh * 0.16)
    // Œil : petit carré couleur du fond, posé sur la tête.
    ctx.fillStyle = bg
    ctx.fillRect(bx + bw * 0.82, by + bh * 0.22, bw * 0.1, bh * 0.1)
  }, [])

  // Dimensionne le canvas pour la largeur dispo (bande horizontale), net en DPR.
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const avail = wrap.clientWidth || MAX_CANVAS_PX
    const cssW = Math.min(avail, MAX_CANVAS_PX)
    const cssH = Math.round(cssW * ASPECT)
    const dpr = window.devicePixelRatio || 1
    sizeRef.current = { w: cssW, h: cssH }
    canvas.style.width = cssW + 'px'
    canvas.style.height = cssH + 'px'
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
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
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const gameOver = useCallback(() => {
    stopLoop()
    statusRef.current = 'over'
    setStatus('over')
    setBest((prev) => {
      const next = Math.max(prev, scoreShownRef.current)
      if (next > prev) writeBest(next)
      return next
    })
    draw()
  }, [stopLoop, draw])

  // Crée un obstacle au bord droit. Deux types :
  //   'ground' = posé au sol, hauteur variable → à SAUTER (la hauteur variable
  //              justifie le saut à charge variable) ;
  //   'air'    = volant à une hauteur telle qu'un écureuil DEBOUT le percute mais
  //              qu'un écureuil ACCROUPI passe dessous → à esquiver en se baissant.
  const spawnObstacle = useCallback((m, W) => {
    // Logo tiré au hasard parmi les outils-avec-logo chargés et FIGÉ sur l'objet
    // obstacle : il garde le même logo pendant toute sa traversée de l'écran (pas
    // de re-tirage par frame). null si aucun logo chargé → repli bloc plein.
    const logo = pickRandom(logoIdsRef.current)
    if (Math.random() < 0.65) {
      const h = rand(m.bodyH * 0.42, m.bodyH * 1.0)
      const w = rand(m.bodyW * 0.5, m.bodyW * 0.8)
      obstaclesRef.current.push({ kind: 'ground', x: W, y: m.groundY - h, w, h, logo })
    } else {
      // Bas de l'obstacle entre la hauteur accroupie et la hauteur debout : debout
      // touche, accroupi passe. (clearH ∈ ]crouchH, bodyH[ par construction.)
      const clearH = m.crouchH + (m.bodyH - m.crouchH) * 0.55
      const w = rand(m.bodyW * 0.7, m.bodyW * 1.1)
      const h = m.bodyH * 0.45
      const yBottom = m.groundY - clearH
      obstaclesRef.current.push({ kind: 'air', x: W, y: yBottom - h, w, h, logo })
    }
  }, [])

  const update = useCallback(
    (dt) => {
      const { w: W, h: H } = sizeRef.current
      const m = metrics(W, H)
      const speed = Math.min(m.speedMax, m.speed0 + traveledRef.current * 0.04)

      // Physique du saut « Mario ».
      if (!onGroundRef.current) {
        const ascending = vRef.current > 0
        let g
        if (holdingJumpRef.current && ascending && jumpHoldRef.current < m.maxHold) {
          g = m.gHold // maintien + montée + sous le plafond → gravité réduite
          jumpHoldRef.current += dt
        } else {
          g = m.gFall // relâché, ou redescente, ou plafond atteint → gravité pleine
        }
        vRef.current -= g * dt
        hRef.current += vRef.current * dt
        if (hRef.current <= 0) {
          hRef.current = 0
          vRef.current = 0
          onGroundRef.current = true
        }
      }

      // Défilement + nettoyage des obstacles sortis à gauche.
      for (const o of obstaclesRef.current) o.x -= speed * dt
      if (obstaclesRef.current.some((o) => o.x + o.w < -2)) {
        obstaclesRef.current = obstaclesRef.current.filter((o) => o.x + o.w >= -2)
      }

      // Apparition : l'espacement est mesuré en TEMPS (≈ 0.9–1.7 s), donc l'espace
      // en pixels grandit avec la vitesse → toujours franchissable, jamais impossible.
      spawnDistRef.current -= speed * dt
      if (spawnDistRef.current <= 0) {
        spawnObstacle(m, W)
        spawnDistRef.current = Math.max(speed * rand(0.9, 1.7), m.bodyW * 5)
      }

      // Hitbox de l'écureuil (légère tolérance pour rester juste).
      const crouching = holdingDownRef.current && onGroundRef.current
      const cw = crouching ? m.crouchW : m.bodyW
      const ch = crouching ? m.crouchH : m.bodyH
      const inset = 0.14
      const pLeft = m.leftX + cw * inset
      const pRight = m.leftX + cw * (1 - inset)
      const pBottom = m.groundY - hRef.current
      const pTop = pBottom - ch * (1 - inset)

      for (const o of obstaclesRef.current) {
        if (
          pRight > o.x &&
          pLeft < o.x + o.w &&
          pBottom > o.y &&
          pTop < o.y + o.h
        ) {
          gameOver()
          return
        }
      }

      // Score = distance parcourue ; poussé dans React seulement quand l'entier
      // affiché change (pas à chaque frame).
      traveledRef.current += speed * dt
      const shown = Math.floor(traveledRef.current / SCORE_DIV)
      if (shown !== scoreShownRef.current) {
        scoreShownRef.current = shown
        setScore(shown)
      }
    },
    [spawnObstacle, gameOver],
  )

  const frame = useCallback(
    (now) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000) // borne anti à-coups
      lastRef.current = now
      update(dt)
      draw()
      if (statusRef.current === 'playing') {
        rafRef.current = requestAnimationFrame(frame)
      }
    },
    [update, draw],
  )

  const start = useCallback(() => {
    stopLoop()
    hRef.current = 0
    vRef.current = 0
    onGroundRef.current = true
    jumpHoldRef.current = 0
    holdingJumpRef.current = false
    holdingDownRef.current = false
    obstaclesRef.current = []
    traveledRef.current = 0
    scoreShownRef.current = 0
    const { w: W, h: H } = sizeRef.current
    spawnDistRef.current = Math.max(W * 0.7, metrics(W, H).bodyW * 6) // répit avant le 1er obstacle
    setScore(0)
    statusRef.current = 'playing'
    setStatus('playing')
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(frame)
    wrapRef.current?.focus({ preventScroll: true })
  }, [stopLoop, frame])

  // Début / fin de la poussée de saut (clavier ET boutons tactiles partagent ça).
  const beginJump = useCallback(() => {
    if (statusRef.current !== 'playing') {
      start()
      return
    }
    if (!onGroundRef.current) return // pas de double saut
    const { w: W, h: H } = sizeRef.current
    vRef.current = metrics(W, H).jumpV0
    onGroundRef.current = false
    jumpHoldRef.current = 0
    holdingJumpRef.current = true
  }, [start])

  const endJump = useCallback(() => {
    holdingJumpRef.current = false
  }, [])

  const beginCrouch = useCallback(() => {
    holdingDownRef.current = true
  }, [])
  const endCrouch = useCallback(() => {
    holdingDownRef.current = false
  }, [])

  const onKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case ' ':
        case 'ArrowUp':
        case 'Enter':
          e.preventDefault()
          if (e.repeat) return // l'auto-répétition OS ne relance pas le saut
          beginJump()
          break
        case 'ArrowDown':
          e.preventDefault()
          beginCrouch()
          break
        default:
          break
      }
    },
    [beginJump, beginCrouch],
  )

  const onKeyUp = useCallback(
    (e) => {
      switch (e.key) {
        case ' ':
        case 'ArrowUp':
        case 'Enter':
          endJump()
          break
        case 'ArrowDown':
          endCrouch()
          break
        default:
          break
      }
    },
    [endJump, endCrouch],
  )

  // Nettoyage de la boucle au démontage.
  useEffect(() => () => stopLoop(), [stopLoop])

  // Bouton tactile « maintien » (Saut / Baissé) : pointerdown = début, pointerup/
  // leave/cancel = fin. touch-action:none + preventDefault bloquent scroll/zoom.
  const holdBtn = (label, onBegin, onEnd) => (
    <button
      type="button"
      className="squirrel-pad-btn"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault()
        onBegin()
      }}
      onPointerUp={onEnd}
      onPointerLeave={onEnd}
      onPointerCancel={onEnd}
    >
      {label}
    </button>
  )

  return (
    <div className="squirrel-game">
      <div className="squirrel-head">
        <h1 className="squirrel-title">Squirrel</h1>
        <p className="squirrel-scores" aria-live="polite">
          Score <strong>{score}</strong> · Meilleur <strong>{best}</strong>
        </p>
      </div>

      <div
        ref={wrapRef}
        className={'squirrel-stage' + (status === 'over' ? ' is-over' : '')}
        tabIndex={0}
        role="application"
        aria-label="Jeu Squirrel, un runner sans fin. Espace ou flèche haut pour sauter (maintenir = sauter plus haut), flèche bas pour s’accroupir et passer sous les obstacles volants."
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onPointerDown={(e) => {
          // Tap sur la zone : démarre/rejoue (le saut en jeu passe par les boutons
          // tactiles dédiés ou le clavier, pas par un tap sur le canvas).
          if (statusRef.current !== 'playing') {
            e.preventDefault()
            start()
          }
        }}
      >
        <canvas ref={canvasRef} className="squirrel-canvas" />

        {status === 'idle' && (
          <div className="squirrel-overlay">
            <p className="squirrel-overlay-title">Squirrel</p>
            <p className="squirrel-overlay-sub">
              {isMobile
                ? 'Touche « Saut » pour sauter, « Baissé » pour t’accroupir'
                : 'Espace / ↑ pour sauter (maintenir = plus haut) · ↓ pour s’accroupir'}
            </p>
            <button type="button" className="squirrel-btn" onClick={() => start()}>
              Démarrer
            </button>
          </div>
        )}

        {status === 'over' && (
          <div className="squirrel-overlay" role="status" aria-live="polite">
            <p className="squirrel-overlay-title">Game Over</p>
            <p className="squirrel-overlay-sub">
              Score {score} / meilleur {best}
            </p>
            <button type="button" className="squirrel-btn" onClick={() => start()}>
              Rejouer
            </button>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="squirrel-pad" role="group" aria-label="Contrôles tactiles">
          {holdBtn('Saut', beginJump, endJump)}
          {holdBtn('Baissé', beginCrouch, endCrouch)}
        </div>
      )}
    </div>
  )
}
