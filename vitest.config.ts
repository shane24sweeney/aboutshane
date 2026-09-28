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
    tags: [{ name: 'negative', description: 'Error handling, invalid input and failure paths' }],
  },
});
