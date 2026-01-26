const knipConfig = {
  $schema: 'https://unpkg.com/knip@latest/schema.json',
  ignore: [
    'proxy.ts',
    // Shadcn/UI components or custom registries are part of the template
    'components/ui/**',
    'components/ai-elements/**',
    // Chart/skeleton components are template examples
    'components/skeletons.tsx',
    'components/charts/**',
    // React Email templates, scanned by email dev server
    'emails/**',
    'lib/email/otp.ts',
    // Library barrel exports, infrastructure for template users
    'lib/**/index.ts',
    // Queue system - public API for manual job triggering
    'lib/queue/queues/**',
    'lib/queue/init-workers.ts',
    // Database seed script - run manually via documentation
    'lib/db/scripts/db-seed.ts',
  ],
  ignoreDependencies: [
    // Shadcn/UI dependencies (only used in components/ui/** which is ignored)
    '@radix-ui/*',
    'embla-carousel-react',
    'react-resizable-panels',
    'tailwindcss',
    'tailwindcss-animate',
    'vaul',
    // They are used but not imported in the codebase
    'drizzle-zod',
    '@trpc/next',
    // Essential template packages - part of the starter template feature set
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
    '@tanstack/react-table',
    'date-fns',
    'framer-motion',
    'react-day-picker',
    'recharts',
    'xlsx',
    'zustand',
    // DevDependencies used by tools/scripts but not imported
    '@eslint/eslintrc',
    '@faker-js/faker',
    '@react-email/preview-server',
    '@testing-library/user-event',
    'ts-node',
    'tw-animate-css',
  ],
  ignoreBinaries: ['shadcn'],
  rules: {
    files: 'error',
    dependencies: 'error',
    devDependencies: 'warn',
    unlisted: 'error',
    binaries: 'error',
    unresolved: 'error',
    exports: 'error',
    types: 'error',
    nsExports: 'error',
    nsTypes: 'error',
    duplicates: 'error',
    enumMembers: 'error',
    classMembers: 'error',
  },
};

export default knipConfig;
