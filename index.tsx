import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConvexClientProvider } from './ConvexClientProvider'; // Importa il provider
import './index.css'
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ConvexClientProvider> {/* Avvolgi l'app */}
      <App />
    </ConvexClientProvider>
  </React.StrictMode>
);