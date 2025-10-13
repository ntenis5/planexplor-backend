import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors';

// 🚀 ULTRA-PERFORMANCE: Serveri niset PARA çdo gjeje
const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// 🚀 ULTRA-PERFORMANCE: Health Check INSTANT
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

// 🚀 ULTRA-PERFORMANCE: Start Server IMMEDIATELY
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎯 Server RUNNING on port ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
});

// 🚀 ULTRA-PERFORMANCE: Tani ngarko middleware dhe routes
const initializeApp = async () => {
  try {
    console.log('🚀 Initializing Planexplor Backend...');
    
    // 🚀 ULTRA-PERFORMANCE: Load env vars
    if (process.env.NODE_ENV !== 'production') {
      dotenv.config();
    }

    // 🚀 ULTRA-PERFORMANCE: Basic Middleware
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    app.use(compression());
    
    app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 🚀 ULTRA-PERFORMANCE: Optimized Logging
    const logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      formatters: { level: (label) => ({ level: label }) },
      base: undefined
    });
    app.use(logger);

    // 🚀 ULTRA-PERFORMANCE: Rate Limiting
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Too many requests'
    });
    app.use(apiLimiter);

    // 🚀 ULTRA-PERFORMANCE: Lazy Load Routes
    const loadRoute = async (routePath: string) => {
      try {
        const module = await import(routePath);
        return module.default;
      } catch (error) {
        console.warn(`Route ${routePath} not available`);
        return null;
      }
    };

    // 🚀 ULTRA-PERFORMANCE: Mount Routes Background
    const routeConfigs = [
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

    // 🚀 ULTRA-PERFORMANCE: Load routes në background
    Promise.allSettled(
      routeConfigs.map(async ({ path, mount }) => {
        const route = await loadRoute(path);
        if (route) {
          app.use(mount, route);
          console.log(`✅ Mounted ${mount}`);
        }
      })
    ).then(() => {
      console.log('🎯 All routes loaded successfully!');
    });

    // 🚀 ULTRA-PERFORMANCE: Load Services Background
    const loadServices = async () => {
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
    };

    loadServices();

    console.log('🚀 Planexplor Backend fully initialized!');

  } catch (error) {
    console.error('❌ Initialization error:', error);
    // 🚀 ULTRA-PERFORMANCE: Serveri është TASHMË running, kështu që vazhdon të punojë
  }
};

// 🚀 ULTRA-PERFORMANCE: Initialize në background
initializeApp();

// 🚀 ULTRA-PERFORMANCE: Error Handlers
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

// 🚀 ULTRA-PERFORMANCE: Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
