import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from '../shared/App.jsx';

const container = document.getElementById('root');

if (container.hasChildNodes()) {
  hydrateRoot(container, <App />);
} else {
  const root = createRoot(container);
  root.render(<App />);
}
