import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'

// Page victory_snake.md — récompense de la « grille parfaite » au Snake.
// Même modèle que KonamiView/ReadmeView : la prose passe par MarkdownView et le
// toggle Preview/Raw vient de ContentPage. Purement statique (pas de partie
// dynamique) : le Raw expose la SOURCE markdown ci-dessous telle quelle.
// N'apparaît dans l'explorateur que si snakeVictory === true (cf. Sidebar/App).
const VICTORY_MD = `# 🐍 Grille parfaite

Tu as rempli les 400 cases. Sans toucher un mur, sans te mordre la queue, jusqu'à ce qu'il ne reste plus une seule case libre.

Soyons honnêtes deux secondes : ça ne sert strictement à rien. Aucun recruteur ne te paiera pour ça. Et pourtant te voilà, et me voilà à t'avoir écrit une page rien que pour toi.

C'est exactement pour ce genre de personne que j'ai construit ce portfolio.

Quelqu'un qui ouvre la console pour voir ce qui s'y cache. Qui tape un vieux code de triche par réflexe. Qui résout les énigmes au lieu de fermer l'onglet. Et qui, une fois le serpent débloqué, ne lâche pas avant la grille parfaite.

Ce souci du détail, cette envie d'aller voir jusqu'au bout — c'est précisément ce que j'essaie de mettre dans chaque projet que je livre. Le no-code n'est pas une excuse pour bâcler ; c'est un terrain de jeu pour ceux qui veulent que les choses soient *bien faites*.

Alors si tu es arrivé jusqu'ici, on a probablement la même façon de voir les choses. Et ça, ça vaut une vraie conversation.

**Écris-moi avec « 🐍 » dans l'objet** — je saurai exactement d'où tu viens.

GG. 🎮

Kevin
`

export default function VictorySnakeView() {
  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">victory_snake.md</span>
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
