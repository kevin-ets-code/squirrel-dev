# Portfolio "IDE"

Portfolio personnel présenté comme un éditeur de code (thème sombre type VS Code).
Les projets sont des fichiers `.md` rangés dans des dossiers, ouvrables en onglets,
avec un toggle **Preview / Raw**.

## Stack

- [Vite](https://vite.dev/) + [React](https://react.dev/) (JS)
- CSS pur (variables CSS, pas de framework UI)
- [`react-markdown`](https://github.com/remarkjs/react-markdown) + [`remark-gfm`](https://github.com/remarkjs/remark-gfm) pour le rendu markdown

## Démarrage rapide

```bash
npm install
npm run dev      # http://localhost:5173
```

## Ajouter un projet / déployer

Tout le contenu vit dans [`src/projects.json`](src/projects.json). Voir
[GUIDE.md](GUIDE.md) pour le détail des champs et le déploiement Vercel.

## Build

```bash
npm run build
npm run preview
```
