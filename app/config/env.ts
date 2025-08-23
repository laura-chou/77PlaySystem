// Simple environment configuration
export const env = {
    // App configuration
    appName: process.env.NEXT_PUBLIC_APP_NAME || '77PlaySystem',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
    // API configuration
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev-77playsystem.onrender.com/',
  
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  
    // CORS configuration
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
} as const;

// Export default
export default env;