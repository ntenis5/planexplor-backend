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
// Using enhancedCacheService for all advanced cache logic
import { enhancedCacheService } from './services/enhancedCacheService.js'; 
import { cacheMaintenance } from './services/cacheMaintenance.js'; // For starting cleanup cron job
import analyticsMiddleware from './middleware/analyticsMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
const FRONTEND_URL = process.env.FRONTEND_URL;
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173', 
  'http://localhost:3000' 
].filter((url): url is string => !!url) as string[];

// Fallback to '*' if no specific origins are configured (for initial deployment)
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
app.use(express.json({ limit: '10mb' })); // Increased limit for potential image/data uploads
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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
app.use('/api', feedRoutes); // Accessible via /api/feed-posts
app.use('/api/flights', flightsRouter);

// Admin Routes (should be protected in production using middleware)
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

// GET /system-health - Detailed system status check using Enhanced Cache Service
app.get('/system-health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    
    // Deconstruct health object to avoid duplicate timestamp property
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
// This handles errors bubbled up from middleware or routes
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  // Check for specific cache system errors to provide a specific fallback response
  if (error.message && (error.message.includes('cache') || error.message.includes('CACHE'))) {
    console.error('Cache System Error Detected:', error.message);
    res.status(503).json({ // 503 Service Unavailable is appropriate here
      error: 'Cache system temporarily unavailable',
      detail: error.message,
      fallback_advice: 'The application might temporarily use direct database/API calls.'
    });
  } else {
    // General Server Error
    console.error('General Server Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      detail: error.message || 'An unexpected error occurred.',
    });
  }
});

// --- Application Startup ---
console.log('✅ Initializing cache service...');

// Start the scheduled maintenance job if the module is available
if (cacheMaintenance && cacheMaintenance.startScheduledCleanup) {
  cacheMaintenance.startScheduledCleanup();
  console.log('🕒 Scheduled cache cleanup started.');
} else {
  console.log('ℹ️ Cache maintenance module not available or invalid.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Allowed Origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'ALL (*)'}`);
});
  
