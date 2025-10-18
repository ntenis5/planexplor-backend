import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors';
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
let server;
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
    origin: [
        'https://planexplor-frontend.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    formatters: {
        level: (label) => ({ level: label }),
    },
});
app.use(logger);
app.use(express.json({ limit: '10mb' }));
app.get('/', (req, res) => {
    res.status(200).json({
        message: '🚀 Planexplor Backend API is running!',
        version: '1.0.0',
        status: 'healthy',
        timestamp: Date.now(),
    });
});
app.get('/health', (req, res) => {
    req.log?.info('Health check called');
    res.status(200).json({
        status: 'OK',
        service: 'planexplor-backend',
        timestamp: Date.now(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        port: PORT,
        memory: process.memoryUsage(),
    });
});
async function startServer() {
    console.log(`🚀 Starting server configuration on port ${PORT}...`);
    app.use(compression());
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: process.env.NODE_ENV === 'production' ? 1000 : 5000,
        message: 'Too many requests',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(apiLimiter);
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    const routes = [
        { path: './routes/geolocation.js', mount: '/api/v1/geolocation' },
        { path: './routes/auth.js', mount: '/api/v1/auth' },
        { path: './routes/ads.js', mount: '/api/v1/ads' },
        { path: './routes/payments.js', mount: '/api/v1/payments' },
        { path: './routes/affiliate.js', mount: '/api/v1/affiliate' },
        { path: './routes/feed.js', mount: '/api/v1/feed' },
        { path: './routes/flights.js', mount: '/api/v1/flight' },
        { path: './routes/flights.js', mount: '/api/v1/flights' },
        { path: './routes/systemAdmin.js', mount: '/api/v1/admin/system' },
        { path: './routes/cacheAdmin.js', mount: '/api/v1/admin/cache' },
        { path: './routes/analyticsDashboard.js', mount: '/api/v1/analytics' },
    ];
    let loadedRoutes = 0;
    let failedRoutes = 0;
    for (const route of routes) {
        try {
            const module = await import(route.path);
            app.use(route.mount, module.default || module);
            console.log(`✅ Mounted: ${route.mount}`);
            loadedRoutes++;
        }
        catch (err) {
            console.log(`⚠️  Skipped: ${route.mount} - ${err.message}`);
            failedRoutes++;
        }
    }
    console.log(`🎯 Loaded ${loadedRoutes}/${routes.length} routes successfully!`);
    if (failedRoutes > 0) {
        console.log(`⚠️  ${failedRoutes} routes failed to load (non-critical)`);
    }
    server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`🎯 SERVER RUNNING on port ${PORT}`);
        console.log(`🌐 Health: http://0.0.0.0:${PORT}/health`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📍 Railway PORT: ${process.env.PORT || 8080}`);
        console.log('🚀 Planexplor Backend fully operational!');
        setTimeout(async () => {
            try {
                const { cacheMaintenance } = await import('./services/cacheMaintenance.js');
                if (cacheMaintenance?.startScheduledCleanup) {
                    cacheMaintenance.startScheduledCleanup();
                    console.log('✅ Cache service initialized (Scheduled Cleanup Started)');
                }
            }
            catch (error) {
                console.error(`❌ Cache service init failed: ${error.message}`);
            }
            try {
                const { default: analyticsMiddleware } = await import('./middleware/analyticsMiddleware.js');
                if (analyticsMiddleware) {
                    app.use(analyticsMiddleware);
                    console.log('✅ Analytics middleware initialized (post-listen)');
                }
            }
            catch (error) {
                console.error(`❌ Analytics init failed: ${error.message}`);
            }
        }, 1000);
    });
}
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    if (server) {
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down...');
    if (server) {
        server.close(() => {
            console.log('✅ Server closed');
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
app.use((error, req, res, next) => {
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    if (error instanceof Error) {
        errorMessage = error.message;
        req.log?.error(error, 'Globally captured error');
    }
    else {
        req.log?.error(error, 'Unknown error caught globally');
    }
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : errorMessage,
        timestamp: Date.now(),
        path: req.path,
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: Date.now(),
        method: req.method,
    });
});
startServer().catch((error) => {
    console.error('❌ CRITICAL server startup error:', error.message);
    process.exit(1);
});
