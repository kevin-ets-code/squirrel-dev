import { useState } from 'react'
import RawView from './RawView.jsx'

// Coquille générique d'une page de contenu de l'éditeur : barre d'outils
// (breadcrumb + toggle Preview/Raw) puis zone scrollable.
// - `preview` : le rendu lisible (React).
// - `rawText` / `rawFormat` : la SOURCE BRUTE de la page et son format
//   ("json" pour projet/outil, "markdown" pour le README, etc.).
// Le mécanisme est mutualisé ici : toute nouvelle page hérite de Preview/Raw
// (et du bouton copier de la vue Raw) sans le re-coder.
export default function ContentPage({ breadcrumb, preview, rawText, rawFormat = 'json' }) {
  const [mode, setMode] = useState('preview')

  return (
    <div className="project-view">
      <div className="content-toolbar">
        <div className="breadcrumb">{breadcrumb}</div>

        <div className="view-toggle" role="tablist" aria-label="Mode d'affichage">
          <button
            role="tab"
            aria-selected={mode === 'preview'}
            className={'toggle-btn' + (mode === 'preview' ? ' active' : '')}
            onClick={() => setMode('preview')}
          >
            Preview
          </button>
          <button
            role="tab"
            aria-selected={mode === 'raw'}
            className={'toggle-btn' + (mode === 'raw' ? ' active' : '')}
            onClick={() => setMode('raw')}
          >
            Raw
          </button>
        </div>
      </div>

      <div className="content-scroll">
        {mode === 'preview' ? preview : <RawView content={rawText} format={rawFormat} />}
      </div>
    </div>
  )
}
