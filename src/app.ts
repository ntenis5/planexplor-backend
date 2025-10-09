// src/app.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importet e rrugëve (routers)
import geolocationRoutes from './routes/geolocation'; 
import authRoutes from './routes/auth';
import adsRoutes from './routes/ads';
import paymentsRoutes from './routes/payments';
import affiliateRoutes from './routes/affiliate';

import { initializeCache } from './services/cacheService'; // Inicializon Supabase dhe Cron Jobs

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware për Sigurinë dhe Performancën ---
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL-ja e Vercel-it
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (Kufizimi i Kërkesave)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuta
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Routes ---

// ✅ Rruga e Geolocation (Harta) - E aksesueshme në /api/geolocation/
app.use('/api/geolocation', geolocationRoutes); 

// Rrugët e tjera 
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/affiliate', affiliateRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Initialize cache on startup (Lidh Supabase, pastron cache-in e skaduar dhe vendos Cron Jobs)
initializeCache(); 

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
