// src/routes/cacheAdmin.ts
import { Router, Request, Response } from 'express';
// Using enhancedCacheService to maintain consistency with other service files
import { enhancedCacheService } from '../services/enhancedCacheService.js'; 

const cacheAdminRouter = Router();

/**
 * GET /stats - Retrieves detailed statistics and health check of the caching system.
 */
cacheAdminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    // enhancedCacheService.getSystemHealth() returns scaling and performance stats
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
    // FIX: Import the required service for cleanup. Since the cleanup logic is usually
    // handled by cacheMaintenance or cacheService, and the original code referenced 
    // scalingService.runCacheMaintenance, we will import and use cacheService's cleanup method 
    // which is the common underlying function.
    const { cacheService } = await import('../services/cacheService.js');
    const result = await cacheService.cleanupCache();
    
    res.json({ success: true, result });
  } catch (error: any) {
    console.error('Cache cleanup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default cacheAdminRouter;
