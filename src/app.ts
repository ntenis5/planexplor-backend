import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
// Importo funksionin direkt si 'handleSearchRequest' (ose cilido qe eshte emri qe doni)
import handleSearchRequest from './routes/search'; // Importi i ri
import authRoutes from './routes/auth';
import adsRoutes from './routes/ads';
import paymentsRoutes from './routes/payments';
import affiliateRoutes from './routes/affiliate';
import { initializeCache } from './services/cacheService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
// VETEM rruga e search ndryshon:
// Tani po e perdorni app.post sepse searchRoutes nuk eshte me nje Express Router
app.post('/api/search', handleSearchRequest); 

// Rrugët e tjera mbeten si me parë (supozojmë që ato ende eksportojnë router)
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

// Initialize cache on startup
initializeCache();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});
  
