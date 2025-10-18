import { Router } from 'express';
import { enhancedCacheService } from '../services/enhancedCacheService.js';
const cacheAdminRouter = Router();
cacheAdminRouter.get('/stats', async (req, res) => {
    try {
        const stats = await enhancedCacheService.getSystemHealth();
        res.json({ success: true, stats });
    }
    catch (error) {
        console.error('Cache stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
cacheAdminRouter.post('/cleanup', async (req, res) => {
    try {
        const { cacheService } = await import('../services/cacheService.js');
        const result = await cacheService.cleanupCache();
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Cache cleanup error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
export default cacheAdminRouter;
