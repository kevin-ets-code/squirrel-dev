import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import data from './projects.json'
import { PreferencesProvider } from './lib/preferences.jsx'
import { logConsoleGreeting } from './lib/consoleGreeting.js'
import './styles.css'

// Clin d'œil aux devs qui ouvrent la console. Dérivé de `profile` (même source
// que le README) ; appelé ici au niveau module => une seule fois au démarrage.
logConsoleGreeting(data.profile)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreferencesProvider>
      <App />
    </PreferencesProvider>
  </React.StrictMode>,
)
