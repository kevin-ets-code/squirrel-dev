// Registre des jeux — SOURCE UNIQUE de la partie ludique du portfolio.
// Même esprit que projects.json (une seule source de vérité), mais séparé : ce
// ne sont pas des projets. La page konami-code.md, le panneau « Jeux », la
// palette (commande fantôme « > solve … ») et l'ouverture d'onglet de jeu
// dérivent TOUS de ce tableau — aucune liste de jeux n'est codée en dur ailleurs.
//
// Chaque entrée :
//   id        identifiant stable (slug minuscule) ; sert de clé dans gamesUnlocked.
//   label     nom affiché — RÉVÉLÉ UNIQUEMENT une fois le jeu débloqué (le nom ne
//             doit jamais fuiter avant : ni page konami, ni panneau Jeux, ni palette).
//   riddle    énoncé de l'énigme à résoudre pour débloquer le jeu.
//   solutions TABLEAU de réponses valides (matchées après normalisation, cf.
//             normalizeAnswer). Deux énigmes ne doivent JAMAIS partager une
//             solution (gameIdForAnswer renvoie le premier match).
//   component composant jouable (rendu dans un onglet via openGame), ou `null`
//             tant que le jeu est un placeholder.
import MemoryGame from '../components/games/MemoryGame.jsx'
import SnakeGame from '../components/games/SnakeGame.jsx'
import SquirrelGame from '../components/games/SquirrelGame.jsx'

export const GAMES = [
  {
    id: 'snake',
    label: 'Snake',
    riddle:
      'J’avance sans patte, je grandis en mangeant, et le pire ennemi de ma faim, c’est moi-même. Qui suis-je ?',
    solutions: ['serpent', 'snake'],
    component: SnakeGame,
  },
  {
    id: 'memory',
    label: 'Memory',
    riddle:
      'Pour gagner à ce jeu, il faut en avoir une bonne. Les ordinateurs la mesurent en Go, toi en souvenirs. Qu’est-ce ?',
    solutions: ['jeu de paires', 'memory', 'memoire'],
    component: MemoryGame,
  },
  {
    id: 'squirrel',
    label: 'Squirrel',
    riddle:
      'Je file sur les branches, je fais des bonds, et l’hiver je vis de ce que j’ai mis de côté. Qui suis-je ?',
    solutions: ['ecureuil', 'squirrel'],
    component: SquirrelGame,
  },
]

// Id d'onglet d'un jeu (convention stable, comme toolTabId pour les outils).
export const gameTabId = (id) => 'game:' + id

export function gameById(id) {
  return GAMES.find((g) => g.id === id) || null
}

// Normalise une réponse d'énigme pour la comparaison : sans accents (NFD +
// suppression des diacritiques), minuscules, trimée, espaces multiples réduits.
// Utilisée des DEUX côtés (saisie utilisateur ET solutions du registre) pour que
// « Mémoire », « memoire » ou «  jeu  de   paires » matchent comme prévu.
export function normalizeAnswer(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

// Pour une réponse donnée, retourne l'id du jeu dont une des solutions
// (normalisée) correspond, ou null. Renvoie le PREMIER match dans l'ordre du
// registre — les énigmes ne partagent jamais de solution, mais la fonction est
// structurée pour rester déterministe si jamais c'était le cas.
export function gameIdForAnswer(answer) {
  const norm = normalizeAnswer(answer)
  if (!norm) return null
  for (const g of GAMES) {
    if ((g.solutions || []).some((sol) => normalizeAnswer(sol) === norm)) return g.id
  }
  return null
}
