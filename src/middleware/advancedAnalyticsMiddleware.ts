// src/middleware/advancedAnalyticsMiddleware.ts
import { analyticsService } from '../services/analyticsService.js';
import { Request, Response, NextFunction } from 'express';

export function advancedAnalyticsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    const analyticsData = {
      endpoint: req.path,
      method: req.method,
      status: res.statusCode,
      responseTime: responseTime,
      cacheStatus: 'skip' as 'hit' | 'miss' | 'skip', // ✅ TIPIZUAR SIÇ DUHET
      cacheStrategy: 'default',
      userAgent: req.get('user-agent'),
      userIp: req.ip
    };

    analyticsService.logDetailedRequest(analyticsData).catch(console.error);
  });

  next();
}
