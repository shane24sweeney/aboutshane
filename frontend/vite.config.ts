import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The website. Commands run from the repo root (`npm run dev`, `npm run build`), so the root is
// set to this folder explicitly. Unit tests have their own config: vitest.config.ts.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    // infra/deploy-frontend.sh syncs this folder (frontend/build) to S3.
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      // Mirrors the CloudFront /api/* behavior when running the backend locally.
      '/api': 'http://localhost:8080',
    },
  },
  preview: {
    // BrowserStack devices reach the preview server through BrowserStack Local as bs-local.com.
    allowedHosts: ['bs-local.com'],
  },
});
