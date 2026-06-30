import { Request, Response, NextFunction } from 'express';

const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes window
const maxRequestsPerWindow = 150; // Max requests per window per IP
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

// Simple scheduler to clean up expired entries and prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}, 10 * 60 * 1000); // Run cleanup every 10 minutes

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Extract client IP address
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || '127.0.0.1';
  const now = Date.now();

  let record = ipRequestCounts.get(ip);

  // If no record found or current window has expired, reset
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + rateLimitWindowMs };
  }

  record.count++;
  ipRequestCounts.set(ip, record);

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequestsPerWindow - record.count));
  res.setHeader('X-RateLimit-Reset', Math.floor(record.resetTime / 1000));

  if (record.count > maxRequestsPerWindow) {
    res.status(429).json({
      status: 'fail',
      message: 'Too many requests from this IP address. Please wait 15 minutes and try again.',
    });
    return;
  }

  next();
};
