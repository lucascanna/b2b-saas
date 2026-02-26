import * as Sentry from '@sentry/nextjs';

/**
 * Validates required environment variables at runtime startup
 * This runs after build but before the application serves requests
 */
function validateEnvironmentVariables() {
  const requiredEnvVars = [
    // Database
    { key: 'POSTGRES_URL', description: 'PostgreSQL database connection URL' },
    // Redis
    { key: 'REDIS_URL', description: 'Redis connection URL' },

    // Better Auth
    { key: 'BETTER_AUTH_SECRET', description: 'Better Auth secret key' },

    // Next.js
    { key: 'NEXT_PUBLIC_APP_URL', description: 'Application URL' },
  ];

  const missingVars = requiredEnvVars.filter(({ key }) => !process.env[key]);

  if (missingVars.length > 0) {
    const errorMessage = [
      '❌ Missing required environment variables:',
      ...missingVars.map(({ key, description }) => `  - ${key}: ${description}`),
      '\nPlease add these to your .env file before starting the application.',
    ].join('\n');

    throw new Error(errorMessage);
  }

  console.log('✅ All required environment variables are present');

  // TEST: Crash after 5 seconds to simulate autorestart loop
  setTimeout(() => {
    console.error('💥 TEST CRASH: Simulating startup failure');
    process.exit(1);
  }, 5000);
}

export async function register() {
  console.log('📊 Instrumentation register() called');

  // Validate environment variables on server startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnvironmentVariables();
  }

  // Initialize Sentry in production
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    console.log('📊 Initializing Sentry...');
    try {
      if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');
      } else if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
      }
      console.log('✅ Sentry ready');
    } catch (error) {
      console.error('❌ Sentry init failed:', error);
    }
  }
}

export const onRequestError = Sentry.captureRequestError;
