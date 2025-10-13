import { Router, Request, Response } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';
import { scalingService } from '../services/scalingService.js'; 
import { supabase } from '../services/supabaseClient.js'; 

const systemAdminRouter = Router();

systemAdminRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await enhancedCacheService.getSystemHealth();
    res.json({ success: true, health });
  } catch (error: any) {
    console.error('System health check error:', error);
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

systemAdminRouter.get('/scaling-status', async (req: Request, res: Response) => {
  try {
    const status = await scalingService.checkScalingNeeds();
    res.json({ success: true, status });
  } catch (error: any) {
    console.error('Scaling status check error:', error);
    res.status(500).json({ success: false, error: 'Scaling status failed' });
  }
});

systemAdminRouter.post('/maintain-indexes', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .rpc('maintain_performance_indexes');
    
    if (error) throw error;
    
    res.json({ success: true, data: data }); 
  } catch (error: any) {
    console.error('Index maintenance error:', error);
    res.status(500).json({ success: false, error: error.message || 'Maintenance failed' });
  }
});

systemAdminRouter.post('/emergency-recovery', async (req: Request, res: Response) => {
  try {
    const result = await scalingService.runCacheMaintenance();
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Emergency recovery error:', error);
    res.status(500).json({ success: false, error: 'Recovery failed' });
  }
});

export default systemAdminRouter;
