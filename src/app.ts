import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors';

// Load env vars with better error handling
try {
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
  }
} catch (error) {
  console.warn('⚠️  .env file not found, using environment variables');
}

// --- Route Imports me error handling ---
const loadRoutes = async () => {
  try {
    const { default: geolocationRoutes } = await import('./routes/geolocation.js');
    const { default: authRoutes } = await import('./routes/auth.js');
    const { default: adsRoutes } = await import('./routes/ads.js');
    const { default: paymentsRoutes } = await import('./routes/payments.js');
    const { default: affiliateRoutes } = await import('./routes/affiliate.js');
    const { default: feedRoutes } = await import('./routes/feed.js');
    const { default: flightsRouter } = await import('./routes/flights.js');
    const { default: systemAdminRouter } = await import('./routes/systemAdmin.js');
    const { default: cacheAdminRouter } = await import('./routes/cacheAdmin.js');
    const { default: analyticsRouter } = await import('./routes/analyticsDashboard.js');

    return {
      geolocationRoutes, authRoutes, adsRoutes, paymentsRoutes,
      affiliateRoutes, feedRoutes, flightsRouter, systemAdminRouter,
      cacheAdminRouter, analyticsRouter
    };
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
    throw error;
  }
};

// --- Service Imports me error handling ---
const loadServices = async () => {
  try {
    const { enhancedCacheService } = await import('./services/enhancedCacheService.js');
    const { cacheMaintenance } = await import('./services/cacheMaintenance.js');
    const { default: analyticsMiddleware } = await import('./middleware/analyticsMiddleware.js');

    return { enhancedCacheService, cacheMaintenance, analyticsMiddleware };
  } catch (error) {
    console.warn('⚠️  Some services not available:', error.message);
    return { enhancedCacheService: null, cacheMaintenance: null, analyticsMiddleware: (req, res, next) => next() };
  }
};

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// --- Performance Optimizations ---

// 1. Advanced Logging with Pino - Robust version
const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

app.use(logger);

// 2. Advanced CORS Configuration
const FRONTEND_URL = process.env.FRONTEND_URL;
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173', 
  'http://localhost:3000'
].filter((url): url is string => !!url);

const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// 3. Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate Limiting
const createRateLimit = (windowMs: number, max: number, message: string) => 
  rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });

app.use(createRateLimit(15 * 60 * 1000, 1000, 'Too many requests'));
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 50, 'Too many auth attempts'));

// --- Health Check (Always available) ---
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Planexplor Backend API is running!',
    version: '1.0.0',
    timestamp: Date.now(),
    status: 'healthy'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

// --- Application Startup ---
const startServer = async () => {
  try {
    console.log('🚀 Starting Planexplor Backend...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Node Version: ${process.version}`);
    console.log(`📍 Port: ${PORT}`);

    // Load routes and services
    console.log('📦 Loading routes and services...');
    const routes = await loadRoutes();
    const services = await loadServices();

    // Mount routes
    const API_PREFIX = '/api/v1';
    app.use(`${API_PREFIX}/geolocation`, routes.geolocationRoutes);
    app.use(`${API_PREFIX}/auth`, routes.authRoutes);
    app.use(`${API_PREFIX}/ads`, routes.adsRoutes);
    app.use(`${API_PREFIX}/payments`, routes.paymentsRoutes);
    app.use(`${API_PREFIX}/affiliate`, routes.affiliateRoutes);
    app.use(`${API_PREFIX}/feed`, routes.feedRoutes);
    app.use(`${API_PREFIX}/flights`, routes.flightsRouter);
    app.use(`${API_PREFIX}/admin/system`, routes.systemAdminRouter);
    app.use(`${API_PREFIX}/admin/cache`, routes.cacheAdminRouter);
    app.use(`${API_PREFIX}/analytics`, routes.analyticsRouter);

    // Initialize services if available
    if (services.cacheMaintenance?.startScheduledCleanup) {
      services.cacheMaintenance.startScheduledCleanup();
      console.log('✅ Cache service initialized');
    }

    // Use analytics middleware if available
    app.use(services.analyticsMiddleware);

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Provide basic functionality even if some modules fail
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️  Server running in fallback mode on port ${PORT}`);
      console.log(`🌐 Basic health check available at: http://localhost:${PORT}/health`);
    });
  }
};

// Global error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    timestamp: Date.now()
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: Date.now()
  });
});

// Start the server
startServer();
