/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'src/setupTests.ts',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/index.ts',
          'src/services/backend.ts',
          'src/services/knowledgeBaseService.ts',
          'src/services/gemini.ts',
          'src/services/importService.ts',
          'src/services/exportService.ts',
          'src/services/prompts.ts',
          'src/lib/security.ts',
        ],
        include: [
          'src/services/knowledgeBaseAnalyticsService.ts',
          'src/services/bulkOperationsService.ts',
          'src/services/relationshipService.ts',
          'src/services/versioningService.ts',
          'src/services/localLLM.ts',
          'src/services/nursingHandOff.ts',
          'src/services/templateService.ts',
          'src/lib/auditLogger.ts',
          'src/lib/logger.ts',
          'src/lib/utils.ts',
          'src/lib/validation.ts',
        ],
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
      include: ['src/**/*.test.{ts,tsx}'],
      exclude: ['node_modules', 'dist'],
    },
  };
});
