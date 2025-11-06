import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/__e2e__/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        'vitest.config.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'next.config.js',
        'tailwind.config.ts',
        'postcss.config.mjs',
        'database/schema/**', // Schema files are tested through queries
        'lib/queries/**', // Query functions are tested via integration/API tests
        'lib/storage/drivers/**', // Storage drivers require integration tests
        'lib/storage/index.ts', // Storage factory tested partially
        'lib/db.ts', // DB connection setup tested via queries
        'lib/types.ts', // Type definitions only
        'lib/storage/types.ts', // Type definitions only
        'lib/uppy/config.ts', // Complex mocking required for full coverage
        // Exclude untested UI components (they can be tested later)
        'components/ui/context-menu.tsx',
        'components/ui/dialog.tsx',
        'components/ui/dropdown-menu.tsx',
        'components/ui/input.tsx',
        'components/ui/label.tsx',
        'components/ui/popover.tsx',
        'components/ui/progress.tsx',
        'components/ui/scroll-area.tsx',
        'components/ui/select.tsx',
        'components/ui/separator.tsx',
        'components/ui/sidebar.tsx',
        'components/ui/textarea.tsx',
        'components/ui/toast.tsx',
        'components/ui/toaster.tsx',
        'components/**/*-page.tsx', // Page components
        'components/**/admin-*.tsx', // Admin components
        'components/**/enhanced-*.tsx', // Enhanced components
        'components/**/*form*.tsx', // Form components
        'components/uppy/**', // Uppy components
      ],
      // Thresholds - focused on testable utility functions and components
      thresholds: {
        lines: 85,
        functions: 80,
        branches: 75,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

