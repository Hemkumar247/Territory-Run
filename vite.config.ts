import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Connect } from 'vite';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { createTacticalAdvice, isProjectUser, readAdviceInput } from './api/tactician';

function tacticianDevApi(apiKey: string, nvidiaKey: string, nvidiaModel: string) {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url?.split('?')[0];
    if (url !== '/api/tactician') {
      next();
      return;
    }

    if (req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', async () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as unknown;
        const input = readAdviceInput(body);
        if (!input) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid input' }));
          return;
        }

        const header = req.headers.authorization;
        const match = typeof header === 'string' ? header.match(/^Bearer\s+(.+)$/i) : null;
        const allowed = await isProjectUser(match?.[1]?.trim() || '');
        if (!allowed) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Sign in required' }));
          return;
        }

        const advice = await createTacticalAdvice(input.distanceTotal, input.recentRuns, apiKey, { apiKey: nvidiaKey, model: nvidiaModel });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ advice }));
      } catch {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ advice: 'Tactician AI (Offline): Expand your perimeter.' }));
      }
    });
  };

  return {
    name: 'tactician-dev-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const nvidiaKey = env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY || '';
  const nvidiaModel = env.NVIDIA_MODEL || process.env.NVIDIA_MODEL || '';
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN || '';
  const sentryOrg = env.SENTRY_ORG || process.env.SENTRY_ORG || '';
  const sentryProject = env.SENTRY_PROJECT || process.env.SENTRY_PROJECT || '';
  
  return {
    plugins: [
      react(),
      tailwindcss(),
      tacticianDevApi(geminiKey, nvidiaKey, nvidiaModel),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // registered manually in main.tsx, web only (the APK bundles its own assets)
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'Territory Run',
          short_name: 'Territory',
          description: 'A location-based running game where users claim territory by running around it.',
          theme_color: '#080B12',
          background_color: '#080B12',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['fitness', 'games', 'sports'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'map-tiles-cache',
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      ...(mode === 'production' && sentryAuthToken && sentryOrg && sentryProject
        ? [
            sentryVitePlugin({
              authToken: sentryAuthToken,
              org: sentryOrg,
              project: sentryProject,
              telemetry: false,
            }),
          ]
        : []),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts'
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-map': ['leaflet', 'react-leaflet', '@turf/turf'],
            'vendor-ai': ['@google/genai'],
            'vendor-animations': ['motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
            'vendor-pwa': ['vite-plugin-pwa'],
          },
        },
        external: ['fsevents'],
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
