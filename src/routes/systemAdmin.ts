// src/routes/systemAdmin.ts
import { Router, Request, Response } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';
import { scalingService } from '../services/scalingService.js'; // NDRYSHUAR: path i saktë
import { supabase } from '../services/supabaseClient.js'; // SHTUAR: importi i supabase

const systemAdminRouter = Router();

// 🏥 SYSTEM HEALTH
systemAdminRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    res.json({ success: true, health });
  } catch (error: any) { // NDRYSHUAR: shtova type any për error
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

// ⚡ SCALING STATUS
systemAdminRouter.get('/scaling-status', async (req: Request, res: Response) => {
  try {
    const status = await scalingService.checkScalingNeeds();
    res.json({ success: true, status });
  } catch (error: any) { // NDRYSHUAR: shtova type any për error
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
  } catch (error: any) { // NDRYSHUAR: shtova type any për error
    res.status(500).json({ success: false, error: 'Maintenance failed' });
  }
});

// 🚨 EMERGENCY RECOVERY
systemAdminRouter.post('/emergency-recovery', async (req: Request, res: Response) => {
  try {
    // NDRYSHUAR: Shtova metodën emergencyRecovery në scalingService ose përdor ekzistuese
    const result = await scalingService.runCacheMaintenance(); // Përdor metodën ekzistuese
    res.json({ success: true, result });
  } catch (error: any) { // NDRYSHUAR: shtova type any për error
    res.status(500).json({ success: false, error: 'Recovery failed' });
  }
});

export default systemAdminRouter;
