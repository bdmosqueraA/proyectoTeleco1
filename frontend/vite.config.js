import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api requests to MiniIdentity (.NET) to avoid CORS issues
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Forward /routes and /trips to trip-log-service (FastAPI)
      // bypass: if browser is requesting HTML (page refresh), serve the SPA instead
      '/routes': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return req.url;
        },
      },
      '/trips': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return req.url;
        },
      },
    },
  },
})
