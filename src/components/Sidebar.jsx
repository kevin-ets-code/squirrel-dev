import { FileIcon } from './icons.jsx'
import { statusColor } from '../lib/status.js'
import { fileName } from '../lib/fileName.js'
import Folder from './Folder.jsx'

export default function Sidebar({
  profile,
  projects,
  activeTab,
  easterEggUnlocked,
  snakeVictory,
  onOpenReadme,
  onOpenProject,
  onOpenKonami,
  onOpenVictorySnake,
}) {
  const pro = projects.filter((p) => p.type === 'pro')
  const perso = projects.filter((p) => p.type === 'perso')

  // Total de fichiers de l'explorateur = README + tous les projets (pro + perso),
  // + konami-code.md une fois le mode Jeux débloqué, + victory-snake.md une fois
  // la « grille parfaite » du Snake atteinte. Dérivé de la source : un projet
  // ajouté à projects.json est compté automatiquement.
  const fileCount =
    1 + projects.length + (easterEggUnlocked ? 1 : 0) + (snakeVictory ? 1 : 0)

  const renderFile = (project) => (
    <button
      key={project.id}
      className={'file-row' + (activeTab === project.id ? ' active' : '')}
      onClick={() => onOpenProject(project)}
    >
      <FileIcon color={`var(--icon-${project.type})`} />
      <span className="file-name">{fileName(project.type, project.name)}</span>
      {project.status && (
        <span
          className="file-status-dot"
          style={{ background: statusColor(project.status) }}
          title={project.status}
        />
      )}
    </button>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Explorateur</div>
      <div className="sidebar-section-label">
        PAGES<span className="section-count">{fileCount}</span>
      </div>

      <div className="sidebar-tree">
        <button
          className={'file-row file-readme' + (activeTab === 'readme' ? ' active' : '')}
          onClick={onOpenReadme}
        >
          <FileIcon color="var(--icon-system)" />
          <span className="file-name">{fileName('readme', 'README')}</span>
        </button>

        {easterEggUnlocked && (
          <button
            className={'file-row file-readme' + (activeTab === 'konami' ? ' active' : '')}
            onClick={onOpenKonami}
          >
            <FileIcon color="var(--icon-system)" />
            <span className="file-name">{fileName('konami', 'konami-code')}</span>
          </button>
        )}

        {snakeVictory && (
          <button
            className={'file-row file-readme' + (activeTab === 'victory-snake' ? ' active' : '')}
            onClick={onOpenVictorySnake}
          >
            <FileIcon color="var(--icon-system)" />
            <span className="file-name">{fileName('victory-snake', 'victory-snake')}</span>
          </button>
        )}

        <Folder label="pro" count={pro.length}>
          {pro.map(renderFile)}
        </Folder>

        <Folder label="perso" count={perso.length}>
          {perso.map(renderFile)}
        </Folder>
      </div>
    </aside>
  )
}
