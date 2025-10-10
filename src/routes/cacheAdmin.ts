// src/routes/cacheAdmin.ts
import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cacheService.js';

const cacheAdminRouter = Router();

cacheAdminRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cacheService.getCacheStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

cacheAdminRouter.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const result = await cacheService.cleanupCache();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default cacheAdminRouter;
