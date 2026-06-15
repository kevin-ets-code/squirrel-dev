import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import data from './projects.json'
import TitleBar from './components/TitleBar.jsx'
import ActivityBar from './components/ActivityBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import SearchPanel from './components/SearchPanel.jsx'
import ToolsPanel from './components/ToolsPanel.jsx'
import SourceControlPanel from './components/SourceControlPanel.jsx'
import GamesPanel from './components/GamesPanel.jsx'
import MobilePanelTabs from './components/MobilePanelTabs.jsx'
import GraphUnavailable from './components/GraphUnavailable.jsx'
import EditorTabs from './components/EditorTabs.jsx'
import ContentEndNav from './components/ContentEndNav.jsx'
import StatusBar from './components/StatusBar.jsx'
import ProjectView from './components/ProjectView.jsx'
import ToolView from './components/ToolView.jsx'
import ReadmeView from './components/ReadmeView.jsx'
import SettingsView from './components/SettingsView.jsx'
import KonamiView from './components/KonamiView.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import Toast from './components/Toast.jsx'
import NotFound from './components/NotFound.jsx'
import useIsMobile from './lib/useIsMobile.js'
import { useEasterEggs } from './lib/easterEggs.jsx'
import { gameById, gameTabId, gameIdForAnswer } from './games/registry.js'
import {
  toolTabId,
  isToolTab,
  toolNameFromTab,
  toolProjects,
  toolEntry,
} from './lib/tools.js'

// React Flow est lourd : on ne le charge que quand la vue Graph est ouverte.
const GraphView = lazy(() => import('./components/GraphView.jsx'))

const README_TAB = { id: 'readme', name: 'README', type: 'readme' }
const SETTINGS_TAB = { id: 'settings', name: 'Settings', type: 'settings' }
const KONAMI_TAB = { id: 'konami', name: 'konami-code', type: 'konami' }

export default function App() {
  const { profile, projects, tools = {}, readme = {} } = data
  const { easterEggUnlocked, gamesUnlocked, unlockKonami, unlockGame } = useEasterEggs()

  const [tabs, setTabs] = useState([README_TAB])
  const [activeTab, setActiveTab] = useState('readme')
  const [panel, setPanel] = useState('explorer')
  const [view, setView] = useState('ide') // "ide" | "graph"
  const [sidebarOpen, setSidebarOpen] = useState(false) // mobile drawer
  const [tabFocusKey, setTabFocusKey] = useState(0) // signal pour focaliser l'onglet actif
  const [paletteOpen, setPaletteOpen] = useState(false) // palette de commandes (Ctrl/Cmd+K)
  const [toastMessage, setToastMessage] = useState(null) // toast (un seul à la fois)
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

  // Ouvre l'onglet konami-code.md (sans doublon) — même mécanisme qu'openReadme.
  const openKonami = useCallback(() => {
    setTabs((prev) => (prev.some((t) => t.id === 'konami') ? prev : [...prev, KONAMI_TAB]))
    setActiveTab('konami')
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
      setToastMessage(`🎉 Énigme résolue ! ${gameById(id).label} débloqué.`)
    },
    [gamesUnlocked, unlockGame],
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
            onSelectSettings={openSettings}
          />
          {panel === 'search' ? (
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
              onOpenReadme={openReadme}
              onOpenProject={openProject}
              onOpenKonami={openKonami}
            />
          )}
        </div>

        {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

        <main className="editor" id="main-content" tabIndex={-1}>
          {view === 'graph' ? (
            isMobile ? (
              <GraphUnavailable onOpenTools={openToolsPanel} />
            ) : (
              <Suspense fallback={<div className="graph-loading">Chargement du graphe…</div>}>
                <GraphView
                  projects={projects}
                  tools={tools}
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

                {activeTab === 'settings' && <SettingsView />}

                {activeTab === 'konami' && <KonamiView />}

                {ActiveGameComponent && (
                  <ActiveGameComponent projects={projects} tools={tools} />
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
        onOpenSettings={openSettings}
        onToggleView={toggleView}
        onKonami={unlockKonamiWithToast}
        onSolve={solveRiddle}
      />

      <Toast message={toastMessage} onDismiss={dismissToast} />
    </div>
  )
}
