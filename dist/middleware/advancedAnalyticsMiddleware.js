import { analyticsService } from '../services/analyticsService.js';
export function advancedAnalyticsMiddleware(req, res, next) {
    const startTime = Date.now();
    const originalJson = res.json;
    res.json = function (body) {
        const responseTime = Date.now() - startTime;
        const cacheHeader = res.getHeader ? res.getHeader('x-cache-status') : undefined;
        const cacheStatus = cacheHeader === 'hit' ? 'hit' :
            cacheHeader === 'miss' ? 'miss' : 'skip';
        const cacheStrategy = res.getHeader ? res.getHeader('x-cache-strategy') : 'default';
        const userAgent = req.get('user-agent');
        const userIp = req.ip;
        const countryCode = req.get('cf-ipcountry') || req.get('x-country-code') || 'eu';
        const userId = req.user?.id;
        const sessionId = req.session?.id;
        const endpoint = req.path;
        const method = req.method;
        const statusCode = res.statusCode || 200;
        analyticsService.captureRequest({
            endpoint: endpoint,
            method: method,
            status_code: statusCode,
            latency_ms: responseTime,
            user_id: userId,
            user_region: countryCode
        }).catch(console.error);
        return originalJson.call(this, body);
    };
    next();
}
