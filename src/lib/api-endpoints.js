// Définition des endpoints de la "vue API" — SOURCE UNIQUE *et* MOTEUR.
//
// Ce n'est plus une simple liste d'affichage : chaque endpoint porte un
// `handler({ params, query, data })` qui pioche dans projects.json et renvoie
// `{ status, body }`. La sidebar (ApiPanel), la doc (ApiDocPanel) et la console
// (ApiConsoleView, via api-engine.js) consomment TOUTES ce fichier — jamais de
// liste ni de logique dupliquée ailleurs. C'est, pour la vue API, l'équivalent
// de ce que projects.json est au reste de l'app.
//
// API en LECTURE SEULE (GET uniquement), aucune vraie requête réseau : tout est
// calculé côté client à partir de projects.json. Les `/stats` et tout comptage
// sont DÉRIVÉS dynamiquement, jamais codés en dur.
//
// Forme d'un endpoint :
//   { id, method, path, label, description,
//     params?: [{ param, values? | derive?, description }],  // valeurs des :param du path
//     query?: [{ param, values? | derive?, description }],
//     example: string | (data) => string,
//     handler: ({ params, query, data }) => ({ status, body }) }
// `data` = { profile, projects, tools }.
//
// `params` énumère DÉCLARATIVEMENT les valeurs possibles d'un segment `:param`
// du path (même forme que `query`, lu via allowedValues). C'est la SOURCE des
// ids pour l'autocomplétion de la console (api-autocomplete.js) — jamais une
// liste codée en dur ailleurs.

import { buildTools, toolEntry, toolProjects } from './tools.js'
import { KNOWN_CHANGELOG_CATEGORIES, filterByCategory } from './changelog.js'

const notFound = (message) => ({ status: 404, body: { error: 'Not Found', message } })

// Valeurs dérivées (listes ouvertes) — calculées depuis la donnée, jamais en dur.
const uniqueKinds = (data) =>
  [...new Set(data.projects.flatMap((p) => p.kinds || []))].sort()
const uniqueStack = (data) =>
  [...new Set(data.projects.flatMap((p) => p.stack || []))].sort()
const uniqueCategories = (data) =>
  [...new Set(buildTools(data.projects, data.tools).map((t) => t.category).filter(Boolean))].sort()

