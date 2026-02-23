import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { applyMode, Mode } from '@cloudscape-design/global-styles';
import App from './App';
import '@cloudscape-design/global-styles/index.css';
import './index.css';

// Force dark mode for entirely monitoring layout
applyMode(Mode.Dark);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);