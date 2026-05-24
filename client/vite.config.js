import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/inbox': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/channels': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/ecommerce': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/webhooks': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})

