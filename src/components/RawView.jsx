// Vue "Raw" générique : affiche la SOURCE BRUTE d'une page, avec gouttière de
// numéros de ligne et un bouton copier (coin haut-droite).
// - format "json"     : coloration syntaxique maison (projets, outils…) ;
// - format "markdown" / autre : texte brut monospace, sans coloration.
// Toute nouvelle page passe simplement sa source + son format.
import CopyButton from './CopyButton.jsx'

const TOKEN_RE = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(-?\d+\.?\d*)|(true|false|null)/g

function highlightLine(line) {
  const tokens = []
  let lastIndex = 0
  let match
  let key = 0

  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ value: line.slice(lastIndex, match.index), cls: 'tok-punct' })
    }
    if (match[1] !== undefined) {
      // clé : "xxx":  -> on sépare la string du ":" pour la couleur
      const raw = match[1]
      const colonIdx = raw.lastIndexOf(':')
      const keyStr = raw.slice(0, colonIdx)
      const rest = raw.slice(colonIdx)
      tokens.push({ value: keyStr, cls: 'tok-key' })
      tokens.push({ value: rest, cls: 'tok-punct' })
    } else if (match[2] !== undefined) {
      tokens.push({ value: match[2], cls: 'tok-string' })
    } else if (match[3] !== undefined) {
      tokens.push({ value: match[3], cls: 'tok-number' })
    } else if (match[4] !== undefined) {
      tokens.push({ value: match[4], cls: 'tok-number' })
    }
    lastIndex = TOKEN_RE.lastIndex
  }
  if (lastIndex < line.length) {
    tokens.push({ value: line.slice(lastIndex), cls: 'tok-punct' })
  }

  return tokens.map((t, i) => (
    <span key={i} className={t.cls}>
      {t.value}
    </span>
  ))
}

export default function RawView({ content, format = 'json' }) {
  const text = typeof content === 'string' ? content : ''
  const lines = text.split('\n')
  const isJson = format === 'json'

  return (
    <div className={'raw-view' + (isJson ? '' : ' raw-plain')}>
      <CopyButton text={text} label="Copier la source" className="raw-copy" />
      {/* Gouttière de numéros pour le JSON (lignes courtes, alignées 1:1).
          Pour le markdown (lignes longues qui s'enroulent), on l'omet pour ne
          pas désaligner les numéros. */}
      {isJson && (
        <div className="raw-gutter" aria-hidden="true">
          {lines.map((_, i) => (
            <div key={i} className="raw-lineno">
              {i + 1}
            </div>
          ))}
        </div>
      )}
      <pre className={'raw-code' + (isJson ? '' : ' raw-code-wrap')}>
        <code>
          {lines.map((line, i) => (
            <div key={i} className="raw-line">
              {isJson ? highlightLine(line) : line}
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}
