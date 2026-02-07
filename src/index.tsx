import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

if (container) {
  if (container.hasChildNodes()) {
    hydrateRoot(container, <App />);
  } else {
    const root = createRoot(container);
    root.render(<App />);
  }
}
