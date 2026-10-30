import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: false,
      injectRegister: false,
      registerType: 'prompt',
      includeAssets: ['brand/*.svg', 'icons/*.png', 'manifest.webmanifest'],
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,json,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 3000000,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules\/(react|react-dom|react-router)/ },
            { name: 'validation', test: /node_modules\/ajv/ },
            { name: 'storage', test: /node_modules\/dexie/ },
            { name: 'calendar', test: /node_modules\/@js-temporal/ },
          ],
        },
      },
    },
  },
});
