import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Development сервер
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  },
  
  // Production build настройки
  build: {
    outDir: 'build',  // Output to 'build' for Render compatibility
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          chess: ['chess.js', 'react-chessboard'],
        },
      },
    },
  },
  
  // Preview сервер (после build)
  preview: {
    port: 4173,
    host: true,
  },
})
