import { GAMES, gameTabId } from '../games/registry.js'
import { useEasterEggs } from '../lib/easterEggs.jsx'

// Panneau « Jeux » (sidebar) — rôle = LAUNCHER. Liste les jeux du registre
// (source unique : games/registry.js, rien en dur). Un jeu est :
//   - verrouillé (🔒, non cliquable) tant que son énigme n'est pas résolue ;
//   - débloqué (✅, cliquable → openGame) une fois gamesUnlocked[id] = true.
// À cette étape aucune énigme n'est résolvable : tous les jeux s'affichent
// verrouillés, mais le rendu débloqué/cliquable est prêt pour l'étape 2.
// Les énigmes elles-mêmes ne sont PAS dupliquées ici : elles vivent dans
// konami-code.md ; ce panneau ne fait que lancer.
export default function GamesPanel({ activeTab, onOpenGame }) {
  const { gamesUnlocked } = useEasterEggs()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Jeux</div>
      <div className="sidebar-section-label">
        JEUX<span className="section-count">{GAMES.length}</span>
      </div>
      <div className="sidebar-tree">
        {GAMES.map((g, i) => {
          const unlocked = !!gamesUnlocked[g.id]

          if (!unlocked) {
            // Emplacement ANONYME numéroté (ordre du registre) : ni label ni
            // énigme ne fuitent tant que le jeu n'est pas débloqué.
            return (
              <div
                key={g.id}
                className="file-row game-row game-locked"
                aria-disabled="true"
                title="Jeu verrouillé — résous son énigme (voir konami-code.md)"
              >
                <span className="game-status" aria-hidden="true">
                  🔒
                </span>
                <span className="file-name">Jeu n°{i + 1}</span>
              </div>
            )
          }

          return (
            <button
              key={g.id}
              className={'file-row game-row' + (activeTab === gameTabId(g.id) ? ' active' : '')}
              onClick={() => onOpenGame(g.id)}
            >
              <span className="game-status" aria-hidden="true">
                ✅
              </span>
              <span className="file-name">{g.label}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
