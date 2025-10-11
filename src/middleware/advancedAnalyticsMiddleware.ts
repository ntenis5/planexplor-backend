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

  // Mbivendos res.json për të kapur response time
  const originalJson = res.json;
  
  (res as any).json = function(body: any) {
    // ✅ TË GJITHA VARIABLAT:
    const responseTime = Date.now() - startTime;
    const cacheHeader = (res as any).getHeader ? (res as any).getHeader('x-cache-status') as string : undefined;
    const cacheStatus: 'hit' | 'miss' | 'skip' = 
      cacheHeader === 'hit' ? 'hit' :
      cacheHeader === 'miss' ? 'miss' : 'skip';
    const cacheStrategy = (res as any).getHeader ? (res as any).getHeader('x-cache-strategy') as string : 'default';
    const userAgent = req.get('user-agent');
    const userIp = req.ip;
    const countryCode = req.get('cf-ipcountry') || req.get('x-country-code') || 'eu';
    const userId = req.user?.id;
    const sessionId = req.session?.id;
    const endpoint = req.path;
    const method = req.method;
    const statusCode = (res as any).statusCode || 200;

    // ✅ TANI MUND TË PËRDORËSH captureRequest OSE logDetailedRequest:
    
    // Opsioni A: Përdor captureRequest (më i thjeshtë)
    analyticsService.captureRequest({
      endpoint: endpoint,
      method: method,
      status_code: statusCode,
      latency_ms: responseTime,
      user_id: userId,
      user_region: countryCode
    }).catch(console.error);

    // Opsioni B: Përdor logDetailedRequest (më i plotë)
    /*
    analyticsService.logDetailedRequest({
      sessionId: sessionId,
      userId: userId,
      endpoint: endpoint,
      method: method,
      status: statusCode,
      responseTime: responseTime,
      cacheStatus: cacheStatus,
      cacheStrategy: cacheStrategy,
      userAgent: userAgent,
      userIp: userIp
    }).catch(console.error);
    */

    return originalJson.call(this, body);
  };

  next();
}
