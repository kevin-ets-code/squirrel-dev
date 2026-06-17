import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'

// Page victory-squirrel.md — récompense du palier de score au Squirrel (WIN_SCORE).
// Même modèle que VictorySnakeView : la prose passe par MarkdownView et le toggle
// Preview/Raw vient de ContentPage. Purement statique : le Raw expose la SOURCE
// markdown ci-dessous telle quelle.
// N'apparaît dans l'explorateur que si squirrelVictory === true (cf. Sidebar/App).
//
// CONTENU À FINALISER — placeholder court et thématique, à personnaliser (ton Kevin,
// façon victory-snake.md). Ne pas considérer ce texte comme définitif.
const VICTORY_MD = `# 🐿️ Provision parfaite

Le palier est tombé. Assez de noisettes pour passer dix hivers, ramassées un bond après l'autre sans jamais lâcher.

Soyons honnêtes : courir après un score dans un faux terminal ne paiera aucune facture. Et pourtant te voilà, et me voilà à t'avoir écrit une page rien que pour toi.

C'est exactement pour ce genre de ténacité que j'ai construit ce portfolio.

**Écris-moi avec « 🐿️ » dans l'objet** — je saurai exactement d'où tu viens.

GG. 🎮

Kevin
`

export default function VictorySquirrelView() {
  const breadcrumb = (
    <>
      <span className="crumb">src</span>
      <span className="crumb-sep">›</span>
      <span className="crumb crumb-active">victory-squirrel.md</span>
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
