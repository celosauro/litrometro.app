import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'production'
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png'],
            manifest: false, // Usar manifest.json existente em public/
            workbox: {
              // Força o novo SW a assumir o controle imediatamente após o deploy
              skipWaiting: true,
              clientsClaim: true,
              // Remove caches de versões antigas automaticamente
              cleanupOutdatedCaches: true,
              globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
              runtimeCaching: [
                {
                  // Cache de dados de preços - Stale While Revalidate (mostra cache, atualiza em background)
                  urlPattern: /\/dados\/.*\.json$/,
                  handler: 'StaleWhileRevalidate',
                  options: {
                    cacheName: 'dados-combustiveis',
                    expiration: {
                      maxEntries: 200,
                      maxAgeSeconds: 60 * 60, // 1 hora
                    },
                  },
                },
                {
                  // Cache de tiles do mapa - Cache First (prioriza cache)
                  urlPattern: /^https:\/\/.*\.tile\./,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'map-tiles',
                    expiration: {
                      maxEntries: 500,
                      maxAgeSeconds: 60 * 60 * 24, // 24 horas
                    },
                  },
                },
                {
                  // Cache de fontes - Cache First
                  urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
                  handler: 'CacheFirst',
                  options: {
                    cacheName: 'google-fonts',
                    expiration: {
                      maxEntries: 30,
                      maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
                    },
                  },
                },
              ],
            },
          }),
        ]
      : []),
  ],
  base: '/',
}))
