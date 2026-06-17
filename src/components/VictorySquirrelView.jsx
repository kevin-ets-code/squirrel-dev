import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'

// Page victory-squirrel.md — récompense du palier de score au Squirrel (WIN_SCORE).
// Même modèle que VictorySnakeView : la prose passe par MarkdownView et le toggle
// Preview/Raw vient de ContentPage. Purement statique : le Raw expose la SOURCE
// markdown ci-dessous telle quelle.
// N'apparaît dans l'explorateur que si squirrelVictory === true (cf. Sidebar/App).
const VICTORY_MD = `# 🐿️ Dix mille

Tu sais ce qui est dur, dans ce jeu ? Pas l'obstacle. Le neuf-centième. Quand ça fait des minutes que tu cours, que la vitesse a doublé, et qu'une seconde d'inattention efface tout. La plupart des gens ont fermé l'onglet bien avant d'arriver là.

Pas toi.

Soyons clairs : ça ne sert à rien, et c'est très bien comme ça. Personne ne décerne de médaille pour avoir esquivé dix mille points de cactus. À part cette page. Considère-la comme ta médaille.

Et elle se mérite : trouver la console, réveiller un vieux code de triche, résoudre l'énigme, débloquer l'écureuil — puis tenir. Longtemps. Sans lâcher. Très peu de gens descendent aussi loin dans le terrier.

GG. 🎮

---

*Envie de savoir qui a planqué tout ça ? Un « 🐿️ » dans l'objet d'un mail, et je saurai d'où tu sors.*
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
