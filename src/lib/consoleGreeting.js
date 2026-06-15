// Message d'accueil affiché UNE SEULE FOIS dans la console du navigateur, pour
// les curieux qui ouvrent les devtools. Appelé une fois au démarrage depuis
// main.jsx (au niveau module, donc pas à chaque render).
//
// Tout est DÉRIVÉ de `profile` (projects.json) — rien en dur : nom, email et
// liens viennent de la même source que le README.

export function logConsoleGreeting(profile = {}) {
  // Pas de bruit côté SSR / environnements sans console.
  if (typeof console === 'undefined' || typeof console.log !== 'function') return

  const { name = '', email = '', links = {} } = profile
  const { github = '', linkedin = '' } = links

  const banner = [
    ' ___  ___ __   __',
    '|   \\| __|\\ \\ / /',
    '| |) | _|  \\ V / ',
    '|___/|___|  \\_/   ',
  ].join('\n')

  const title = 'color:#4ec9b0;font-family:monospace;font-size:12px;line-height:1.4'
  const lead = 'color:#d4d4d4;font-family:monospace;font-size:12px'
  const label = 'color:#858585;font-family:monospace;font-size:12px'
  const link = 'color:#569cd6;font-family:monospace;font-size:12px'

  console.log(`%c${banner}`, title)
  console.log(
    `%cSalut, dev 👋 Tu fouilles dans la console — j'aime déjà.%c\nCe portfolio est codé comme un éditeur. Une idée, une mission, juste envie de discuter ?`,
    `${lead};font-weight:600`,
    lead,
  )

  if (email) console.log('%c✉  Email   %c' + email, label, lead)
  if (github) console.log('%c⌥  GitHub  %c' + github, label, link)
  if (linkedin) console.log('%c in LinkedIn %c' + linkedin, label, link)

  // Clin d'œil discret : ce portfolio cache quelques easter eggs. On évoque le
  // vieux code de triche (Konami) SANS donner la séquence : l'indice reste une énigme.
  console.log(
    `%c🎮 PS  %cce portfolio cache quelques surprises… Les vieux briscards se souviennent d'un certain vieux, vieux, vieux code de triche, à toi de retrouver la suite.`,
    label,
    lead,
  )

  if (name) console.log(`%c— ${name}`, label)
}
