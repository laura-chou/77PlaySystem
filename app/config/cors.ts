import { env } from './env';

// CORS configuration for different environments
export const corsConfig = {
    // Development environment
    development: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'https://dev-77playsystem.onrender.com'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        exposedHeaders: ['Content-Length', 'X-Total-Count'],
        maxAge: 86400 // 24 hours
    },

    // Staging environment
    staging: {
        origin: [
            'http://localhost:3000',
            'https://dev-77playsystem.onrender.com',
            'https://staging.77playsystem.com',
            'https://77playsystem.com'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        exposedHeaders: ['Content-Length', 'X-Total-Count'],
        maxAge: 86400
    },

    // Production environment
    production: {
        origin: [
            'https://77playsystem.com',
            'https://www.77playsystem.com',
            'https://staging.77playsystem.com',
            'https://dev-77playsystem.onrender.com'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        exposedHeaders: ['Content-Length', 'X-Total-Count'],
        maxAge: 86400
    }
};

// Get CORS config based on current environment
export function getCorsConfig() {
    switch (env.nodeEnv) {
        case 'production':
            return corsConfig.production;
        // case 'staging':
        //   return corsConfig.staging;
        case 'development':
        default:
            return corsConfig.development;
    }
}

// CORS middleware function for Express
export function corsMiddleware(req: any, res: any, next: any) {
    const config = getCorsConfig();
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (origin && config.origin.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    // Set other CORS headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', config.methods.join(', '));
    res.header('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    res.header('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    res.header('Access-Control-Max-Age', config.maxAge.toString());

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    next();
}

// Export types
export type CorsConfig = typeof corsConfig;
export type CorsEnvironment = keyof typeof corsConfig;
