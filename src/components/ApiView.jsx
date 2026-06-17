import ApiTabs from './ApiTabs.jsx'
import ApiConsoleView from './ApiConsoleView.jsx'
import ApiDocPanel from './ApiDocPanel.jsx'
import ApiLogsPanel from './ApiLogsPanel.jsx'

// Zone principale de la vue API : barre d'onglets interne (ApiTabs) + le panneau
// actif. Trois sections, toutes pilotées par le sous-état `apiTab` remonté dans
// App (session only, pas de localStorage) :
//   - console : la console fonctionnelle (champ + Send + réponse via RawView) ;
//   - doc     : la doc style Swagger, générée depuis api-endpoints.js ;
//   - logs    : l'historique plein écran + panneau de détail (split interne).
// Le panneau actif est le tabpanel ARIA relié à son onglet (ApiTabs).
export default function ApiView({
  apiTab,
  onApiTab,
  // console
  value,
  onChange,
  onSend,
  result,
  focusSignal,
  // doc
  apiData,
  onSelectEndpoint,
  // logs
  logs,
  onReplay,
}) {
  return (
    <div className="api-view">
      <ApiTabs active={apiTab} onSelect={onApiTab} />
      <div
        className="api-view-panel"
        role="tabpanel"
        id={`api-panel-${apiTab}`}
        aria-labelledby={`api-tab-${apiTab}`}
        tabIndex={-1}
      >
        {apiTab === 'console' && (
          <ApiConsoleView
            value={value}
            onChange={onChange}
            onSend={onSend}
            result={result}
            focusSignal={focusSignal}
            data={apiData}
          />
        )}
        {apiTab === 'doc' && (
          <ApiDocPanel apiData={apiData} onSelectEndpoint={onSelectEndpoint} />
        )}
        {apiTab === 'logs' && <ApiLogsPanel logs={logs} onReplay={onReplay} />}
      </div>
    </div>
  )
}
