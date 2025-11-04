// File: index.tsx (SOSTITUZIONE COMPLETA)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConvexClientProvider } from './ConvexClientProvider'; // Provider autenticato
import { ConvexReactClient } from "convex/react"; // Client standard
import { ConvexProvider } from "convex/react"; // Provider standard
import { PublicPageView } from './components/PublicPageView'; // Importa la pagina pubblica

import './index.css'
import 'virtual:pwa-register';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Client Convex standard (non autenticato)
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

// Logica di Routing Semplice
const path = window.location.pathname;

if (path.startsWith('/share/')) {
  // --- VISTA PUBBLICA ---
  // Estrai lo shareId dall'URL (es. /share/abc123xyz)
  const shareId = path.substring('/share/'.length);

  root.render(
    <React.StrictMode>
      {/* Usa il provider Convex standard, non quello di Clerk, 
        perché l'utente non è autenticato.
      */}
      <ConvexProvider client={convex}>
        <PublicPageView shareId={shareId} />
      </ConvexProvider>
    </React.StrictMode>
  );

} else {
  // --- APP PRINCIPALE (AUTENTICATA) ---
  // Questo è il tuo flusso originale
  root.render(
    <React.StrictMode>
      <ConvexClientProvider> {/* Il tuo provider con Clerk */}
        <App />
      </ConvexClientProvider>
    </React.StrictMode>
  );
}