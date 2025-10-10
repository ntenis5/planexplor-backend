// src/middleware/advancedAnalyticsMiddleware.ts - Korrigjo rreshtin 39
export function advancedAnalyticsMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Mbivendos res.send për të matur kohën e përgjigjes
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;

    // Përgatit të dhënat për analitikë - KORRIGJO CACHE STATUS
    const cacheHeader = res.getHeader('x-cache-status') as string;
    const cacheStatus: 'hit' | 'miss' | 'skip' = 
      cacheHeader === 'hit' ? 'hit' :
      cacheHeader === 'miss' ? 'miss' : 'skip';

    const analyticsData = {
      sessionId: req.session?.id,
      userId: req.user?.id,
      endpoint: req.path,
      method: req.method,
      status: res.statusCode,
      responseTime: responseTime,
      cacheStatus: cacheStatus, // ✅ TASHMË E TIPIZUAR SIÇ DUHET
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
