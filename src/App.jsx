import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react'
import data from './projects.json'
import TitleBar from './components/TitleBar.jsx'
import ActivityBar from './components/ActivityBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import SearchPanel from './components/SearchPanel.jsx'
import ToolsPanel from './components/ToolsPanel.jsx'
import SourceControlPanel from './components/SourceControlPanel.jsx'
import GamesPanel from './components/GamesPanel.jsx'
import GraphPanel from './components/GraphPanel.jsx'
import ApiPanel from './components/ApiPanel.jsx'
import ApiView from './components/ApiView.jsx'
import MobilePanelTabs from './components/MobilePanelTabs.jsx'
import GraphUnavailable from './components/GraphUnavailable.jsx'
import EditorTabs from './components/EditorTabs.jsx'
import ContentEndNav from './components/ContentEndNav.jsx'
import StatusBar from './components/StatusBar.jsx'
import ProjectView from './components/ProjectView.jsx'
import ToolView from './components/ToolView.jsx'
import ReadmeView from './components/ReadmeView.jsx'
import AboutView from './components/AboutView.jsx'
import SettingsView from './components/SettingsView.jsx'
import KonamiView from './components/KonamiView.jsx'
import VictorySnakeView from './components/VictorySnakeView.jsx'
import VictoryMemoryView from './components/VictoryMemoryView.jsx'
import VictorySquirrelView from './components/VictorySquirrelView.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import Toast from './components/Toast.jsx'
import NotFound from './components/NotFound.jsx'
import useIsMobile from './lib/useIsMobile.js'
import { useEasterEggs } from './lib/easterEggs.jsx'
import {
  gameById,
  gameTabId,
  gameIdForAnswer,
  victoryGameIdForAnswer,
} from './games/registry.js'
import {
  toolTabId,
  isToolTab,
  toolNameFromTab,
  toolProjects,
  toolEntry,
} from './lib/tools.js'
import { executeRequest, resolveExample } from './lib/api-engine.js'

// React Flow est lourd : on ne le charge que quand la vue Graph est ouverte.
const GraphView = lazy(() => import('./components/GraphView.jsx'))

const README_TAB = { id: 'readme', name: 'README', type: 'readme' }
const ABOUT_TAB = { id: 'about', name: 'about-me', type: 'about' }
const SETTINGS_TAB = { id: 'settings', name: 'Settings', type: 'settings' }
const KONAMI_TAB = { id: 'konami', name: 'konami-code', type: 'konami' }
const VICTORY_SNAKE_TAB = { id: 'victory-snake', name: 'victory-snake', type: 'victory-snake' }
const VICTORY_MEMORY_TAB = { id: 'victory-memory', name: 'victory-memory', type: 'victory-memory' }
const VICTORY_SQUIRREL_TAB = {
  id: 'victory-squirrel',
  name: 'victory-squirrel',
  type: 'victory-squirrel',
}

