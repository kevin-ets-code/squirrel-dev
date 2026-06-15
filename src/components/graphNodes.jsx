import { Handle, Position } from '@xyflow/react'
import ToolLogo from './ToolLogo.jsx'

// Nœud projet : bordure teal (pro) ou violette (perso), cliquable → ouvre l'onglet.
export function ProjectNode({ data }) {
  const cls = ['gnode', 'gnode-project']
  if (data.dimmed) cls.push('gnode-dim')
  if (data.highlighted) cls.push('gnode-hl')
  return (
    <div className={cls.join(' ')} style={{ '--node-accent': data.color }}>
      <span className="gnode-label">{data.label}.md</span>
      <span className="gnode-sub">{data.sub}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

// Nœud outil : bordure bleue, taille croissante selon le nombre de connexions.
export function ToolNode({ data }) {
  const cls = ['gnode', 'gnode-tool']
  if (data.dimmed) cls.push('gnode-dim')
  if (data.highlighted) cls.push('gnode-hl')
  if (data.active) cls.push('gnode-active')
  // degré ≥ 2 => outil partagé, on le grossit
  const scale = data.degree >= 2 ? 1 + Math.min(data.degree - 1, 3) * 0.12 : 1
  return (
    <div
      className={cls.join(' ')}
      style={{ '--node-accent': data.color, fontSize: `${scale * 13}px` }}
    >
      <Handle type="target" position={Position.Left} />
      {/* Pastille : logo blanc sur fond coloré, ou initiale du label en fallback
          (même rendu que la sidebar / fiche outil via ToolLogo). */}
      <ToolLogo
        logo={data.logo}
        color={data.brandColor}
        label={data.label}
        shape="circle"
        size={32}
      />
      <span className="gnode-label">{data.label}</span>
      {data.degree >= 2 && <span className="gnode-badge">{data.degree}</span>}
    </div>
  )
}

export const graphNodeTypes = { project: ProjectNode, tool: ToolNode }
