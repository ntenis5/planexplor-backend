import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors';

// 🚀 PERFORMANCE: Load env vars SYNCHRONOUSLY
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// 🚀 PERFORMANCE: Health Check FIRST - para çdo gjeje
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

// 🚀 PERFORMANCE: Optimized Middleware Stack
app.use(helmet({
  contentSecurityPolicy: false, // 🚀 Disable për API performance
  crossOriginEmbedderPolicy: false
}));

app.use(compression({
  level: 6, // 🚀 Optimal compression level
  threshold: 1024
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🚀 PERFORMANCE: Optimized Logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  base: undefined // 🚀 Remove pid, hostname for performance
});

app.use(logger);

// 🚀 PERFORMANCE: Smart Rate Limiting
const createRateLimit = (windowMs: number, max: number, message: string) => 
  rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // 🚀 Only track failures
  });

app.use(createRateLimit(15 * 60 * 1000, 1000, 'Too many requests'));
app.use('/api/auth', createRateLimit(15 * 60 * 1000, 50, 'Too many auth attempts'));

// 🚀 PERFORMANCE: Async Route Loading me Cache
const routeCache = new Map();

const loadRoute = async (routePath: string) => {
  if (routeCache.has(routePath)) {
    return routeCache.get(routePath);
  }
  
  try {
    const module = await import(routePath);
    routeCache.set(routePath, module.default);
    return module.default;
  } catch (error) {
    console.warn(`Route ${routePath} not available`);
    return null;
  }
};

// 🚀 PERFORMANCE: Parallel Route Loading
const loadAllRoutes = async () => {
  const routePromises = [
    { path: './routes/geolocation.js', key: 'geolocationRoutes' },
    { path: './routes/auth.js', key: 'authRoutes' },
    { path: './routes/ads.js', key: 'adsRoutes' },
    { path: './routes/payments.js', key: 'paymentsRoutes' },
    { path: './routes/affiliate.js', key: 'affiliateRoutes' },
    { path: './routes/feed.js', key: 'feedRoutes' },
    { path: './routes/flights.js', key: 'flightsRouter' },
    { path: './routes/systemAdmin.js', key: 'systemAdminRouter' },
    { path: './routes/cacheAdmin.js', key: 'cacheAdminRouter' },
    { path: './routes/analyticsDashboard.js', key: 'analyticsRouter' }
  ].map(async ({ path, key }) => {
    const route = await loadRoute(path);
    return { key, route };
  });

  const routes = await Promise.allSettled(routePromises);
  const result: any = {};

  routes.forEach((routeResult) => {
    if (routeResult.status === 'fulfilled' && routeResult.value.route) {
      result[routeResult.value.key] = routeResult.value.route;
    }
  });

  return result;
};

// 🚀 PERFORMANCE: Service Loading me Fallback
const loadServices = async () => {
  const servicePromises = [
    { path: './services/enhancedCacheService.js', key: 'enhancedCacheService' },
    { path: './services/cacheMaintenance.js', key: 'cacheMaintenance' },
    { path: './middleware/analyticsMiddleware.js', key: 'analyticsMiddleware' }
  ].map(async ({ path, key }) => {
    try {
      const module = await import(path);
      return { 
        key, 
        value: key === 'analyticsMiddleware' ? module.default : module[key] 
      };
    } catch (error) {
      console.warn(`Service ${key} not available`);
      return { key, value: null };
    }
  });

  const services = await Promise.allSettled(servicePromises);
  const result: any = {};

  services.forEach((serviceResult) => {
    if (serviceResult.status === 'fulfilled') {
      result[serviceResult.value.key] = serviceResult.value.value;
    }
  });

  return result;
};

// 🚀 PERFORMANCE: Application Startup Optimized
const startServer = async () => {
  try {
    console.log('🚀 Starting Planexplor Backend - Performance Optimized...');
    
    // 🚀 PERFORMANCE: Parallel loading i routes dhe services
    const [routes, services] = await Promise.all([
      loadAllRoutes(),
      loadServices()
    ]);

    console.log(`✅ Loaded ${Object.keys(routes).length} routes`);
    console.log(`✅ Loaded ${Object.keys(services).length} services`);

    // 🚀 PERFORMANCE: Mount routes
    const API_PREFIX = '/api/v1';
    
    Object.entries(routes).forEach(([key, route]) => {
      if (route) {
        const path = `/${key.replace(/Routes?|Router$/, '').toLowerCase()}`;
        app.use(`${API_PREFIX}${path}`, route as any);
        console.log(`✅ Mounted ${API_PREFIX}${path}`);
      }
    });

    // 🚀 PERFORMANCE: Initialize services
    if (services.cacheMaintenance?.startScheduledCleanup) {
      services.cacheMaintenance.startScheduledCleanup();
      console.log('✅ Cache service initialized');
    }

    if (services.analyticsMiddleware) {
      app.use(services.analyticsMiddleware);
      console.log('✅ Analytics middleware initialized');
    }

    // 🚀 PERFORMANCE: Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎯 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Node Version: ${process.version}`);
      console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
    });

  } catch (error: any) {
    console.error('❌ Failed to start server:', error);
    
    // 🚀 PERFORMANCE: Fallback mode - serveri niset gjithmonë
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️  Server running in fallback mode on port ${PORT}`);
      console.log(`🌐 Basic endpoints available`);
    });
  }
};

// 🚀 PERFORMANCE: Optimized Error Handlers
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

// 🚀 START SERVER
startServer();
