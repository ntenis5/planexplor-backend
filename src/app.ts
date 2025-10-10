// src/app.ts (VERSIONI MË I FUNDIT DHE I STABILIZUAR TS)

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

// --- KONFIGURIMI KORRIGJUAR I CORS (PËR STABILITETIN E TS) ---

const FRONTEND_URL = process.env.FRONTEND_URL;

// Krijon listën e plotë të origjinave të lejuara (LIVE URL + Localhost)
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173', 
  'http://localhost:3000' 
].filter(url => url); 

const corsOptions = {
  // Përdorim funksionin e deklaruar në vend të funksionit shigjetë për të shmangur gabimet e TS
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS denied for: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};

// --- Middleware për Sigurinë dhe Performancën ---
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions)); // ✅ PËRDORIM KONFIGURIMIN E RI TË CORS

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

// Lidh rrugët e Feed-it, p.sh., /api/feed-posts
app.use('/api', feedRoutes); 

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Inicializon lidhjen e Supabase dhe Cron Jobs
initializeCache(); 

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
