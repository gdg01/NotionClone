// File: vite.config.ts (SOSTITUZIONE COMPLETA)

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // <-- 1. IMPORTA IL PLUGIN

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Recupera l'URL di Convex. CI SERVE PER IL SERVICE WORKER.
    const convexUrl = env.VITE_CONVEX_URL || '';
    if (!convexUrl) {
      throw new Error("VITE_CONVEX_URL non è definito! È necessario per il Service Worker.");
    }
    const convexOrigin = new URL(convexUrl).origin;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        
        // --- 2. AGGIUNGI LA CONFIGURAZIONE PWA ---
        VitePWA({
          registerType: 'autoUpdate', // Aggiorna l'app automaticamente
          
          // Configurazione del Service Worker (Caching)
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico}'], // Cache di base
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            runtimeCaching: [
              {
                // ** IMPORTANTE: Non mettere MAI in cache le chiamate a Convex **
                // Convex gestisce già la sua cache. Metterle in cache
                // qui mostrerebbe dati vecchi.
                urlPattern: new RegExp(`^${convexOrigin}`),
                handler: 'NetworkOnly', // Usa sempre la rete per Convex
              },
              {
                // Metti in cache i font di Google (se li usi)
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 anno
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
          },

          // Configurazione del Manifest (Come appare l'app)
          manifest: {
            name: "Clonotion", //
            short_name: "Clonotion",
            description: "Un editor avanzato per note e knowledge management.", //
            start_url: "/",
            // ** FONDAMENTALE per l'aspetto da app nativa **
            display: "standalone", 
            // Colori del tema (presi dal tuo index.html)
            theme_color: "#191919", //
            background_color: "#191919", //
            icons: [
              {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
              },
              {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
              },
            ],
          },
        })
        // --- FINE PWA ---
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});