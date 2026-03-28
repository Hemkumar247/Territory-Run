import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  // Load all env vars from the matching .env.<mode> file (and .env).
  // Prefix '' means ALL vars are loaded (not just VITE_*) so we can also
  // read server-side vars like GEMINI_API_KEY for the dev server.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Legacy key kept for existing usages
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Expose build-time app metadata so runtime code can read it
      '__APP_ENV__': JSON.stringify(env.VITE_APP_ENV ?? mode),
      '__APP_VERSION__': JSON.stringify(env.VITE_APP_VERSION ?? '0.0.0'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
