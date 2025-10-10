// src/middleware/advancedAnalyticsMiddleware.ts
import { analyticsService } from '../services/analyticsService.js';
import { Request, Response, NextFunction } from 'express';

// Extended Request interface për session dhe user
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
  const originalSend = res.send;

  // Mbivendos res.send për të matur kohën e përgjigjes
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;

    // Përgatit të dhënat për analitikë
    const analyticsData = {
      sessionId: req.session?.id,
      userId: req.user?.id,
      endpoint: req.path,
      method: req.method,
      status: res.statusCode,
      responseTime: responseTime,
      cacheStatus: res.getHeader('x-cache-status') as string || 'skip',
      cacheStrategy: res.getHeader('x-cache-strategy') as string,
      userAgent: req.get('user-agent'),
      userIp: req.ip,
      countryCode: req.get('cf-ipcountry') || req.get('x-country-code')
    };

    // Logjo në background (mos e blloko përgjigjen)
    analyticsService.logDetailedRequest(analyticsData).catch(console.error);

    return originalSend.call(this, body);
  };

  next();
      }
