import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'
import { LockIcon, LockOpenIcon } from './icons.jsx'
import { GAMES } from '../games/registry.js'
import { useEasterEggs } from '../lib/easterEggs.jsx'

// Page konami-code.md — rôle = LORE + ÉNIGMES (narratif).
// Comme ReadmeView : la prose (lore) passe par MarkdownView et le toggle
// Preview/Raw vient de ContentPage ; la partie dynamique (statuts des énigmes +
// progression) est rendue en React et dérive du registre (games/registry.js) et
// de l'état gamesUnlocked. Le Raw expose la SOURCE markdown du lore (comme le
// README dont le Raw n'inclut pas la section contact rendue en React).
const KONAMI_LORE = `# konami-code.md

Tu as trouvé le **Konami Code**. Bien joué. 🎮

## C'est quoi ?

Une séquence de touches restée culte chez les joueurs :

\`↑ ↑ ↓ ↓ ← → ← → B A\`

Imaginée en 1986 par **Kazuhisa Hashimoto** chez Konami pendant le portage de
*Gradius* sur NES : le jeu était trop dur à tester, il a câblé ce raccourci pour
s'octroyer tous les power-ups. Oublié dans le code à la sortie, il a été
découvert par les joueurs… puis réutilisé dans des dizaines de jeux. Depuis,
c'est *le* easter egg universel.

## Et ici ?

Le saisir (ou taper la commande cachée \`> konami\` dans la palette **Ctrl/Cmd+K**)
débloque le **mode Jeux** : un panneau « Jeux » apparaît dans la barre latérale,
et cette page se range dans l'explorateur.

Mais les jeux, eux, restent **verrouillés** : chacun cache une énigme. Trouve la
réponse, puis tape \`> solve <ta réponse>\` dans la palette **Ctrl/Cmd+K** pour
débloquer le jeu correspondant — il devient alors jouable depuis le panneau « Jeux ».
`

export default function KonamiView() {
  const { gamesUnlocked } = useEasterEggs()
  const solved = GAMES.filter((g) => gamesUnlocked[g.id]).length

  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">konami-code.md</span>
    </>
  )

  const preview = (
    <>
      <MarkdownView source={KONAMI_LORE} />

      <div className="markdown-body konami-riddles">
        <h2>Les énigmes</h2>
        <p className="konami-progress">
          {solved}/{GAMES.length} jeu{GAMES.length > 1 ? 'x' : ''} débloqué
          {solved > 1 ? 's' : ''}
        </p>

        <ul className="konami-riddle-list">
          {GAMES.map((g, i) => {
            const ok = !!gamesUnlocked[g.id]
            // Le nom du jeu ne fuite JAMAIS avant déblocage : tant que verrouillé,
            // on n'affiche qu'un libellé anonyme numéroté (ordre du registre).
            return (
              <li key={g.id} className={'konami-riddle' + (ok ? ' is-solved' : '')}>
                <div className="konami-riddle-head">
                  <span className="konami-riddle-status" aria-hidden="true" style={{ display: 'inline-flex' }}>
                    {ok ? (
                      <LockOpenIcon size={14} color="var(--accent)" />
                    ) : (
                      <LockIcon size={14} color="var(--fg-muted)" />
                    )}
                  </span>
                  <span className="konami-riddle-name">
                    {ok ? g.label : `Énigme n°${i + 1}`}
                  </span>
                  <span className="visually-hidden">{ok ? '— résolue' : '— non résolue'}</span>
                </div>
                <p className="konami-riddle-text">{g.riddle}</p>
                {ok && (
                  <p className="konami-riddle-hint">
                    <span className="konami-hint-label">Débloqué :</span> jouable depuis le
                    panneau « Jeux ».
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )

  return (
    <ContentPage
      breadcrumb={breadcrumb}
      preview={preview}
      rawText={KONAMI_LORE}
      rawFormat="markdown"
    />
  )
}
