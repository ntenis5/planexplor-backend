// src/middleware/advancedAnalyticsMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService.js'; // Assuming .js extension for module loading

/**
 * Middleware to capture and process advanced request analytics.
 * This includes endpoint, latency, and user information for adaptive scaling.
 */
export const advancedAnalyticsMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const start = process.hrtime.bigint();

  // Attach an event listener to capture response completion
  res.on('finish', async () => {
    try {
      const end = process.hrtime.bigint();
      const latency_ms = Number(end - start) / 1000000; // Convert nanoseconds to milliseconds

      const analyticsData = {
        endpoint: req.originalUrl,
        method: req.method,
        status_code: res.statusCode,
        latency_ms: latency_ms,
        // Assuming user data is attached by a previous middleware (e.g., Auth Middleware)
        user_id: (req as any).user?.id || null, 
        user_region: req.headers['x-user-region'] || 'unknown',
      };

      // Call the service asynchronously without blocking the response
     analyticsService.logDetailedRequest(analyticsData).catch(console.error);
      
    } catch (error) {
      console.error('Error during advanced analytics capture:', error);
      // Do not re-throw the error, as it would interfere with the response flow
    }
  });

  // Continue to the next middleware or route handler
  next();
};
