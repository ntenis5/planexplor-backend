import { Request, Response, NextFunction } from 'express';

export default function analyticsMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.path} - IP: ${req.ip}`);
  next();
}
