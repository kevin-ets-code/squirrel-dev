import { FileIcon } from './icons.jsx'

// Écran 404 affiché par l'app quand l'URL ne correspond à aucune route connue.
// L'app n'a pas de routeur (elle est pilotée par onglets) : toute route autre
// que la racine est inconnue. Vercel renvoie ces routes vers index.html (cf.
// vercel.json) et l'app décide d'afficher ce composant (voir App.jsx).
//
// Thématique mais sobre : un faux onglet "404.md" + un bloc terminal
// "cat <chemin> → No such file or directory", un titre clair et un retour
// accueil. Tout est dérivé des variables CSS de thème (clair ET sombre).
export default function NotFound({ path = '/', onHome }) {
  // Chemin demandé, affiché tel quel (texte React = pas d'injection HTML).
  const requested = path || '/'

  return (
    <div className="notfound">
      <div className="notfound-window">
        <div className="notfound-tabbar" aria-hidden="true">
          <span className="notfound-tab">
            <FileIcon size={14} color="var(--icon-perso)" />
            404.md
          </span>
        </div>

        <div className="notfound-body">
          <pre className="notfound-terminal" aria-label={`Erreur : ${requested} introuvable`}>
            <span className="nf-line">
              <span className="nf-prompt">$</span> cat <span className="nf-path">{requested}</span>
            </span>
            <span className="nf-line nf-error">cat: {requested}: No such file or directory</span>
          </pre>

          <h1 className="notfound-title">Page introuvable</h1>
          <p className="notfound-text">
            Cette page n'existe pas (ou plus). Le fichier que tu cherches n'est pas dans ce dépôt.
          </p>

          <button type="button" className="notfound-home" onClick={onHome}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  )
}
