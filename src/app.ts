import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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

dotenv.config();

const app = express();

// ✅ ZGJIDHJA: Konverto PORT në number
const PORT = parseInt(process.env.PORT || '3000', 10);

// --- CORS Configuration ---
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

// --- Middleware Setup ---
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions)); 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use(limiter);

// Custom Analytics Middleware
app.use(analyticsMiddleware);

// --- Route Mounting ---
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

// --- Basic Endpoints ---
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

app.get('/system-health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    const { timestamp, ...healthWithoutTimestamp } = health;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      ...healthWithoutTimestamp 
    });
  } catch (error: any) {
    console.error('System Health Check Failed:', error);
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
    console.error('Cache System Error Detected:', error.message);
    res.status(503).json({
      error: 'Cache system temporarily unavailable',
      detail: error.message,
      fallback_advice: 'The application might temporarily use direct database/API calls.'
    });
  } else {
    console.error('General Server Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      detail: error.message || 'An unexpected error occurred.',
    });
  }
});

// --- Application Startup ---
console.log('✅ Initializing cache service...');

if (cacheMaintenance && cacheMaintenance.startScheduledCleanup) {
  cacheMaintenance.startScheduledCleanup();
  console.log('🕒 Scheduled cache cleanup started.');
} else {
  console.log('ℹ️ Cache maintenance module not available or invalid.');
}

// ✅ TANI DO TE FUNKSIONOJE - PORT është number, jo string
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'ALL (*)'}`);
});
