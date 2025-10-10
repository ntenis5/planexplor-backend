// src/routes/systemAdmin.ts
import { Router, Request, Response } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';
import { scalingService } from './scalingService.js';

const systemAdminRouter = Router();

// 🏥 SYSTEM HEALTH
systemAdminRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

// ⚡ SCALING STATUS
systemAdminRouter.get('/scaling-status', async (req: Request, res: Response) => {
  try {
    const status = await scalingService.checkScalingNeeds();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Scaling status failed' });
  }
});

// 🔧 MAINTENANCE ACTIONS
systemAdminRouter.post('/maintain-indexes', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .rpc('maintain_performance_indexes');
    
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Maintenance failed' });
  }
});

// 🚨 EMERGENCY RECOVERY
systemAdminRouter.post('/emergency-recovery', async (req: Request, res: Response) => {
  try {
    const result = await scalingService.emergencyRecovery();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Recovery failed' });
  }
});

export default systemAdminRouter;
