// src/routes/cacheAdmin.ts
import { Router, Request, Response } from 'express';
// Using enhancedCacheService to maintain consistency with other service files
import { enhancedCacheService } from '../services/enhancedCacheService.js'; 

const cacheAdminRouter = Router();

/**
 * GET /stats - Retrieves detailed statistics about the caching system.
 */
cacheAdminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    // Assuming enhancedCacheService has a method to get system health/stats
    const stats = await enhancedCacheService.getSystemHealth(); 
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error('Cache stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /cleanup - Triggers the smart cache cleanup process.
 */
cacheAdminRouter.post('/cleanup', async (req: Request, res: Response) => {
  try {
    // We use the scalingService's maintenance function for cleanup
    const result = await enhancedCacheService.runCacheMaintenance();
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Cache cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default cacheAdminRouter;
