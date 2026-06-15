import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { buildGraph } from '../lib/graph.js'
import { graphNodeTypes } from './graphNodes.jsx'

const COLOR_PRO = 'var(--icon-pro)'
const COLOR_PERSO = 'var(--icon-perso)'
const COLOR_TOOL = 'var(--graph-tool)'

// Catégorie d'un nœud brut -> clé de filtre.
function categoryOf(n) {
  if (n.kind === 'tool') return 'tools'
  return n.project.type // "pro" | "perso"
}

function nodeColor(n) {
  if (n.kind === 'tool') return COLOR_TOOL
  return n.project.type === 'pro' ? COLOR_PRO : COLOR_PERSO
}

function GraphInner({ projects, tools, onOpenProject, onOpenTool }) {
  // Graphe brut, auto-généré depuis projects.json (positions + structure).
  const { nodes: rawNodes, edges: rawEdges } = useMemo(
    () => buildGraph(projects, tools),
    [projects, tools],
  )

  // Adjacence : id -> ensemble {soi-même + voisins directs}.
  const adjacency = useMemo(() => {
    const m = new Map()
    rawNodes.forEach((n) => m.set(n.id, new Set([n.id])))
    rawEdges.forEach((e) => {
      m.get(e.source)?.add(e.target)
      m.get(e.target)?.add(e.source)
    })
    return m
  }, [rawNodes, rawEdges])

  // Nœuds/edges React Flow, en state pour persister les positions au drag.
  const initialNodes = useMemo(
    () =>
      rawNodes.map((n) => ({
        id: n.id,
        type: n.kind,
        position: n.position,
        data: {
          label: n.label,
          sub: n.sub,
          degree: n.degree,
          project: n.project,
          toolId: n.toolId, // id de stack de l'outil (double-clic → fiche outil)
          color: nodeColor(n),
          logo: n.logo,
          brandColor: n.brandColor,
        },
      })),
    [rawNodes],
  )
  const initialEdges = useMemo(
    () => rawEdges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    [rawEdges],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // --- État d'exploration -------------------------------------------------
  const [focusedNodeId, setFocusedNodeId] = useState(null)
  const [cats, setCats] = useState({ pro: true, perso: true, tools: true })
  const [search, setSearch] = useState('')

  const allOn = cats.pro && cats.perso && cats.tools

  // Ensemble des nœuds visibles selon catégories + recherche + focus.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()

    // recherche : nœuds qui matchent + leurs voisins directs
    let searchSet = null
    if (q) {
      searchSet = new Set()
      rawNodes.forEach((n) => {
        if (n.label.toLowerCase().includes(q)) {
          adjacency.get(n.id)?.forEach((id) => searchSet.add(id))
        }
      })
    }

    // base = filtre catégories ∩ recherche
    const base = new Set()
    rawNodes.forEach((n) => {
      const catOk = cats[categoryOf(n)]
      const searchOk = !searchSet || searchSet.has(n.id)
      if (catOk && searchOk) base.add(n.id)
    })

    // focus = on ne garde que le nœud cliqué + ses voisins directs
    if (focusedNodeId && base.has(focusedNodeId)) {
      const neighbors = adjacency.get(focusedNodeId)
      return new Set([...base].filter((id) => neighbors.has(id)))
    }
    return base
  }, [rawNodes, adjacency, cats, search, focusedNodeId])

  // Applique visibilité + mise en valeur aux nœuds (sans toucher aux positions).
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        hidden: !visible.has(n.id),
        data: {
          ...n.data,
          highlighted: focusedNodeId === n.id,
          active: focusedNodeId === n.id,
        },
      })),
    )
  }, [visible, focusedNodeId, setNodes])

  // Applique visibilité + highlight aux edges.
  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => {
        const shown =
          visible.has(e.source) &&
          visible.has(e.target) &&
          (!focusedNodeId || e.source === focusedNodeId || e.target === focusedNodeId)
        const isFocusEdge =
          focusedNodeId && (e.source === focusedNodeId || e.target === focusedNodeId)
        return {
          ...e,
          hidden: !shown,
          animated: !!isFocusEdge,
          className: isFocusEdge ? 'edge-hl' : '',
        }
      }),
    )
  }, [visible, focusedNodeId, setEdges])

  // --- Interactions -------------------------------------------------------
  // Simple clic = focus ; double-clic sur un projet = ouvrir la fiche.
  // On temporise le simple clic pour ne pas le déclencher pendant un double-clic.
  const clickTimer = useRef(null)

  const onNodeClick = useCallback((_evt, node) => {
    if (clickTimer.current) clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      setFocusedNodeId((prev) => (prev === node.id ? null : node.id))
    }, 200)
  }, [])

  const onNodeDoubleClick = useCallback(
    (_evt, node) => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current)
        clickTimer.current = null
      }
      if (node.type === 'project') {
        onOpenProject(node.data.project) // → bascule en IDE + ouvre l'onglet
      } else if (node.type === 'tool') {
        onOpenTool(node.data.toolId) // → même callback que le clic dans ToolsPanel
      }
    },
    [onOpenProject, onOpenTool],
  )

  const onPaneClick = useCallback(() => setFocusedNodeId(null), [])

  useEffect(() => () => clickTimer.current && clearTimeout(clickTimer.current), [])

  const toggleCat = (key) => setCats((c) => ({ ...c, [key]: !c[key] }))
  const showAll = () => setCats({ pro: true, perso: true, tools: true })

  return (
    <div className="graph-view">
      <div className="graph-toolbar">
        <div className="gfilter-group" role="group" aria-label="Filtrer par catégorie">
          <button
            className={'gfilter-btn' + (allOn ? ' active' : '')}
            onClick={showAll}
          >
            Tous
          </button>
          <button
            className={'gfilter-btn' + (cats.pro ? ' active' : '')}
            onClick={() => toggleCat('pro')}
          >
            Pro
          </button>
          <button
            className={'gfilter-btn' + (cats.perso ? ' active' : '')}
            onClick={() => toggleCat('perso')}
          >
            Perso
          </button>
          <button
            className={'gfilter-btn' + (cats.tools ? ' active' : '')}
            onClick={() => toggleCat('tools')}
          >
            Outils
          </button>
        </div>

        <input
          className="gfilter-search"
          type="text"
          value={search}
          placeholder="Filtrer les nœuds…"
          onChange={(e) => setSearch(e.target.value)}
        />

        <span className="graph-toolbar-hint">
          simple clic = focus · double-clic = ouvrir
        </span>
      </div>

      <div className="graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={graphNodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
        >
          <Background color="var(--graph-dot)" gap={22} size={1} />
          <Controls showInteractive={false} />
          <Panel position="bottom-right" className="graph-legend">
            <div className="legend-row">
              <span className="legend-chip" style={{ background: COLOR_PRO }} /> projet pro
            </div>
            <div className="legend-row">
              <span className="legend-chip" style={{ background: COLOR_PERSO }} /> projet perso
            </div>
            <div className="legend-row">
              <span className="legend-chip" style={{ background: COLOR_TOOL }} /> outil
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}

export default function GraphView(props) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  )
}
