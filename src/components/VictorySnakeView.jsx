import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'

// Page victory-snake.md — récompense de la « grille parfaite » au Snake.
// Même modèle que KonamiView/ReadmeView : la prose passe par MarkdownView et le
// toggle Preview/Raw vient de ContentPage. Purement statique (pas de partie
// dynamique) : le Raw expose la SOURCE markdown ci-dessous telle quelle.
// N'apparaît dans l'explorateur que si snakeVictory === true (cf. Sidebar/App).
const VICTORY_MD = `# 🐍 Grille parfaite

Quatre cents cases. Sans toucher un mur, sans te mordre la queue, jusqu'à ce qu'il ne reste plus une seule case libre. Le serpent n'avait littéralement plus nulle part où aller.

Soyons clairs : ça ne sert strictement à rien. C'est bien pour ça que c'est savoureux. Remplir une grille entière demande une patience que la vie récompense rarement - sauf ici, sur cette page que presque personne ne verra.

Et la mériter prend du temps : trouver la console, réveiller un vieux code de triche, résoudre l'énigme, débloquer le serpent - puis ne plus le lâcher jusqu'à la toute dernière case. Autant dire que tu fais partie d'un club minuscule.

GG. 🎮

---

*Curieux de savoir qui a caché tout ça ? Un « 🐍 » dans l'objet d'un mail, et je reconnaîtrai un membre du club.*
`

export default function VictorySnakeView() {
  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">victory-snake.md</span>
    </>
  )

  return (
    <ContentPage
      breadcrumb={breadcrumb}
      preview={<MarkdownView source={VICTORY_MD} />}
      rawText={VICTORY_MD}
      rawFormat="markdown"
    />
  )
}
