import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      useCredentials: true, 
      includeAssets: ['/logo_canaco_oficial.png'], // <-- Regresamos a tu nombre original
      manifest: {
        name: 'Help Desk CANACO',
        short_name: 'Tickets CANACO',
        description: 'Sistema de Mesa de Ayuda Interna de CANACO Monterrey',
        theme_color: '#003366',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo_canaco_oficial.png', // <-- Regresamos a tu nombre original
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo_canaco_oficial.png', // <-- Regresamos a tu nombre original
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      // 👇 NUEVO: Evita que la PWA secuestre los enlaces de las fotos 👇
      workbox: {
        navigateFallbackDenylist: [/^\/uploads/] 
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    allowedHosts: true, 
    hmr: {
      clientPort: 443 
    },
    proxy: {
      '/auth': 'http://localhost:3000',
      '/tickets': 'http://localhost:3000',
      // 👇 NUEVO: Conecta la carpeta de fotos con el Backend 👇
      '/uploads': 'http://localhost:3000' 
    }
  }
})