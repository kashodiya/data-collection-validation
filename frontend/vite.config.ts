import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 58252,
    strictPort: true,
    cors: true,
    hmr: {
      clientPort: 58252,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:52308',
        changeOrigin: true,
      }
    }
  },
})
