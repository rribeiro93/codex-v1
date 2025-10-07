# React SSR Base

This repository contains a minimal server-side rendered (SSR) React starter. It provides:

- An Express server that renders React components on the server.
- Hydration on the client using React 18 APIs.
- An ESBuild-based client bundle with zero-configuration Babel setup for server-side JSX.

## Getting started

```bash
npm install
npm run dev
```

The development server starts on [http://localhost:3000](http://localhost:3000). Changes in `server/` or `src/` automatically restart the server via `nodemon`.

## Production build

```bash
npm run build
npm start
```

The build command bundles the client assets into `dist/public/assets`. The Express server serves the pre-built assets and renders the initial HTML on the server.

## Project structure

```
├── dist/                 # Output directory for built assets
├── server/               # Express server and SSR entry point
├── src/
│   ├── client/           # Client hydration entry
│   └── shared/           # React components shared by server and client
├── package.json
└── babel.config.cjs
```

Feel free to extend the starter by adding routing, state management, or API integrations.
