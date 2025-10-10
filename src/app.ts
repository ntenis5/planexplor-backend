// src/app.ts (VERSIONI I PLOTË I RREGULLUAR DHE I PËRDITËSUAR)

import express, { Request, Response, NextFunction } from 'express'; // Shto NextFunction
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
import flightsRouter from './routes/flights.js'; // I RI
import systemAdminRouter from './routes/systemAdmin.js'; // I RI - Admin
import cacheAdminRouter from './routes/cacheAdmin.js'; // I RI - Admin Cache
import analyticsRouter from './routes/analyticsDashboard.js'; // I RI - Analitika

// --- Importet e Shërbimeve dhe Middleware ---
import { initializeCache } from './services/cacheService.js'; 
import { enhancedCacheService } from './services/enhancedCacheService.js'; // I RI - Shërbim Cache i avancuar
import { cacheMaintenance } from './services/cacheMaintenance.js'; // I RI - Maintenance Cache
import analyticsMiddleware from './middleware/analyticsMiddleware.js'; // I RI - Middleware Analitikash

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

// --- Middleware për Sigurinë dhe Performancën ---
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions)); 

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Middleware i Ri ---
// Shto middleware për tracking automatik
app.use(analyticsMiddleware); // ✅ SHTIMI I ANALITIKAVE

// --- Routes Ekzistuese dhe të Reja ---

app.use('/api/geolocation', geolocationRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api', feedRoutes); 

// --- Routes të reja të shtuara ---
app.use('/api/flights', flightsRouter); // ✅ SHTIMI I FLIGHTS
app.use('/api/admin/system', systemAdminRouter); // ✅ SHTIMI I ADMIN SYSTEM
app.use('/api/admin/cache', cacheAdminRouter); // ✅ SHTIMI I ADMIN CACHE
app.use('/api/analytics', analyticsRouter); // ✅ SHTIMI I ANALYTICS DASHBOARD

// --- Endpoints Bazë ---

// ROOT ROUTE - Për Railway/Health Check bazë
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '🚀 Placexplor Backend API is running!',
    health: '/health',
    systemHealth: '/system-health',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Health check bazë
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Health check i avancuar (Kontrollon edhe Cache)
app.get('/system-health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth(); // Thërret shërbimin e ri
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      ...health 
    });
  } catch (error: any) {
    // Saktëson tipin e gabimit për aksesin e .message
    res.status(503).json({ 
      status: 'unhealthy', 
      error: error.message || 'Unknown system health error',
      service: 'EnhancedCacheService'
    });
  }
}); // ✅ SHTIMI I SYSTEM-HEALTH

// --- Global Error Handling ---

// Global error handling për cache
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.message && (error.message.includes('cache') || error.message.includes('CACHE'))) {
    console.error('Cache System Error:', error.message);
    // Provo fallback
    res.status(500).json({ 
      error: 'Cache system temporarily unavailable',
      detail: error.message,
      fallback: 'using_direct_api'
    });
  } else {
    // Për gabimet e tjera, kalon tek error handler-at e tjerë ose default 500
    console.error('General Server Error:', error);
    next(error);
  }
}); // ✅ SHTIMI I ERROR HANDLER-IT PËR CACHE

// --- Startimi i Aplikacionit ---

// Inicializon lidhjen e Cache-it dhe Cron Jobs
initializeCache(); 
cacheMaintenance.startScheduledCleanup(); // ✅ NIS MAINTENANCE NË STARTUP

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Allowed Origins:`, allowedOrigins.length > 0 ? allowedOrigins : 'ALL (*)');
});
