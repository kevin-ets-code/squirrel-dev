// Moteur de la fausse API (lecture seule, GET uniquement, 100 % côté client).
// Parse une ligne « GET /projects?type=pro » → matche une route déclarée dans
// api-endpoints.js → valide la query → appelle le handler → renvoie une réponse
// normalisée. Aucune vraie requête réseau ; tout dérive de projects.json.

import { API_RESOURCES } from './api-endpoints.js'

// Table de routes à plat (l'ordre suit la déclaration ; les statiques avant les
// dynamiques par ressource, ce qui suffit ici car aucun chevauchement ambigu).
const ROUTES = API_RESOURCES.flatMap((r) => r.endpoints)

export const STATUS_TEXT = {
  200: 'OK',
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
}

// Classe de couleur d'un code HTTP (réutilise les variables --status-*).
// 2xx → vert, le reste (4xx ici) → orange.
export function httpStatusVariant(code) {
  if (code >= 200 && code < 300) return 'green'
  return 'warn'
}

// Valeurs acceptées pour un paramètre de query : liste fixe (`values`) ou
// dérivée de la donnée (`derive`). Réutilisé par la validation ET par la doc.
export function allowedValues(def, data) {
  if (def.values) return def.values
  if (typeof def.derive === 'function') return def.derive(data)
  return []
}

// Exemple d'URL d'un endpoint (string fixe ou fonction de la donnée).
export function resolveExample(ep, data) {
  return typeof ep.example === 'function' ? ep.example(data) : ep.example
}

// Découpe l'input en { method, path, query, target }.
// - method par défaut = GET (si le 1er token n'est pas un mot type méthode) ;
// - target = path + éventuelle query (conservé pour l'affichage) ;
// - path normalisé (slash de tête, pas de slash final sauf racine).
export function parseRequest(input) {
  const tokens = (input || '').trim().split(/\s+/).filter(Boolean)
  let method = 'GET'
  let target = ''
  if (tokens.length >= 2 && /^[a-zA-Z]+$/.test(tokens[0])) {
    method = tokens[0].toUpperCase()
    target = tokens[1]
  } else if (tokens.length >= 1) {
    target = tokens[0]
  }

  const qIdx = target.indexOf('?')
  let path = qIdx === -1 ? target : target.slice(0, qIdx)
  const queryString = qIdx === -1 ? '' : target.slice(qIdx + 1)
  if (path && !path.startsWith('/')) path = '/' + path
  if (path.length > 1) path = path.replace(/\/+$/, '')

  const query = {}
  if (queryString) {
    for (const [k, v] of new URLSearchParams(queryString).entries()) query[k] = v
  }

  // target reconstruit proprement pour l'affichage (path normalisé + query brute)
  const display = path + (queryString ? `?${queryString}` : '')
  return { method, path, query, target: display }
}

function matchRoute(path) {
  const segs = path.split('/').filter(Boolean)
  for (const route of ROUTES) {
    const tSegs = route.path.split('/').filter(Boolean)
    if (tSegs.length !== segs.length) continue
    const params = {}
    let ok = true
    for (let i = 0; i < tSegs.length; i++) {
      if (tSegs[i].startsWith(':')) {
        params[tSegs[i].slice(1)] = decodeURIComponent(segs[i])
      } else if (tSegs[i] !== segs[i]) {
        ok = false
        break
      }
    }
    if (ok) return { route, params }
  }
  return null
}

function resp(method, target, status, body) {
  return { method, path: target, status, statusText: STATUS_TEXT[status] || '', body }
}

// Exécute une requête et renvoie { method, path, status, statusText, body }.
// La réponse est TOUJOURS un objet JSON cohérent, erreurs comprises
// ({ error, message }).
export function executeRequest(input, data) {
  const { method, path, query, target } = parseRequest(input)

  // 1. Lecture seule : toute méthode autre que GET → 405.
  if (method !== 'GET') {
    return resp(method, target, 405, {
      error: 'Method Not Allowed',
      message: `La méthode ${method} n'est pas supportée — cette API est en lecture seule (GET uniquement).`,
    })
  }

  // 2. Aucune route ne matche → 404.
  const matched = matchRoute(path)
  if (!matched) {
    return resp(method, target, 404, {
      error: 'Not Found',
      message: `Aucune route ne correspond à "${path}".`,
    })
  }
  const { route, params } = matched

  // 3. Validation des paramètres de query déclarés (valeur hors valeurs connues
  // → 400). Un paramètre non déclaré par la route est ignoré (tolérant).
  for (const key of Object.keys(query)) {
    const def = (route.query || []).find((q) => q.param === key)
    if (!def) continue
    const allowed = allowedValues(def, data)
    if (allowed.length && !allowed.includes(query[key])) {
      return resp(method, target, 400, {
        error: 'Bad Request',
        message: `Valeur invalide pour "${key}": "${query[key]}". Valeurs acceptées : ${allowed.join(', ')}.`,
      })
    }
  }

  // 4. Handler (peut lui-même renvoyer 404 pour un id inconnu).
  const { status, body } = route.handler({ params, query, data })
  return resp(method, target, status, body)
}
