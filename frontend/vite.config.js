import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // <-- NUEVO: Importamos el plugin de PWA

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // <-- NUEVO: Configuración de la PWA para hacerla instalable
    VitePWA({
      registerType: 'autoUpdate', // El Service Worker se actualiza solo
      includeAssets: ['logo_canaco_oficial.png'], // Archivo de tu carpeta public
      manifest: {
        name: 'Help Desk CANACO',
        short_name: 'Tickets CANACO',
        description: 'Sistema de Mesa de Ayuda Interna de CANACO Monterrey',
        theme_color: '#003366', // Color azul institucional para la barra superior
        background_color: '#ffffff',
        display: 'standalone', // Hace que se vea y funcione como app nativa, sin navegador
        icons: [
          {
            src: 'logo_canaco_oficial.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_canaco_oficial.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: true, // <--- ESTO APAGA EL BLOQUEO DE SEGURIDAD PARA NGROK
    proxy: {
      '/auth': 'http://localhost:3000',
      '/tickets': 'http://localhost:3000'
    }
  }
})