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
        name: 'Basque Manager OS',

        short_name: 'Basque OS',

        description:
          'Role-based Basque manager console and guest table menu',

        theme_color: '#1a130f',

        background_color: '#f4ede1',

        display: 'standalone',

        display_override: ['standalone', 'fullscreen'],

        orientation: 'portrait',

        scope: '/',

        start_url: '/',

        categories: ['food', 'productivity', 'restaurant'],

        shortcuts: [
          {
            name: 'Open Dashboard',

            url: '/dashboard',

            description: 'Monitor tables, orders, and alerts'
          },

          {
            name: 'Launch Table Menu',

            url: '/menu',

            description: 'Guest-facing digital menu experience'
          }
        ],

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
        cleanupOutdatedCaches: true,

        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,

        globPatterns: [
          '**/*.{js,css,html,svg,png,jpg,jpeg,woff2}'
        ],

        navigateFallback: '/index.html',

        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',

            handler: 'NetworkFirst',

            options: {
              cacheName: 'basque-pages',

              expiration: {
                maxEntries: 20,

                maxAgeSeconds: 60 * 60 * 12
              }
            }
          },

          {
            urlPattern: ({ request }) =>
              ['script', 'style', 'font'].includes(request.destination),

            handler: 'StaleWhileRevalidate',

            options: {
              cacheName: 'basque-static-assets',

              expiration: {
                maxEntries: 60,

                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          },

          {
            urlPattern: ({ request }) => request.destination === 'image',

            handler: 'CacheFirst',

            options: {
              cacheName: 'basque-images',

              expiration: {
                maxEntries: 80,

                maxAgeSeconds: 60 * 60 * 24 * 30
              },

              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

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