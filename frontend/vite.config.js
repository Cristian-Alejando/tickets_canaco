import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // <--- ESTO APAGA EL BLOQUEO DE SEGURIDAD PARA NGROK
    proxy: {
      '/auth': 'http://localhost:3000',
      '/tickets': 'http://localhost:3000'
    }
  }
})