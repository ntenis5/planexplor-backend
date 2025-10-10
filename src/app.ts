// src/app.ts (VERSIONI TS-KOMPATIBËL PËR CORS)

import express from 'express';
import cors from 'cors'; // Nuk ka nevojë për CorsOptions
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

// --- KONFIGURIMI I KORRIGJUAR I CORS PËR STABILITETIN E TS ---

const FRONTEND_URL = process.env.FRONTEND_URL;

// Krijon një listë origjinash të lejuara bazuar në FRONTEND_URL
const allowedOrigins = [
  // 1. URL-ja kryesore e deploy-uar (e marrë nga variabla e mjedisit)
  FRONTEND_URL,
  // 2. URL-ja lokale e Front-end-it (përdorur nga Vite)
  'http://localhost:5173',
  // 3. Porti tjetër lokal (nëse përdoret)
  'http://localhost:3000' 
].filter(url => url); // Filtroni çdo vlerë null/undefined

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Lejo kërkesat pa origjinë (p.sh., Postman, kërkesat e serverit)
    if (!origin) return callback(null, true);

    // Lejo çdo origjinë në listën e lejuar
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
```
eof

---

## 🚀 Hapi i Fundit Për Deploy

1.  **Back-end (Railway):** Zëvendësoni skedarin tuaj **`src/app.ts`** me kodin e mësipërm.
2.  **Variablat e Mjedisit (Railway):** Kthejeni atë në **`FRONTEND_URL`** (njëjës) nëse e kishit ndryshuar në `FRONTEND_URLS`. Vendosni vlerën e deploy-imit të Vercel-it:
    ```
    FRONTEND_URL=https://planexplor-frontend.vercel.app

  
