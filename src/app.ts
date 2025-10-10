// src/app.ts (VERSIONI FINAL I KORRIGJUAR PËR CORS)

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

// --- CONFIGURIMI I KORRIGJUAR I CORS ---
// 1. Lexon URL-të e lejuara nga variabla e mjedisit FRONTEND_URLS (e ndarë me presje)
const frontendUrls = process.env.FRONTEND_URLS ? 
  process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : 
  [];

// 2. Shton localhost-in për zhvillim (5173 është porti standard i Vite)
const allowedOrigins = [
  ...frontendUrls,
  'http://localhost:5173',
  'http://localhost:3000' // Ose çfarëdo që keni përdorur më parë
];

const corsOptions = {
  origin: (origin, callback) => {
    // Lejo kërkesat pa origjinë (p.sh., Postman ose kërkesat nga i njëjti server)
    if (!origin) return callback(null, true);

    // Kjo lejon të gjitha origjinat e listuara në allowedOrigins
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

## ⚙️ Hapat e Mbetur

Tani që keni kodin e rregulluar të Back-end-it, duhet të bëni dy veprime:

1.  **Back-end (Railway):** Zëvendësoni skedarin tuaj **`src/app.ts`** me versionin e mësipërm, bëni `git commit` dhe **`git push`** në Railway.
2.  **Variablat e Mjedisit (Railway):** Sigurohuni që në konfigurimin e variablave të mjedisit të Back-end-it në Railway, keni vendosur një variabël të quajtur **`FRONTEND_URLS`** me këtë vlerë (përfshini domenin tuaj të Vercel):
    ```
    FRONTEND_URLS="https://planexplor-frontend.vercel.app, http://localhost:5173" 

    