export default function App() {
  const { profile, projects, tools = {}, readme = {} } = data
  const {
    easterEggUnlocked,
    gamesUnlocked,
    snakeVictory,
    memoryVictory,
    squirrelVictory,
    unlockKonami,
    unlockGame,
    unlockVictory,
  } = useEasterEggs()

  const [tabs, setTabs] = useState([README_TAB])
  const [activeTab, setActiveTab] = useState('readme')
  const [panel, setPanel] = useState('explorer')
  const [view, setView] = useState('ide') // "ide" | "graph" | "api"
  // Filtres du Graph remontés ici (état partagé) : la sidebar GraphPanel les
  // pilote, GraphView les consomme pour calculer la visibilité. focusedNodeId
  // reste local à GraphView (interaction du canvas, pas un filtre).
  const [graphCats, setGraphCats] = useState({ pro: true, perso: true, tools: true })
  const [graphSearch, setGraphSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile drawer
  const [tabFocusKey, setTabFocusKey] = useState(0) // signal pour focaliser l'onglet actif
  const [paletteOpen, setPaletteOpen] = useState(false) // palette de commandes (Ctrl/Cmd+K)
  const [toastMessage, setToastMessage] = useState(null) // toast (un seul à la fois)
  // Vue API : état remonté ici (App = parent commun d'ApiPanel et ApiView).
  // Tout est en mémoire de SESSION (pas de localStorage : réservé aux préférences).
  const [apiInput, setApiInput] = useState('') // ligne de requête (ex. "GET /projects")
  const [apiResult, setApiResult] = useState(null) // dernière réponse { method, path, status… }
  const [apiLogs, setApiLogs] = useState([]) // historique de session (plus récent en tête)
  const [apiFocusKey, setApiFocusKey] = useState(0) // signal pour focaliser le champ requête
  // Sous-état d'onglet INTERNE à la vue API (console / doc / logs). Local à la
  // vue API, distinct du système d'onglets de fichiers IDE (tabs/activeTab).
  const [apiTab, setApiTab] = useState('console')
  const apiLogId = useRef(0)
  // L'app n'a pas de routeur (pilotée par onglets) : Vercel renvoie toute route
  // vers index.html (cf. vercel.json), donc toute URL autre que la racine est
  // une route inconnue => écran 404.
  const [notFound, setNotFound] = useState(
    () => typeof window !== 'undefined' && window.location.pathname !== '/',
  )
  const isMobile = useIsMobile(720)

  const panelRef = useRef(null) // tabpanel (contenu de l'onglet actif)
  const sidebarRef = useRef(null) // conteneur des panneaux de la sidebar

  // Déplace le focus vers le contenu fraîchement ouvert (après le rendu).
  // Programmatique => pas d'anneau de focus visible, n'affecte pas la souris.
  const focusPanel = useCallback(() => {
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }))
  }, [])

  const openReadme = useCallback(() => {
    setTabs((prev) => (prev.some((t) => t.id === 'readme') ? prev : [README_TAB, ...prev]))
    setActiveTab('readme')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  // Ouvre l'onglet about-me.md (sans doublon) — même mécanisme qu'openReadme.
  const openAbout = useCallback(() => {
    setTabs((prev) => (prev.some((t) => t.id === 'about') ? prev : [...prev, ABOUT_TAB]))
    setActiveTab('about')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  // Ouvre l'onglet konami-code.md (sans doublon) — même mécanisme qu'openReadme.
  const openKonami = useCallback(() => {
    setTabs((prev) => (prev.some((t) => t.id === 'konami') ? prev : [...prev, KONAMI_TAB]))
    setActiveTab('konami')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  // Ouvre l'onglet victory_snake.md (sans doublon) — même mécanisme qu'openKonami.
  const openVictorySnake = useCallback(() => {
    setTabs((prev) =>
      prev.some((t) => t.id === 'victory-snake') ? prev : [...prev, VICTORY_SNAKE_TAB],
    )
    setActiveTab('victory-snake')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  // Ouvre victory-memory.md / victory-squirrel.md (sans doublon) — même mécanisme.
  const openVictoryMemory = useCallback(() => {
    setTabs((prev) =>
      prev.some((t) => t.id === 'victory-memory') ? prev : [...prev, VICTORY_MEMORY_TAB],
    )
    setActiveTab('victory-memory')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  const openVictorySquirrel = useCallback(() => {
    setTabs((prev) =>
      prev.some((t) => t.id === 'victory-squirrel') ? prev : [...prev, VICTORY_SQUIRREL_TAB],
    )
    setActiveTab('victory-squirrel')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  // Ouvre l'onglet d'un jeu débloqué (sans doublon) — même mécanisme
  // qu'openReadme/openProject. L'onglet mémorise son `gameId` ; le rendu résout
  // ensuite le `component` depuis le registre. Le label n'apparaît qu'ici (jeu
  // déjà débloqué donc révélé), jamais avant.
  const openGame = useCallback(
    (id) => {
      const game = gameById(id)
      if (!game) return
      const tabId = gameTabId(id)
      setTabs((prev) =>
        prev.some((t) => t.id === tabId)
          ? prev
          : [...prev, { id: tabId, name: game.label, type: 'game', gameId: id }],
      )
      setActiveTab(tabId)
      setView('ide')
      setSidebarOpen(false)
      focusPanel()
    },
    [focusPanel],
  )

  // Ouvre l'onglet d'un projet (sans doublon) et bascule en vue IDE.
  // Utilisé par la sidebar, la recherche ET les clics de nœuds du graphe.
  const openProject = useCallback(
    (project) => {
      setTabs((prev) => {
        if (prev.some((t) => t.id === project.id)) return prev
        return [...prev, { id: project.id, name: project.name, type: project.type }]
      })
      setActiveTab(project.id)
      setView('ide')
      setSidebarOpen(false)
      focusPanel()
    },
    [focusPanel],
  )

  // Ouvre l'onglet d'un outil (sans doublon) et bascule en vue IDE.
  // `toolId` = id de stack ; l'onglet affiche le label résolu.
  const openTool = useCallback(
    (toolId) => {
      const id = toolTabId(toolId)
      setTabs((prev) => {
        if (prev.some((t) => t.id === id)) return prev
        const entry = toolEntry(tools, toolId)
        return [
          ...prev,
          { id, name: entry.label, type: 'tool', logo: entry.logo, color: entry.color },
        ]
      })
      setActiveTab(id)
      setView('ide')
      setSidebarOpen(false)
      focusPanel()
    },
    [tools, focusPanel],
  )

  const selectPanel = useCallback((p) => {
    setPanel(p)
    setView('ide')
  }, [])

  // Ouvre l'onglet Paramètres (sans doublon) et bascule en vue IDE.
  const openSettings = useCallback(() => {
    setTabs((prev) => (prev.some((t) => t.id === 'settings') ? prev : [...prev, SETTINGS_TAB]))
    setActiveTab('settings')
    setView('ide')
    setSidebarOpen(false)
    focusPanel()
  }, [focusPanel])

  // Bascule vers le Graph ; ferme le drawer mobile pour révéler le canvas/message.
  const selectGraph = useCallback(() => {
    setView('graph')
    setSidebarOpen(false)
  }, [])

  // Bascule vers la vue API. Contrairement au Graph, on NE ferme PAS le drawer
  // mobile : la sidebar API (endpoints/doc) est le contenu utile sur petit écran
  // — la zone principale n'est qu'une console placeholder. Cohérent avec
  // selectPanel (changer de panneau ne ferme pas le drawer).
  const selectApi = useCallback(() => setView('api'), [])

  // Jeu de données interrogé par la fausse API (même source que tout le reste).
  const apiData = useMemo(() => ({ profile, projects, tools }), [profile, projects, tools])

  // Exécute une requête : parse + route via le moteur, met à jour la réponse et
  // empile un log de session (plus récent en tête, borné à 50). Utilisé par le
  // bouton Send / Entrée ET par le rejeu d'un log.
  const runApiRequest = useCallback(
    (input) => {
      const text = (input ?? '').trim()
      if (!text) return
      const result = executeRequest(text, apiData)
      setApiResult(result)
      setApiLogs((prev) => {
        const entry = {
          id: ++apiLogId.current,
          input: text,
          method: result.method,
          path: result.path,
          status: result.status,
          statusText: result.statusText,
          // On stocke le corps à la création : le panneau de détail (onglet Logs)
          // l'affiche SANS ré-exécuter la requête.
          body: result.body,
        }
        return [entry, ...prev].slice(0, 50)
      })
    },
    [apiData],
  )

  // Clic sur un endpoint dans le panneau API : PRÉ-REMPLIT le champ avec l'URL
  // d'exemple (méthode + path résolu) sans exécuter, bascule en vue API + onglet
  // interne Console et focalise le champ. On ferme le drawer mobile pour révéler
  // la console.
  const selectEndpoint = useCallback(
    (ep) => {
      setApiInput(`${ep.method} ${resolveExample(ep, apiData)}`)
      setView('api')
      setApiTab('console')
      setSidebarOpen(false)
      setApiFocusKey((k) => k + 1)
    },
    [apiData],
  )

  // Rejoue un log (bouton « Rejouer » du panneau de détail, onglet Logs) :
  // ré-affiche sa ligne dans le champ, bascule sur l'onglet Console et ré-exécute
  // la requête. C'est le SEUL chemin qui ré-exécute depuis les logs.
  const replayLog = useCallback(
    (entry) => {
      setApiInput(entry.input)
      setView('api')
      setApiTab('console')
      setSidebarOpen(false)
      runApiRequest(entry.input)
    },
    [runApiRequest],
  )

  // Handlers des filtres du Graph (pilotés par GraphPanel).
  const toggleGraphCat = useCallback(
    (key) => setGraphCats((c) => ({ ...c, [key]: !c[key] })),
    [],
  )
  const showAllGraphCats = useCallback(
    () => setGraphCats({ pro: true, perso: true, tools: true }),
    [],
  )

  // Bascule IDE <-> Graph (action de la palette de commandes).
  const toggleView = useCallback(() => {
    setView((v) => (v === 'graph' ? 'ide' : 'graph'))
    setSidebarOpen(false)
  }, [])

  // Débloque le mode Jeux + toast de confirmation. Idempotent : si c'est déjà
  // débloqué, on ne refait rien (pas de toast répété). Partagé par l'écouteur
  // Konami et la commande cachée « > konami » de la palette.
  const unlockKonamiWithToast = useCallback(() => {
    if (easterEggUnlocked) return
    unlockKonami()
    setToastMessage('Mode Jeux débloqué — panneau « Jeux » et konami-code.md disponibles.')
  }, [easterEggUnlocked, unlockKonami])

  // Commande fantôme « > solve <réponse> » : résout une énigme de jeu. On
  // normalise/matche via le registre (gameIdForAnswer). On NE bloque PAS sur
  // easterEggUnlocked : c'est un easter egg, si quelqu'un devine la réponse on
  // le laisse gagner. Toast de succès (révèle le label, c'est gagné), neutre si
  // déjà débloqué, discret si mauvaise réponse.
  const solveRiddle = useCallback(
    (answer) => {
      // CAS SPÉCIAL prioritaire : « solve <jeu> victory » débloque la page-récompense
      // du jeu (victory-<jeu>.md) sans rejouer la condition cachée. Les alias sont
      // dérivés du registre (victoryGameIdForAnswer). Testé AVANT gameIdForAnswer,
      // sinon le mot solution seul (« serpent »…) serait capturé par l'énigme.
      const victoryId = victoryGameIdForAnswer(answer)
      if (victoryId) {
        // Garde-fou : n'a de sens qu'une fois le jeu lui-même débloqué. Sinon on
        // traite ça comme une mauvaise réponse (ne révèle pas l'existence de la
        // commande).
        if (!gamesUnlocked[victoryId]) {
          setToastMessage('Mauvaise réponse…')
          return
        }
        const victoryFlags = {
          snake: snakeVictory,
          memory: memoryVictory,
          squirrel: squirrelVictory,
        }
        if (victoryFlags[victoryId]) {
          setToastMessage('Déjà débloqué.')
          return
        }
        unlockVictory(victoryId)
        // Pas d'emoji dans la chaîne : l'icône 🎮 du composant Toast joue ce rôle
        // (homogène avec les autres toasts).
        setToastMessage(`Victoire ${gameById(victoryId).label} débloquée !`)
        return
      }

      const id = gameIdForAnswer(answer)
      if (!id) {
        setToastMessage('Mauvaise réponse…')
        return
      }
      if (gamesUnlocked[id]) {
        setToastMessage('Déjà débloqué.')
        return
      }
      unlockGame(id)
      setToastMessage(`Énigme résolue ! ${gameById(id).label} débloqué.`)
    },
    [gamesUnlocked, snakeVictory, memoryVictory, squirrelVictory, unlockGame, unlockVictory],
  )

  const dismissToast = useCallback(() => setToastMessage(null), [])

  // Raccourci global Ctrl/Cmd+K : ouvre/ferme la palette de commandes.
  // (Pas de Ctrl+P : réservé à l'impression du navigateur.)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Écouteur Konami Code (↑↑↓↓←→←→BA) : débloque le mode Jeux. On n'écoute plus
  // une fois débloqué. On n'intercepte pas la frappe dans un input/textarea pour
  // ne pas casser la saisie normale (on réinitialise juste la progression).
  useEffect(() => {
    if (easterEggUnlocked) return
    const SEQUENCE = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a',
    ]
    let pos = 0
    const onKey = (e) => {
      const el = document.activeElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) {
        pos = 0
        return
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === SEQUENCE[pos]) {
        pos++
        if (pos === SEQUENCE.length) {
          pos = 0
          unlockKonamiWithToast()
        }
      } else {
        // Mauvaise touche : on repart de zéro (mais elle peut amorcer une
        // nouvelle séquence si c'est la première touche).
        pos = key === SEQUENCE[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [easterEggUnlocked, unlockKonamiWithToast])

  // Depuis le message "Graph indisponible" (mobile) : ouvre le panneau Tools.
  const openToolsPanel = useCallback(() => {
    setPanel('tools')
    setView('ide')
    setSidebarOpen(true)
  }, [])

  const closeTab = useCallback(
    (id) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id)
        if (idx === -1) return prev
        const next = prev.filter((t) => t.id !== id)
        // si on ferme l'onglet actif, bascule sur le voisin
        setActiveTab((current) => {
          if (current !== id) return current
          if (next.length === 0) return null
          const neighbor = next[idx] || next[idx - 1]
          return neighbor ? neighbor.id : null
        })
        return next
      })
    },
    [],
  )

  // Lien « ↑ Revenir au menu » : redonne le focus au panneau de la sidebar actif
  // (ouvre d'abord le drawer sur mobile).
  const backToMenu = useCallback(() => {
    setSidebarOpen(true)
    requestAnimationFrame(() => {
      // on cible le panneau réel (.sidebar), pas les onglets mobiles (display:none)
      const first = sidebarRef.current?.querySelector(
        '.sidebar button, .sidebar input, .sidebar a[href], .sidebar [tabindex]:not([tabindex="-1"])',
      )
      first?.focus({ preventScroll: true })
    })
  }, [])

  // Lien « → Onglet suivant » : active l'onglet suivant (cycle) et lui donne le focus.
  const goToNextTab = useCallback(() => {
    setTabs((prevTabs) => {
      if (prevTabs.length < 2) return prevTabs
      setActiveTab((current) => {
        const idx = prevTabs.findIndex((t) => t.id === current)
        const next = prevTabs[(idx + 1) % prevTabs.length]
        return next ? next.id : current
      })
      return prevTabs
    })
    setTabFocusKey((k) => k + 1)
  }, [])

  // « ← Retour à l'accueil » depuis la 404 : remet l'URL à la racine (sans
  // recharger) et réaffiche l'app, déjà sur le README par défaut.
  const goHome = useCallback(() => {
    window.history.replaceState(null, '', '/')
    setNotFound(false)
  }, [])

  const activeProject = projects.find((p) => p.id === activeTab)
  const activeToolId = isToolTab(activeTab) ? toolNameFromTab(activeTab) : null
  // Onglet de jeu actif : on résout son composant depuis le registre.
  const activeGameTab = tabs.find((t) => t.id === activeTab && t.type === 'game')
  const ActiveGameComponent = activeGameTab ? gameById(activeGameTab.gameId)?.component : null

  if (notFound) {
    return <NotFound path={window.location.pathname} onHome={goHome} />
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Aller au contenu
      </a>
      <TitleBar
        name={profile.name}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <div className="body">
        <ActivityBar
          view={view}
          panel={panel}
          activeTab={activeTab}
          easterEggUnlocked={easterEggUnlocked}
          onSelectPanel={selectPanel}
          onSelectGraph={selectGraph}
          onSelectApi={selectApi}
          onSelectSettings={openSettings}
        />

        <div className={'sidebar-wrap' + (sidebarOpen ? ' open' : '')} ref={sidebarRef}>
          <MobilePanelTabs
            view={view}
            panel={panel}
            activeTab={activeTab}
            easterEggUnlocked={easterEggUnlocked}
            onSelectPanel={selectPanel}
            onSelectGraph={selectGraph}
            onSelectApi={selectApi}
            onSelectSettings={openSettings}
          />
          {view === 'api' ? (
            <ApiPanel onSelectEndpoint={selectEndpoint} />
          ) : view === 'graph' && !isMobile ? (
            <GraphPanel
              cats={graphCats}
              search={graphSearch}
              onToggleCat={toggleGraphCat}
              onShowAll={showAllGraphCats}
              onSearchChange={setGraphSearch}
            />
          ) : panel === 'search' ? (
            <SearchPanel
              projects={projects}
              tools={tools}
              onOpenProject={openProject}
              onOpenTool={openTool}
            />
          ) : panel === 'tools' ? (
            <ToolsPanel
              projects={projects}
              tools={tools}
              activeTab={activeTab}
              onOpenTool={openTool}
            />
          ) : panel === 'source' ? (
            <SourceControlPanel
              projects={projects}
              activeTab={activeTab}
              onOpenProject={openProject}
            />
          ) : panel === 'games' ? (
            <GamesPanel activeTab={activeTab} onOpenGame={openGame} />
          ) : (
            <Sidebar
              profile={profile}
              projects={projects}
              activeTab={activeTab}
              easterEggUnlocked={easterEggUnlocked}
              snakeVictory={snakeVictory}
              memoryVictory={memoryVictory}
              squirrelVictory={squirrelVictory}
              onOpenReadme={openReadme}
              onOpenAbout={openAbout}
              onOpenProject={openProject}
              onOpenKonami={openKonami}
              onOpenVictorySnake={openVictorySnake}
              onOpenVictoryMemory={openVictoryMemory}
              onOpenVictorySquirrel={openVictorySquirrel}
            />
          )}
        </div>

        {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

        <main className="editor" id="main-content" tabIndex={-1}>
          {view === 'api' ? (
            <ApiView
              apiTab={apiTab}
              onApiTab={setApiTab}
              value={apiInput}
              onChange={setApiInput}
              onSend={runApiRequest}
              result={apiResult}
              focusSignal={apiFocusKey}
              apiData={apiData}
              onSelectEndpoint={selectEndpoint}
              logs={apiLogs}
              onReplay={replayLog}
            />
          ) : view === 'graph' ? (
            isMobile ? (
              <GraphUnavailable onOpenTools={openToolsPanel} />
            ) : (
              <Suspense fallback={<div className="graph-loading">Chargement du graphe…</div>}>
                <GraphView
                  projects={projects}
                  tools={tools}
                  cats={graphCats}
                  search={graphSearch}
                  onOpenProject={openProject}
                  onOpenTool={openTool}
                />
              </Suspense>
            )
          ) : (
            <>
              <EditorTabs
                tabs={tabs}
                activeTab={activeTab}
                onActivate={setActiveTab}
                onClose={closeTab}
                focusActiveSignal={tabFocusKey}
              />

              <div
                className="editor-content"
                ref={panelRef}
                tabIndex={-1}
                role={activeTab ? 'tabpanel' : undefined}
                id={activeTab ? `panel-${activeTab}` : undefined}
                aria-labelledby={activeTab ? `tab-${activeTab}` : undefined}
              >
                {activeTab === 'readme' && <ReadmeView profile={profile} readme={readme} />}

                {activeTab === 'about' && <AboutView profile={profile} />}

                {activeTab === 'settings' && <SettingsView />}

                {activeTab === 'konami' && <KonamiView />}

                {activeTab === 'victory-snake' && <VictorySnakeView />}

                {activeTab === 'victory-memory' && <VictoryMemoryView />}

                {activeTab === 'victory-squirrel' && <VictorySquirrelView />}

                {ActiveGameComponent && (
                  <ActiveGameComponent
                    projects={projects}
                    tools={tools}
                    /* Généralisé : chaque jeu décide QUAND appeler onVictory (grille
                       parfaite Snake, partie parfaite Memory, palier Squirrel) ; ici
                       on relie juste l'id de l'onglet au flag via unlockVictory. */
                    onVictory={
                      activeGameTab ? () => unlockVictory(activeGameTab.gameId) : undefined
                    }
                  />
                )}

                {activeProject && <ProjectView project={activeProject} tools={tools} />}

                {activeToolId && (
                  <ToolView
                    tool={toolEntry(tools, activeToolId)}
                    projects={toolProjects(projects, activeToolId)}
                    onOpenProject={openProject}
                  />
                )}

                {activeTab === null && (
                  <div className="empty-state">
                    <p>Aucun fichier ouvert.</p>
                    <p className="empty-hint">Ouvre un projet dans l'explorateur à gauche.</p>
                  </div>
                )}

                {activeTab !== null && (
                  <ContentEndNav
                    hasMultipleTabs={tabs.length > 1}
                    onBackToMenu={backToMenu}
                    onNextTab={goToNextTab}
                  />
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <StatusBar projectCount={projects.length} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        projects={projects}
        tools={tools}
        onOpenProject={openProject}
        onOpenTool={openTool}
        onOpenReadme={openReadme}
        onOpenAbout={openAbout}
        onOpenSettings={openSettings}
        onToggleView={toggleView}
        onKonami={unlockKonamiWithToast}
        onSolve={solveRiddle}
      />

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </div>
  )
}
