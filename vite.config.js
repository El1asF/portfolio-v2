import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Hier definieren wir ALLE HTML-Seiten, die gebaut werden sollen.
        // Wenn eine fehlt, gibt es einen 404 Fehler auf Netlify.
        main: resolve(__dirname, 'index.html'),
        youtube: resolve(__dirname, 'youtube.html'),
        filmprojects: resolve(__dirname, 'filmprojects.html'),
        detail: resolve(__dirname, 'project-detail.html'), // WICHTIG: Hatte gefehlt!
        weitere: resolve(__dirname, 'weitere-arbeiten.html'),
        impressum: resolve(__dirname, 'impressum.html'),
        datenschutz: resolve(__dirname, 'datenschutz.html'),
      },
    },
  },
  server: {
    open: true,
  }
});