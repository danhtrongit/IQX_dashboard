import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-tooltip', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge', 'zod', 'sonner'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    proxy: {
      // Proxy API requests
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/api/v1/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})