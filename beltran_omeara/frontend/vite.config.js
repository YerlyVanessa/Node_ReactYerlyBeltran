import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Configuración del proxy para redirigir las peticiones /api al backend de Express
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Dirección del servidor Node.js
        changeOrigin: true, // Necesario para proxies basados en nombres
        secure: false, // Usar true si el backend usa HTTPS
      },
    },
    // Nota: allowedHosts no es necesario si usas localhost
  }
})
