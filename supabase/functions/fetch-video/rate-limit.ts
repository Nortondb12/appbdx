// Simple in-memory rate limiter for Edge Functions
// Note: This resets on function isolate restart, which is fine for basic abuse prevention

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const limits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, config: RateLimitConfig): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const limit = limits.get(identifier);

  if (!limit || now > limit.resetTime) {
    const newLimit = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    limits.set(identifier, newLimit);
    return { success: true, remaining: config.max - 1, resetTime: newLimit.resetTime };
  }

  if (limit.count >= config.max) {
    return { success: false, remaining: 0, resetTime: limit.resetTime };
  }

  limit.count += 1;
  return { success: true, remaining: config.max - limit.count, resetTime: limit.resetTime };
}

// Cleanup expired limits periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of limits.entries()) {
    if (now > limit.resetTime) {
      limits.delete(key);
    }
  }
}, 60000); // Every minute
