import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/rubencetask/',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      manifest: {
        name: 'RubenceTask',
        short_name: 'RubenceTask',
        description: 'Notas y recordatorios personales',
        theme_color: '#6750A4',
        background_color: '#F3EDF7',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/rubencetask/',
        start_url: '/rubencetask/',
        icons: [
          { src: '/rubencetask/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/rubencetask/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
});