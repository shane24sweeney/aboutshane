import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Unit and component tests in tests/unit, run against the site's source in frontend/src.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/unit/setup.ts',
    css: false,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    tags: [
      { name: 'negative', description: 'Error handling, invalid input and failure paths' },
      { name: 'security', description: 'Security headers, consent and what analytics may do' },
    ],
    // `npm run test:coverage`: coverage of frontend/src for the daily quality report. Istanbul, the
    // same instrumenter as the browser coverage build, so scripts/coverage/merge.mjs can add them up.
    coverage: {
      provider: 'istanbul',
      include: ['frontend/src/**/*.{ts,tsx}'],
      exclude: ['frontend/src/**/*.d.ts', 'frontend/src/main.tsx'],
      reporter: ['text-summary', 'json-summary', 'json', 'html'],
      reportsDirectory: 'coverage',
    },
  },
});
