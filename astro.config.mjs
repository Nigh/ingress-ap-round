// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://nigh.github.io',
  base: '/ingress-ap-round',
  integrations: [
    svelte(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Ingress AP Round',
        short_name: 'AP Round',
        description: 'Plan Ingress actions to hit a farm-session AP target',
        theme_color: '#0d3d3a',
        background_color: '#0d3d3a',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallback: '/404',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}'],
      },
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^\/$/],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
