import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// Config Vitest separato dal vite.config principale per evitare
// il federation plugin (non serve in test env e ingombra l'output).
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
  },
});
