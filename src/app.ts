import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors';

// Load env vars
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

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

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// --- Performance Optimizations ---

// 1. Advanced Logging with Pino - SIMPLE & WORKING
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
  threshold: 1024
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
    skipSuccessfulRequests: false
  });

app.use(createRateLimit(15 * 60 * 1000, 1000, 'Too many requests from this IP'));
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 50, 'Too many authentication attempts'));

// 6. Custom Analytics Middleware
app.use(analyticsMiddleware);

// --- Route Mounting ---
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/geolocation`, geolocationRoutes); 
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/ads`, adsRoutes);
app.use(`${API_PREFIX}/payments`, paymentsRoutes);
app.use(`${API_PREFIX}/affiliate`, affiliateRoutes);
app.use(`${API_PREFIX}/feed`, feedRoutes);
app.use(`${API_PREFIX}/flights`, flightsRouter);
app.use(`${API_PREFIX}/admin/system`, systemAdminRouter);
app.use(`${API_PREFIX}/admin/cache`, cacheAdminRouter);
app.use(`${API_PREFIX}/analytics`, analyticsRouter);

// --- Health Check Endpoints (Optimized) ---
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Planexplor Backend API is running!',
    version: '1.0.0',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    status: 'healthy'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

app.get('/system-health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    const { timestamp, ...healthWithoutTimestamp } = health;
    
    res.json({ 
      status: 'healthy', 
      timestamp: Date.now(),
      ...healthWithoutTimestamp
    });
  } catch (error: any) {
    (req as any).log?.error('System Health Check Failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      error: 'Service temporarily unavailable',
      timestamp: Date.now()
    });
  }
});

// --- Global Error Handling ---
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  (req as any).log?.error(error);
  
  if (error.message?.includes('cache')) {
    res.status(503).json({
      error: 'Cache system temporarily unavailable'
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      detail: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// --- 404 Handler ---
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: Date.now()
  });
});

// --- Application Startup ---
const startServer = async () => {
  try {
    console.log('🚀 Starting Planexplor Backend...');
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Node Version: ${process.version}`);

    // Initialize cache service
    console.log('✅ Initializing cache service...');
    
    if (cacheMaintenance?.startScheduledCleanup) {
      cacheMaintenance.startScheduledCleanup();
      console.log('🕒 Scheduled cache cleanup started.');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ') || 'ALL'}`);
      console.log(`📍 Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
