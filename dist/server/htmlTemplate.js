"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDocument = renderDocument;
const DEFAULT_CLIENT_SCRIPT = '/assets/client.js';
function renderDocument({ markup, clientScriptPath = DEFAULT_CLIENT_SCRIPT }) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React SSR Base</title>
    <link rel="icon" href="data:," />
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div id="root">${markup}</div>
    <script type="module" src="${clientScriptPath}" defer></script>
  </body>
</html>`;
}
