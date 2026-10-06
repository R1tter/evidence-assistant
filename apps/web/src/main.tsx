import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DocumentApp } from './documents/DocumentApp.js';
const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(
  <StrictMode>
    <DocumentApp />
  </StrictMode>,
);
