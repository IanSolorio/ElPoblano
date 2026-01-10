import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'; // Si tienes algún estilo adicional
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter, HashRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/ElPoblano">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
