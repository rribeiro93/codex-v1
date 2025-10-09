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

The development server starts on [http://localhost:3000](http://localhost:3000). Changes in `server/` or `src/` automatically restart the server via `nodemon`, and the client bundle is rebuilt in watch mode by ESBuild.

### Environment variables

Create a `.env` file (see `.env` for defaults) to supply MongoDB connection details:

```
MONGODB_URI=mongodb://root:example@localhost:27017/?authSource=admin
MONGODB_DB_NAME=codex
```

When using the provided `docker-compose.yml`, the defaults connect to the MongoDB instance started by Docker.

## Production build

```bash
npm run build
npm start
```

The build command bundles the client assets into `dist/public/assets`. The Express server serves the pre-built assets and renders the initial HTML on the server. When running in production mode the server ensures the bundle exists before starting.

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

## CSV preview component

The default page now includes a CSV uploader component. It lets you pick a `.csv` file, parses
each row, and presents the data as JSON objects with the following shape:

```json
[
  {
    "date": "",
    "place": "",
    "name": "",
    "price": "",
    "installments": ""
  }
]
```

Use the button on the homepage to select a CSV file and preview the transformed output instantly.
