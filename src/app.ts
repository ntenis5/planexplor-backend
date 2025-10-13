import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors';

// 🚀 CRITICAL: Load env vars FIRST
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
// 🚀 CRITICAL: Railway uses PORT 8080 - use their environment variable
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// 🚀 CRITICAL: BASIC Middleware - MINIMAL for health check
app.use(helmet());
app.use(cors());
app.use(express.json());

// 🚀 CRITICAL: Health Check Routes - ABSOLUTE FIRST
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '🚀 Planexplor Backend API is running!',
    version: '1.0.0',
    status: 'healthy',
    timestamp: Date.now()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'planexplor-backend',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// 🚀 CRITICAL: Server starts IMMEDIATELY - NO ASYNC
console.log(`🚀 Starting server on port ${PORT}...`);
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 SERVER RUNNING on port ${PORT}`);
  console.log(`🌐 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Railway PORT: ${process.env.PORT}`);
});

// 🚀 BACKGROUND: Load additional features AFTER server starts
setImmediate(async () => {
  try {
    console.log('🚀 Loading additional features...');
    
    // Add compression
    app.use(compression());
    
    // Add logging
    const logger = pino({ 
      level: 'info',
      formatters: {
        level: (label) => ({ level: label })
      }
    });
    app.use(logger);
    
    // Add rate limiting
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Too many requests'
    });
    app.use(apiLimiter);
    
    // Body parsing with limits
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 🚀 LAZY LOAD Routes
    const routes = [
      { path: './routes/geolocation.js', mount: '/api/v1/geolocation' },
      { path: './routes/auth.js', mount: '/api/v1/auth' },
      { path: './routes/ads.js', mount: '/api/v1/ads' },
      { path: './routes/payments.js', mount: '/api/v1/payments' },
      { path: './routes/affiliate.js', mount: '/api/v1/affiliate' },
      { path: './routes/feed.js', mount: '/api/v1/feed' },
      { path: './routes/flights.js', mount: '/api/v1/flights' },
      { path: './routes/systemAdmin.js', mount: '/api/v1/admin/system' },
      { path: './routes/cacheAdmin.js', mount: '/api/v1/admin/cache' },
      { path: './routes/analyticsDashboard.js', mount: '/api/v1/analytics' }
    ];
    
    let loadedRoutes = 0;
    
    for (const route of routes) {
      try {
        const module = await import(route.path);
        app.use(route.mount, module.default);
        console.log(`✅ Mounted: ${route.mount}`);
        loadedRoutes++;
      } catch (err) {
        console.log(`⚠️  Skipped: ${route.mount} - ${err.message}`);
      }
    }
    
    console.log(`🎯 Loaded ${loadedRoutes}/${routes.length} routes successfully!`);
    
    // 🚀 Load Services
    try {
      const { cacheMaintenance } = await import('./services/cacheMaintenance.js');
      const { default: analyticsMiddleware } = await import('./middleware/analyticsMiddleware.js');
      
      if (cacheMaintenance?.startScheduledCleanup) {
        cacheMaintenance.startScheduledCleanup();
        console.log('✅ Cache service initialized');
      }
      
      if (analyticsMiddleware) {
        app.use(analyticsMiddleware);
        console.log('✅ Analytics middleware initialized');
      }
    } catch (error) {
      console.warn('⚠️ Some services not available');
    }
    
    console.log('🚀 Planexplor Backend fully operational!');
    
  } catch (error) {
    console.error('❌ Feature loading error:', error);
  }
});

// 🚀 BASIC Error Handlers
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    timestamp: Date.now()
  });
});

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.originalUrl,
    timestamp: Date.now()
  });
});

// 🚀 Graceful shutdown for Railway
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
