import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/fraunces/latin-400-italic.css';
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-800.css';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing root');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
