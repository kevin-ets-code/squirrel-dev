import { FileTypeIcon } from './icons.jsx'
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
  onOpenChangelog,
  onOpenServices,
  onOpenProject,
  onOpenKonami,
  onOpenVictorySnake,
  onOpenVictoryMemory,
  onOpenVictorySquirrel,
}) {
  const pro = projects.filter((p) => p.type === 'pro')
  const perso = projects.filter((p) => p.type === 'perso')

  // Total de fichiers de l'explorateur = README + about-me + CHANGELOG + services +
  // tous les projets (pro + perso), + konami-code.md une fois le mode Jeux débloqué,
  // + une page victory-<jeu>.md par victoire-récompense atteinte (Snake / Memory / Squirrel).
  // Dérivé de la source : un projet ajouté à projects.json est compté automatiquement.
  const fileCount =
    4 +
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
      <FileTypeIcon type={project.type} color={`var(--icon-${project.type})`} />
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
          <FileTypeIcon type="readme" color="var(--icon-system)" />
          <span className="file-name">{fileName('readme', 'README')}</span>
        </button>

        <button
          className={'file-row file-readme' + (activeTab === 'about' ? ' active' : '')}
          onClick={onOpenAbout}
        >
          <FileTypeIcon type="about" color="var(--icon-system)" />
          <span className="file-name">{fileName('about', 'about-me')}</span>
        </button>

        <button
          className={'file-row file-readme' + (activeTab === 'changelog' ? ' active' : '')}
          onClick={onOpenChangelog}
        >
          <FileTypeIcon type="changelog" color="var(--icon-system)" />
          <span className="file-name">{fileName('changelog', 'changelog')}</span>
        </button>

        <button
          className={'file-row file-readme' + (activeTab === 'services' ? ' active' : '')}
          onClick={onOpenServices}
        >
          <FileTypeIcon type="services" color="var(--icon-system)" />
          <span className="file-name">{fileName('services', 'services')}</span>
        </button>

        {easterEggUnlocked && (
          <button
            className={'file-row file-readme' + (activeTab === 'konami' ? ' active' : '')}
            onClick={onOpenKonami}
          >
            <FileTypeIcon type="konami" color="var(--icon-system)" />
            <span className="file-name">{fileName('konami', 'konami-code')}</span>
          </button>
        )}

        {snakeVictory && (
          <button
            className={'file-row file-readme' + (activeTab === 'victory-snake' ? ' active' : '')}
            onClick={onOpenVictorySnake}
          >
            <FileTypeIcon type="victory-snake" color="var(--icon-system)" />
            <span className="file-name">{fileName('victory-snake', 'victory-snake')}</span>
          </button>
        )}

        {memoryVictory && (
          <button
            className={'file-row file-readme' + (activeTab === 'victory-memory' ? ' active' : '')}
            onClick={onOpenVictoryMemory}
          >
            <FileTypeIcon type="victory-memory" color="var(--icon-system)" />
            <span className="file-name">{fileName('victory-memory', 'victory-memory')}</span>
          </button>
        )}

        {squirrelVictory && (
          <button
            className={'file-row file-readme' + (activeTab === 'victory-squirrel' ? ' active' : '')}
            onClick={onOpenVictorySquirrel}
          >
            <FileTypeIcon type="victory-squirrel" color="var(--icon-system)" />
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
