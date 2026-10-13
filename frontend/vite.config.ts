import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/** Pages pre-rendered to <page>/index.html by scripts/prerender.mjs; keep in step with App.tsx. */
const PAGES = ['home', 'about', 'contact', 'resume', 'testimonials', 'education', 'charity'];

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
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react(), prerenderedPages()],
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
