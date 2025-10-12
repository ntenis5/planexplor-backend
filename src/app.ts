import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import pino from 'pino-http';
import cluster from 'cluster';
import os from 'os';

// --- Route Imports ---
import geolocationRoutes from './routes/geolocation.js'; 
import authRoutes from './routes/auth.js';
import adsRoutes from './routes/ads.js';
import paymentsRoutes from './routes/payments.js';
import affiliateRoutes from './routes/affiliate.js';
import feedRoutes from './routes/feed.js'; 
import flightsRouter from './routes/flights.js'; 
import systemAdminRouter from './routes/systemAdmin.js'; 
import cacheAdminRouter from './routes/cacheAdmin.js'; 
import analyticsRouter from './routes/analyticsDashboard.js'; 

// --- Service and Middleware Imports ---
import { enhancedCacheService } from './services/enhancedCacheService.js'; 
import { cacheMaintenance } from './services/cacheMaintenance.js';
import analyticsMiddleware from './middleware/analyticsMiddleware.js';

// --- Cluster Setup for Maximum Performance ---
const numCPUs = process.env.NODE_ENV === 'production' ? os.cpus().length : 1;

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  console.log(`🚀 Master ${process.pid} is running`);
  console.log(`🖥️  Spawning ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died. Forking new worker...`);
    cluster.fork();
  });
} else {
  // Worker process
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // --- Performance Optimizations ---
  
  // 1. Advanced Logging with Pino (10x faster than console.log)
  const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: { colorize: true }
    } : undefined
  });
  app.use(logger);

  // 2. Advanced CORS Configuration
  const FRONTEND_URL = process.env.FRONTEND_URL;
  const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://yourdomain.com' // Shto domain-in tuaj
  ].filter((url): url is string => !!url);

  const corsOptions = {
    origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours cache for CORS preflight
  };

  // 3. Advanced Security & Performance Middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // 4. Advanced Compression
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  }));

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 5. Smart Rate Limiting
  const createRateLimit = (windowMs: number, max: number, message: string) => 
    rateLimit({
      windowMs,
      max,
      message,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1' // Skip localhost
    });

  // Global limiter
  app.use(createRateLimit(15 * 60 * 1000, 1000, 'Too many requests from this IP'));
  
  // Strict limiter for auth routes
  app.use('/api/auth', createRateLimit(15 * 60 * 1000, 50, 'Too many authentication attempts'));
  
  // Loose limiter for public endpoints
  app.use('/api/geolocation', createRateLimit(15 * 60 * 1000, 300, 'Too many geolocation requests'));

  // 6. Custom Analytics Middleware
  app.use(analyticsMiddleware);

  // 7. Cache Headers Middleware for Static Content
  app.use('/api/static', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    next();
  });

  // --- Route Mounting with Performance ---
  const API_PREFIX = '/api/v1';

  app.use(`${API_PREFIX}/geolocation`, geolocationRoutes); 
  app.use(`${API_PREFIX}/auth`, authRoutes);
  app.use(`${API_PREFIX}/ads`, adsRoutes);
  app.use(`${API_PREFIX}/payments`, paymentsRoutes);
  app.use(`${API_PREFIX}/affiliate`, affiliateRoutes);
  app.use(`${API_PREFIX}/feed`, feedRoutes);
  app.use(`${API_PREFIX}/flights`, flightsRouter);

  // Admin Routes with IP whitelist in production
  const adminAuth = (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      const adminIPs = process.env.ADMIN_IPS?.split(',') || [];
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (!adminIPs.includes(clientIP!)) {
        return res.status(403).json({ error: 'Admin access denied' });
      }
    }
    next();
  };

  app.use(`${API_PREFIX}/admin/system`, adminAuth, systemAdminRouter);
  app.use(`${API_PREFIX}/admin/cache`, adminAuth, cacheAdminRouter);
  app.use(`${API_PREFIX}/analytics`, analyticsRouter);

  // --- Health Check Endpoints (Optimized) ---
  app.get('/', (req, res) => {
    res.json({ 
      message: '🚀 Planexplor Backend API is running!',
      version: '1.0.0',
      timestamp: Date.now(), // More performant than toISOString()
      environment: process.env.NODE_ENV,
      worker: process.pid
    });
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  app.get('/system-health', async (req: Request, res: Response) => {
    try {
      const health = await enhancedCacheService.getSystemHealth();
      const { timestamp, ...healthWithoutTimestamp } = health;
      
      res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        ...healthWithoutTimestamp,
        worker: process.pid
      });
    } catch (error: any) {
      req.log.error('System Health Check Failed:', error);
      res.status(503).json({ 
        status: 'unhealthy', 
        error: error.message || 'Unknown system health error',
        service: 'EnhancedCacheService',
        timestamp: Date.now()
      });
    }
  });

  // --- Global Error Handling (Performance Optimized) ---
  app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    req.log.error(error);
    
    if (error.message?.includes('cache')) {
      res.status(503).json({
        error: 'Cache system temporarily unavailable',
        detail: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        detail: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    }
  });

  // --- 404 Handler (Performance Optimized) ---
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      timestamp: Date.now()
    });
  });

  // --- Application Startup with Error Handling ---
  const startServer = async () => {
    try {
      console.log('✅ Initializing cache service...');

      if (cacheMaintenance?.startScheduledCleanup) {
        cacheMaintenance.startScheduledCleanup();
        console.log('🕒 Scheduled cache cleanup started.');
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Worker ${process.pid} running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV}`);
        console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
        console.log(`💪 Performance mode: ${numCPUs > 1 ? 'CLUSTERED' : 'SINGLE'}`);
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  };

  startServer();
              }
