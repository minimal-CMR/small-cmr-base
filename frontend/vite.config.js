import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// URLs dei moduli remoti: in dev puntano alle porte locali, in prod all'origine pubblica
const ORE_URL = process.env.VITE_ORE_URL || 'http://localhost:5174';
const RICHIESTE_URL = process.env.VITE_RICHIESTE_URL || 'http://localhost:5175';
const PASSWORD_URL = process.env.VITE_PASSWORD_URL || 'http://localhost:5176';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        ore_module: `${ORE_URL}/assets/remoteEntry.js`,
        richieste_module: `${RICHIESTE_URL}/assets/remoteEntry.js`,
        password_module: `${PASSWORD_URL}/assets/remoteEntry.js`,
      },
      shared: ['react', 'react-dom', 'react-router-dom', 'axios'],
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      // Order matters: most specific first
      '/api/commesse': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/ore': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/bookings': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/passwords': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/teams': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/users/me': {
        target: 'http://localhost:8004',
        changeOrigin: true,
      },
      '/api/auth': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/users': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/api/ditte': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      '/health/ore': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        rewrite: () => '/health',
      },
      '/health/richieste': {
        target: 'http://localhost:8003',
        changeOrigin: true,
        rewrite: () => '/health',
      },
      '/health/password': {
        target: 'http://localhost:8004',
        changeOrigin: true,
        rewrite: () => '/health',
      },
      '/health': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
