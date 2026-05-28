import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'icons.svg'
      ],

      manifest: {
        name: 'Basque Restaurant',

        short_name: 'Basque',

        description:
          'Basque QR Menu and Restaurant Manager Dashboard',

        theme_color: '#1d120c',

        background_color: '#f6f1ea',

        display: 'standalone',

        orientation: 'portrait',

        scope: '/',

        start_url: '/',

        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },

          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        globPatterns: [
          '**/*.{js,css,html,svg,png,jpg,jpeg}'
        ],

        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:5000\/api\/.*/i,

            handler: 'NetworkFirst',

            options: {
              cacheName: 'basque-api-cache',

              expiration: {
                maxEntries: 50,

                maxAgeSeconds: 60 * 60 * 24
              },

              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})