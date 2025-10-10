// src/middleware/advancedAnalyticsMiddleware.ts (VERSION I THJESHTË)
import { analyticsService } from '../services/analyticsService.js';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  session?: {
    id?: string;
  };
  user?: {
    id?: string;
  };
}

export function advancedAnalyticsMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Mbivendos res.json për të kapur response time
  const originalJson = res.json;
  
  (res as any).json = function(body: any) {
    const responseTime = Date.now() - startTime;

    const analyticsData = {
      sessionId: req.session?.id,
      userId: req.user?.id,
      endpoint: req.path,
      method: req.method,
      status: (res as any).statusCode,
      responseTime: responseTime,
      cacheStatus: 'skip', // Default value
      cacheStrategy: 'default',
      userAgent: req.get('user-agent'),
      userIp: req.ip,
      countryCode: req.get('cf-ipcountry') || req.get('x-country-code')
    };

    // Logjo në background
    analyticsService.logDetailedRequest(analyticsData).catch(console.error);

    return originalJson.call(this, body);
  };

  next();
}
