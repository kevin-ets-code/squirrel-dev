import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'

// Page victory-memory.md — récompense de la « partie parfaite » au Memory
// (zéro erreur + temps sous le seuil). Même modèle que VictorySnakeView : la prose
// passe par MarkdownView et le toggle Preview/Raw vient de ContentPage. Purement
// statique : le Raw expose la SOURCE markdown ci-dessous telle quelle.
// N'apparaît dans l'explorateur que si memoryVictory === true (cf. Sidebar/App).
//
// CONTENU À FINALISER — placeholder court et thématique, à personnaliser (ton Kevin,
// façon victory-snake.md). Ne pas considérer ce texte comme définitif.
const VICTORY_MD = `# 🧠 Mémoire parfaite

Toutes les paires retrouvées, sans la moindre erreur, et plus vite que de raison.

Soyons honnêtes : retenir une grille de logos ne figurera jamais sur un CV. Et pourtant te voilà, et me voilà à t'avoir écrit une page rien que pour toi.

C'est exactement pour ce genre d'attention au détail que j'ai construit ce portfolio.

**Écris-moi avec « 🧠 » dans l'objet** — je saurai exactement d'où tu viens.

GG. 🎮

Kevin
`

export default function VictoryMemoryView() {
  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">victory-memory.md</span>
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
