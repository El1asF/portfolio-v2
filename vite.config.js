// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        youtube: resolve(__dirname, 'youtube.html'),
        projects: resolve(__dirname, 'filmprojects.html'),
        others: resolve(__dirname, 'weitere-arbeiten.html'),
      },
    },
  },
  server: {
    open: true, // Öffnet Browser automatisch beim Start
  }
});