// src/app.ts (VERSIONI I KORRIGJUAR)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// --- Importet e Routes ekzistuese ---
import geolocationRoutes from './routes/geolocation.js'; 
import authRoutes from './routes/auth.js';
import adsRoutes from './routes/ads.js';
import paymentsRoutes from './routes/payments.js';
import affiliateRoutes from './routes/affiliate.js';
import feedRoutes from './routes/feed.js'; 

// --- Importet e Routes të reja ---
import flightsRouter from './routes/flights.ts'; // ✅ NDRYSHUAR: .js -> .ts
import systemAdminRouter from './routes/systemAdmin.js'; 
import cacheAdminRouter from './routes/cacheAdmin.js'; 
import analyticsRouter from './routes/analyticsDashboard.js'; 

// --- Importet e Shërbimeve dhe Middleware ---
import { cacheService } from './services/cacheService.js';
import { enhancedCacheService } from './services/enhancedCacheService.js';
import { cacheMaintenance } from './services/cacheMaintenance.js';
import analyticsMiddleware from './middleware/analyticsMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- KONFIGURIMI I QËNDRUESHËM I CORS ---
const FRONTEND_URL = process.env.FRONTEND_URL;
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173', 
  'http://localhost:3000' 
].filter((url): url is string => !!url) as string[];
const corsOrigin = allowedOrigins.length > 0 ? allowedOrigins : '*';

const corsOptions = {
  origin: corsOrigin, 
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};

// --- Middleware ---
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions)); 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(analyticsMiddleware);

// --- Routes ---
app.use('/api/geolocation', geolocationRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api', feedRoutes); 
app.use('/api/flights', flightsRouter);
app.use('/api/admin/system', systemAdminRouter);
app.use('/api/admin/cache', cacheAdminRouter);
app.use('/api/analytics', analyticsRouter);

// --- Endpoints Bazë ---
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '🚀 Placexplor Backend API is running!',
    health: '/health',
    systemHealth: '/system-health',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// ✅ SYSTEM-HEALTH I KORRIGJUAR - PA DUPLICATE TIMESTAMP
app.get('/system-health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    
    // KRIJO OBJEKT TË RI PA TIMESTAMP DUPLICATE
    const { timestamp, ...healthWithoutTimestamp } = health;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      ...healthWithoutTimestamp 
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message || 'Unknown system health error',
      service: 'EnhancedCacheService',
      timestamp: new Date().toISOString()
    });
  }
});

// --- Global Error Handling ---
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.message && (error.message.includes('cache') || error.message.includes('CACHE'))) {
    console.error('Cache System Error:', error.message);
    res.status(500).json({ 
      error: 'Cache system temporarily unavailable',
      detail: error.message,
      fallback: 'using_direct_api'
    });
  } else {
    console.error('General Server Error:', error);
    next(error);
  }
});

// --- Startimi i Aplikacionit ---
console.log('✅ Initializing cache service...');

if (cacheMaintenance && cacheMaintenance.startScheduledCleanup) {
  cacheMaintenance.startScheduledCleanup();
} else {
  console.log('ℹ️ Cache maintenance not available');
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Allowed Origins:`, allowedOrigins.length > 0 ? allowedOrigins : 'ALL (*)');
});
