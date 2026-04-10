import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      useCredentials: true, 
      // 👇 Actualizamos para incluir tu favicon y los iconos nuevos 👇
      includeAssets: ['favicon.ico', 'iconos/android-chrome-192x192.png', 'iconos/android-chrome-512x512.png'], 
      manifest: {
        name: 'Help Desk CANACO',
        short_name: 'Tickets CANACO',
        description: 'Sistema de Mesa de Ayuda Interna de CANACO Monterrey',
        theme_color: '#003366',
        background_color: '#ffffff',
        display: 'standalone',
        // 👇 ESTA ES LA LISTA APUNTANDO A TU CARPETA DE ICONOS 👇
        icons: [
          {
            src: '/iconos/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/iconos/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      // 👇 Evita que la PWA secuestre los enlaces de las fotos 👇
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
      // 👇 Conecta la carpeta de fotos con el Backend 👇
      '/uploads': 'http://localhost:3000' 
    }
  }
})