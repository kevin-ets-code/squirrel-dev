import ContentPage from './ContentPage.jsx'
import MarkdownView from './MarkdownView.jsx'

// Page victory-memory.md — récompense de la « partie parfaite » au Memory
// (zéro erreur + temps sous le seuil). Même modèle que VictorySnakeView : la prose
// passe par MarkdownView et le toggle Preview/Raw vient de ContentPage. Purement
// statique : le Raw expose la SOURCE markdown ci-dessous telle quelle.
// N'apparaît dans l'explorateur que si memoryVictory === true (cf. Sidebar/App).
const VICTORY_MD = `# 🧠 Sans faute

Toutes les paires, zéro erreur, et plus vite que de raison. Tu n'as pas joué, tu as récité.

Soyons clairs : ça ne sert strictement à rien. C'est précisément ce qui rend la chose délicieuse. Quelque part, un coin de ton cerveau a décidé que mémoriser l'emplacement de cartes décoratives valait le coup. Il avait raison.

Très peu de gens voient cet écran. Il a fallu trouver la console, réveiller un vieux code de triche, résoudre une énigme, débloquer le jeu - et *ensuite* le gagner à la perfection. Autant dire que tu fais partie d'un club assez vide.

Bienvenue dedans. 🎮

---

*Curieux de savoir qui se cache derrière ce portfolio ? Glisse un « 🧠 » dans l'objet d'un mail, je reconnaîtrai un membre du club.*
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
