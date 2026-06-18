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
  memoryVictory,
  squirrelVictory,
  onOpenReadme,
  onOpenAbout,
  onOpenProject,
  onOpenKonami,
  onOpenVictorySnake,
  onOpenVictoryMemory,
  onOpenVictorySquirrel,
}) {
  const pro = projects.filter((p) => p.type === 'pro')
  const perso = projects.filter((p) => p.type === 'perso')

  // Total de fichiers de l'explorateur = README + about-me + tous les projets
  // (pro + perso), + konami-code.md une fois le mode Jeux débloqué, + une page
  // victory-<jeu>.md par victoire-récompense atteinte (Snake / Memory / Squirrel).
  // Dérivé de la source : un projet ajouté à projects.json est compté automatiquement.
  const fileCount =
    2 +
    projects.length +
    (easterEggUnlocked ? 1 : 0) +
    (snakeVictory ? 1 : 0) +
    (memoryVictory ? 1 : 0) +
    (squirrelVictory ? 1 : 0)

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

        <button
          className={'file-row file-readme' + (activeTab === 'about' ? ' active' : '')}
          onClick={onOpenAbout}
        >
          <FileIcon color="var(--icon-system)" />
          <span className="file-name">{fileName('about', 'about-me')}</span>
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

        {memoryVictory && (
          <button
            className={'file-row file-readme' + (activeTab === 'victory-memory' ? ' active' : '')}
            onClick={onOpenVictoryMemory}
          >
            <FileIcon color="var(--icon-system)" />
            <span className="file-name">{fileName('victory-memory', 'victory-memory')}</span>
          </button>
        )}

        {squirrelVictory && (
          <button
            className={'file-row file-readme' + (activeTab === 'victory-squirrel' ? ' active' : '')}
            onClick={onOpenVictorySquirrel}
          >
            <FileIcon color="var(--icon-system)" />
            <span className="file-name">{fileName('victory-squirrel', 'victory-squirrel')}</span>
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
