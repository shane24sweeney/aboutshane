import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import istanbul from 'vite-plugin-istanbul';
import { SECURITY_HEADERS } from './security-headers';

/** Pages pre-rendered to <page>/index.html by scripts/prerender.mjs; keep in step with App.tsx. */
const PAGES = ['home', 'about', 'contact', 'resume', 'testimonials', 'education', 'charity', 'running', 'metrics', 'analytics'];

/** Serves /resume from resume/index.html in `npm run preview`, as CloudFront's SpaRoutingFunction does. */
function prerenderedPages(): Plugin {
  const page = new RegExp(`^/(${PAGES.join('|')})/?(\\?.*)?$`);
  return {
    name: 'prerendered-pages',
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        const match = page.exec(request.url ?? '');
        if (match) request.url = `/${match[1]}/index.html${match[2] ?? ''}`;
        next();
      });
    },
  };
}

// The website. Commands run from the repo root (`npm run dev`, `npm run build`), so the root is
// set to this folder explicitly. Unit tests have their own config: vitest.config.ts.
// COVERAGE=1 builds a copy instrumented for code coverage (`npm run build:coverage`): every source
// file counts what runs into window.__coverage__, which the Playwright tests collect. Only ever used
// for tests: infra/deploy-frontend.sh refuses to upload an instrumented build.
const coverage = process.env.COVERAGE === '1';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [
    react(),
    prerenderedPages(),
    ...(coverage
      ? [istanbul({ include: 'frontend/src/**/*', exclude: ['**/*.d.ts', 'frontend/src/main.tsx'], extension: ['.ts', '.tsx'], forceBuildInstrument: true })]
      : []),
  ],
  build: {
    // infra/deploy-frontend.sh syncs this folder (frontend/build) to S3.
    outDir: 'build',
    emptyOutDir: true,
    // Coverage maps hits back to the TypeScript source; production builds ship no source maps.
    sourcemap: coverage,
    // three.js (the Metrics chart and the Visitors globe) is one ~550 kB chunk, 137 kB gzipped,
    // named "three" and loaded only on those pages.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('/node_modules/three/') ? 'three' : undefined),
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Mirrors the CloudFront /api/* behavior when running the backend locally.
      '/api': 'http://localhost:8080',
    },
  },
  preview: {
    // The same security headers as CloudFront, so the Playwright tests run under the real policy.
    headers: SECURITY_HEADERS,
    // BrowserStack devices reach the preview server through BrowserStack Local as bs-local.com.
    allowedHosts: ['bs-local.com'],
  },
});
