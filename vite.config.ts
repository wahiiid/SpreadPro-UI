import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/spreadpro/',
  plugins: [
    react(),
    TanStackRouterVite(),
   
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    'process.env': process.env,
  },
  server: {
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 5173,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
