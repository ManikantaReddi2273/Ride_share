import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // Direct proxy to user-service for admin endpoints (bypasses API Gateway routing issues in dev)
      // This keeps requests same-origin (through Vite) so CORS is not a problem
      '/user-service': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        // Strip the /user-service prefix when forwarding to user-service
        rewrite: (path) => path.replace(/^\/user-service/, ''),
      },
    }
  },
  preview: {
    port: 5173,
    host: true
  },
  optimizeDeps: {
    exclude: ['jspdf'] // Exclude from pre-bundling to avoid import analysis errors
  },
  define: {
    // Polyfill for Node.js global variable (required by sockjs-client)
    global: 'globalThis',
  },
})
