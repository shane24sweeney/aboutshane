import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    // infra/deploy-frontend.sh syncs this folder to S3.
    outDir: 'build',
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
