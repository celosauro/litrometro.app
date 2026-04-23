import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TemaProvider } from './contexts/TemaContext';
import { LayoutProvider } from './layouts';
import './index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// Aplica a paleta Find Fuel (verde escuro) como padrão
document.documentElement.classList.add('palette-fuel');

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
