import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; 
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pino from 'pino-http';
import dotenv from 'dotenv';
import 'express-async-errors'; // Për të kapur automatikisht gabimet në rrugët async

// 🚀 CRITICAL: Ngarko variablat e ambientit (env vars) të PARËT
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();
// 🚀 CRITICAL: Railway përdor PORT 8080 - përdor variablën e tyre të ambientit
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

// ----------------------------------------------------
// 🎯 FAZA 1: Inizializimi i Shpejtë & Kontrolli i Shëndetit
// ----------------------------------------------------

// 1. Siguria bazë
app.use(helmet());
app.use(cors());

// 2. Logging-u (përdoret që në fillim)
const logger = pino({ 
  level: 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});
app.use(logger);

// 3. Parsing i trupit të kërkesës
app.use(express.json());

// 🚀 CRITICAL: Rrugët e Kontrollit të Shëndetit (Health Check) - ABSOLUTISHT të PARËT
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: '🚀 Planexplor Backend API is running!',
    version: '1.0.0',
    status: 'healthy',
    timestamp: Date.now()
  });
});

app.get('/health', (req, res) => {
  // Përdor 'req.log' nga pino për loggim të mirëfilltë
  (req as any).log.info('Health check called'); 
  res.status(200).json({ 
    status: 'OK',
    service: 'planexplor-backend',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// ----------------------------------------------------
// 🎯 FAZA 2: Nisja Imediatisht e Serverit
// ----------------------------------------------------

console.log(`🚀 Starting server on port ${PORT}...`);
// Lidhja me '0.0.0.0' siguron që serveri të dëgjojë në të gjitha interfejsat
const server = app.listen(PORT, '0.0.0.0', () => { 
  console.log(`🎯 SERVER RUNNING on port ${PORT}`);
  console.log(`🌐 Health: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Railway PORT: ${process.env.PORT}`);
});

// ----------------------------------------------------
// 🎯 FAZA 3: Ngarkimi i Funksionaliteteve Shtesë (Sfond)
// ----------------------------------------------------

// 🚀 Sfond: Ngarko funksionalitetet shtesë PAS nisjes së serverit
setImmediate(async () => {
  try {
    console.log('🚀 Loading additional features...');
    
    // 4. Kompresimi
    app.use(compression());
    
    // 5. Limiti i kërkesave (Rate limiting)
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Too many requests'
    });
    app.use(apiLimiter);
    
    // 6. Parsing i trupit me kufizime
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 🚀 LAZY LOAD Rrugët - Përdor 'require' për të shmangur problemet me 'import' në disa mjedise
    const routes = [
      { path: './routes/geolocation.js', mount: '/api/v1/geolocation' },
      { path: './routes/auth.js', mount: '/api/v1/auth' },
      { path: './routes/ads.js', mount: '/api/v1/ads' },
      { path: './routes/payments.js', mount: '/api/v1/payments' },
      { path: './routes/affiliate.js', mount: '/api/v1/affiliate' },
      { path: './routes/feed.js', mount: '/api/v1/feed' },
      { path: './routes/flights.js', mount: '/api/v1/flights' },
      { path: './routes/systemAdmin.js', mount: '/api/v1/admin/system' },
      { path: './routes/cacheAdmin.js', mount: '/api/v1/admin/cache' },
      { path: './routes/analyticsDashboard.js', mount: '/api/v1/analytics' }
    ];
    
    let loadedRoutes = 0;
    
    for (const route of routes) {
      try {
        // Përdorim 'require' dinamik, i cili shpesh punon më mirë në mjediset e serverit
        const module = await import(route.path);
        app.use(route.mount, module.default || module); // Merret 'default' ose vetë moduli
        console.log(`✅ Mounted: ${route.mount}`);
        loadedRoutes++;
      } catch (err: any) { // Specifikojmë 'any' për të shmangur gabimin e TS, ose përdorim kontrollin poshtë
        // Këtu ndodh gabimi TS18046 nëse nuk e specifikon llojin
        console.log(`⚠️  Skipped: ${route.mount} - ${err.message}`);
      }
    }
    
    console.log(`🎯 Loaded ${loadedRoutes}/${routes.length} routes successfully!`);
    
    // 🚀 Ngarko Shërbimet
    try {
      const { cacheMaintenance } = await import('./services/cacheMaintenance.js');
      const { default: analyticsMiddleware } = await import('./middleware/analyticsMiddleware.js');
      
      if (cacheMaintenance?.startScheduledCleanup) {
        cacheMaintenance.startScheduledCleanup();
        console.log('✅ Cache service initialized');
      }
      
      if (analyticsMiddleware) {
        app.use(analyticsMiddleware);
        console.log('✅ Analytics middleware initialized');
      }
    } catch (error: any) {
      // Specifikojmë 'any' edhe këtu
      console.warn(`⚠️ Some services not available: ${error.message}`);
    }
    
    console.log('🚀 Planexplor Backend fully operational!');
    
  } catch (error: any) {
    console.error('❌ Feature loading error:', error.message);
  }
});

// ----------------------------------------------------
// 🎯 FAZA 4: Trajtuesit e Gabimeve dhe Rrugët Fundore
// ----------------------------------------------------

// 🚀 Trajtuesi i Gabimeve - Këtu ishte gabimi TS18046
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  // Rregullimi: Kontrollojmë llojin e gabimit (Best Practice)
  let errorMessage = 'Internal Server Error';
  if (error instanceof Error) {
    errorMessage = error.message;
    // Përdorim loggim të rregullt nga pino
    (req as any).log.error(error, 'Gabim i kapur në nivel global'); 
  } else {
    // Nëse është i panjohur, e loggojmë si të tillë.
    (req as any).log.error(error, 'Gabim i panjohur i kapur në nivel global');
  }

  // Mos ekspozoni gabimet e brendshme në Production
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : errorMessage,
    timestamp: Date.now()
  });
});

// 🚀 Rruga 404
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.originalUrl,
    timestamp: Date.now()
  });
});

// 🚀 Fikja elegante (Graceful shutdown) për Railway
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
