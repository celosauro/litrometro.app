import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TemaProvider } from './contexts/TemaContext';
import { LayoutProvider } from './layouts';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// Aplica a paleta minimalista como padrão
document.documentElement.classList.add('palette-minimal');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TemaProvider>
      <LayoutProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LayoutProvider>
    </TemaProvider>
  </React.StrictMode>
);