export const API_RESOURCES = [
  {
    resource: 'Projects',
    endpoints: [
      {
        id: 'projects-list',
        method: 'GET',
        path: '/projects',
        label: 'Liste des projets',
        description: 'Tous les projets, filtrables par type, par nature ou par outil.',
        query: [
          { param: 'type', values: ['pro', 'perso'], description: 'Filtre par type de projet.' },
          { param: 'kind', derive: uniqueKinds, description: 'Filtre par nature (kinds).' },
          { param: 'stack', derive: uniqueStack, description: 'Filtre par outil (id de stack).' },
        ],
        example: '/projects',
        handler: ({ query, data }) => {
          let list = data.projects
          if (query.type != null) list = list.filter((p) => p.type === query.type)
          if (query.kind != null) list = list.filter((p) => (p.kinds || []).includes(query.kind))
          if (query.stack != null) list = list.filter((p) => (p.stack || []).includes(query.stack))
          return { status: 200, body: { count: list.length, results: list } }
        },
      },
      {
        id: 'project-detail',
        method: 'GET',
        path: '/projects/:id',
        label: 'Détail d’un projet',
        description: 'Un projet complet par son id (stack, statut, plateformes…).',
        params: [
          { param: 'id', derive: (data) => data.projects.map((p) => p.id), description: 'Id d’un projet.' },
        ],
        example: (data) => `/projects/${data.projects[0]?.id ?? ':id'}`,
        handler: ({ params, data }) => {
          const project = data.projects.find((p) => p.id === params.id)
          if (!project) return notFound(`Aucun projet avec l'id "${params.id}".`)
          return { status: 200, body: project }
        },
      },
    ],
  },
  {
    resource: 'Tools',
    endpoints: [
      {
        id: 'tools-list',
        method: 'GET',
        path: '/tools',
        label: 'Liste des outils',
        description: 'Tous les outils déduits des stacks, filtrables par catégorie.',
        query: [
          { param: 'category', derive: uniqueCategories, description: 'Filtre par catégorie d’outil.' },
        ],
        example: '/tools',
        handler: ({ query, data }) => {
          let tools = buildTools(data.projects, data.tools)
          if (query.category != null) {
            tools = tools.filter((t) => (t.category || '') === query.category)
          }
          const results = tools.map((t) => ({
            id: t.id,
            label: t.label,
            category: t.category || null,
            usedIn: t.count,
          }))
          return { status: 200, body: { count: results.length, results } }
        },
      },
      {
        id: 'tool-detail',
        method: 'GET',
        path: '/tools/:id',
        label: 'Détail d’un outil',
        description: 'Un outil et les projets qui l’utilisent.',
        params: [
          { param: 'id', derive: (data) => buildTools(data.projects, data.tools).map((t) => t.id), description: 'Id d’un outil.' },
        ],
        example: (data) => `/tools/${data.projects[0]?.stack?.[0] ?? ':id'}`,
        handler: ({ params, data }) => {
          const projects = toolProjects(data.projects, params.id)
          const declared = data.tools && data.tools[params.id]
          if (!declared && projects.length === 0) {
            return notFound(`Aucun outil avec l'id "${params.id}".`)
          }
          const t = toolEntry(data.tools, params.id)
          return {
            status: 200,
            body: {
              id: t.id,
              label: t.label,
              category: t.category || null,
              description: t.description || null,
              url: t.url || null,
              usedIn: projects.length,
              projects: projects.map((p) => ({ id: p.id, name: p.name, type: p.type })),
            },
          }
        },
      },
    ],
  },
  {
    resource: 'Profile',
    endpoints: [
      {
        id: 'profile',
        method: 'GET',
        path: '/profile',
        label: 'Profil',
        description: 'Identité, rôle et liens de contact.',
        example: '/profile',
        handler: ({ data }) => ({ status: 200, body: data.profile }),
      },
    ],
  },
  {
    resource: 'Changelog',
    endpoints: [
      {
        id: 'changelog-list',
        method: 'GET',
        path: '/changelog',
        label: 'Changelog',
        description: 'Historique des versions (antéchronologique), filtrable par catégorie.',
        query: [
          {
            param: 'category',
            // Catégories CONNUES (pas seulement présentes) : une catégorie connue
            // sans entrée reste valide (→ count: 0) ; seul l'inconnu donne 400.
            values: KNOWN_CHANGELOG_CATEGORIES,
            description: 'Filtre par catégorie de changement (added, changed, fixed…).',
          },
        ],
        example: '/changelog',
        handler: ({ query, data }) => {
          // Filtre « réduit » : si une catégorie est demandée, chaque version ne
          // garde que cette catégorie dans `changes` (version/date conservés).
          const results =
            query.category != null
              ? filterByCategory(data.changelog, query.category)
              : data.changelog
          return { status: 200, body: { count: results.length, results } }
        },
      },
    ],
  },
  {
    resource: 'Stats',
    endpoints: [
      {
        id: 'stats',
        method: 'GET',
        path: '/stats',
        label: 'Statistiques',
        description: 'Compteurs agrégés, dérivés dynamiquement de projects.json.',
        example: '/stats',
        handler: ({ data }) => {
          const { projects } = data
          const projectsByType = projects.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1
            return acc
          }, {})
          const tools = buildTools(projects, data.tools)
          const toolsByCategory = tools.reduce((acc, t) => {
            const cat = t.category || 'Autres'
            acc[cat] = (acc[cat] || 0) + 1
            return acc
          }, {})
          const kinds = projects.reduce((acc, p) => {
            for (const k of p.kinds || []) acc[k] = (acc[k] || 0) + 1
            return acc
          }, {})
          const years = projects.map((p) => p.year).filter(Boolean)
          return {
            status: 200,
            body: {
              projects: projects.length,
              projectsByType,
              tools: tools.length,
              toolsByCategory,
              kinds,
              years: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
            },
          }
        },
      },
    ],
  },
]

// Nombre total d'endpoints (compteur de section, dérivé — jamais en dur).
export const API_ENDPOINT_COUNT = API_RESOURCES.reduce(
  (sum, r) => sum + r.endpoints.length,
  0,
)
