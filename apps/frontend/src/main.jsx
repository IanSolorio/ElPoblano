import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // Si tienes algún estilo adicional
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./modules/auth/application/AuthContext";

// Conserva compatibilidad con las URLs usadas antes de migrar desde HashRouter
// y con el antiguo prefijo de despliegue de GitHub Pages.
const legacyPrefix = "/ElPoblano";
const legacyHashPath = window.location.hash.startsWith("#/")
  ? window.location.hash.slice(1)
  : null;
const usesLegacyPrefix = window.location.pathname === legacyPrefix
  || window.location.pathname.startsWith(`${legacyPrefix}/`);

if (legacyHashPath || usesLegacyPrefix) {
  const normalizedPath = legacyHashPath
    || window.location.pathname.slice(legacyPrefix.length)
    || "/";
  window.history.replaceState(null, "", `${normalizedPath}${window.location.search}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
