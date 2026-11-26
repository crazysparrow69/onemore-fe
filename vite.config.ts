import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { loadValidatedEnv } from './src/shared/lib/env.ts';

export default defineConfig(({ mode }) => {
  const env = loadValidatedEnv({
    ...loadEnv(mode, process.cwd(), ''),
    ...process.env,
  });

  return {
    plugins: [
      tailwindcss(),
      react(),
      ...VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'onemore',
          short_name: 'onemore',
          description: 'Щоденник тренувань і харчування',
          lang: 'uk',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globIgnores: ['**/heic-to-*.js'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
              handler: 'NetworkOnly',
            },
            {
              urlPattern: ({ url }) =>
                /^\/assets\/heic-to-[^/]+\.js$/.test(url.pathname),
              handler: 'CacheFirst',
              options: {
                cacheName: 'heic-converter',
                expiration: { maxEntries: 2 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.pathname.startsWith('/exercises/') &&
                url.pathname.endsWith('.webp'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'exercise-photos',
                expiration: { maxEntries: 300 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              urlPattern: ({ url }) => url.hostname === 'res.cloudinary.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'user-media',
                expiration: { maxEntries: 200 },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: env.PORT,
      proxy: {
        '/api': { target: env.API_URL, changeOrigin: true },
      },
    },
    preview: { port: env.PORT },
  };
});
