// src/app.ts (VERSIONI I RREGULLUAR PËR CORS)

import express from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import geolocationRoutes from './routes/geolocation.js'; 
import authRoutes from './routes/auth.js';
import adsRoutes from './routes/ads.js';
import paymentsRoutes from './routes/payments.js';
import affiliateRoutes from './routes/affiliate.js';
import feedRoutes from './routes/feed.js'; 

import { initializeCache } from './services/cacheService.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- KONFIGURIMI I RI I CORS ---
const allowedOrigins = [
  'https://planexplor-frontend.vercel.app', // ✅ DOMAIN-I I VERCEL
  'https://placexplor-backend-production.up.railway.app', // ✅ DOMAIN-I I BACKEND
  'http://localhost:5173', 
  'http://localhost:3000',
  process.env.FRONTEND_URL // ✅ NËSE E KONFIGURON NË RAILWAY
].filter((url): url is string => !!url) as string[];

const corsOptions = {
  origin: function (origin, callback) {
    // ✅ LEJO REQUEST-ET PA ORIGIN (POSTMAN, ETC)
    if (!origin) return callback(null, true);
    
    // ✅ LEJO DOMAIN-ET NË LISTË
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.log('CORS Blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// --- Middleware për Sigurinë dhe Performancën ---
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions)); // ✅ PËRDOR CORS ME KONFIGURIMIN E RI

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

// --- Routes ---
app.use('/api/geolocation', geolocationRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api', feedRoutes); 

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: {
      allowedOrigins: allowedOrigins,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

// Inicializon lidhjen e Supabase dhe Cron Jobs
initializeCache(); 

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS Allowed Origins:`, allowedOrigins);
});
