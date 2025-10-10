// src/app.ts (VERSIONI TS-KOMPATIBËL PËR CORS)

import express from 'express';
import cors, { CorsOptions } from 'cors'; // Sigurohu që importon CorsOptions
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

// --- CONFIGURIMI I KORRIGJUAR I CORS ---

// 1. Lexon URL-të e lejuara nga variabla e mjedisit FRONTEND_URLS (e ndarë me presje)
const frontendUrls: string[] = process.env.FRONTEND_URLS ? 
  process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
  [];

// 2. Krijon listën e plotë të origjinave të lejuara (përfshin localhost)
const allowedOrigins: string[] = [
  ...frontendUrls,
  'http://localhost:5173', // Vite default
  'http://localhost:3000' // Ose port tjetër lokal
].filter(Boolean); // Heq çdo vlerë boshe nëse ndodhet

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Lejo kërkesat pa origjinë (p.sh., Postman ose kërkesat nga i njëjti server)
    if (!origin) return callback(null, true);

    // Kontrollon nëse origjina është në listën e lejuar
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 200
};

// --- Middleware për Sigurinë dhe Performancën ---
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions)); // ✅ PËRDORIM KORRIGJIMIN E CORS MBI

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

## 🎯 Hapat e Detyrueshëm Për Ta Bërë Funksional

1.  **Back-end (Railway):** Zëvendësoni skedarin tuaj **`src/app.ts`** me versionin e mësipërm (i cili ka sintaksë të saktë TS dhe CORS fleksibël), bëni `git commit` dhe **`git push`**.
2.  **Variablat e Mjedisit (Railway):** **Kjo është thelbësore.** Sigurohuni që në Railway e keni ndryshuar variablën e vjetër në **`FRONTEND_URLS`** (shumës) dhe e keni vendosur me origjina të ndara me presje (`,') [cite: uploaded:Screenshot_2025-10-10-01-53-35-027_com.android.chrome.jpg]:
    ```
    FRONTEND_URLS="https://planexplor-frontend.vercel.app, http://localhost:5173" 

    
