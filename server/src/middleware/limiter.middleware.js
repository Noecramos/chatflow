/**
 * Rate Limiting & Usage Tracking Middleware per Organization
 * Tracks monthly message consumption limits and enforces rate-limiting thresholds.
 */
const prisma = require('../db');

// In-memory rate limiting map for standard REST APIs
// Key: organizationId, Value: { count: 0, resetTime: timestamp }
const rateLimitMap = new Map();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const DEFAULT_LIMITS = {
  FREE: { rateLimit: 60, monthlyMsg: 1000 },
  PRO: { rateLimit: 300, monthlyMsg: 10000 },
  ENTERPRISE: { rateLimit: 1000, monthlyMsg: 100000 }
};

module.exports = {
  /**
   * API rate-limiting guard based on Organization tier plans
   */
  async rateLimit(req, res, next) {
    const { organizationId } = req.user;
    if (!organizationId) return next();

    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!org) {
        return res.status(404).json({ success: false, error: "Organization profile not found." });
      }

      const plan = org.plan?.toUpperCase() || 'FREE';
      const constraints = DEFAULT_LIMITS[plan] || DEFAULT_LIMITS.FREE;

      // 1. Enforce Monthly quota limits
      if (org.apiUsageThisMonth >= org.maxMessagesPerMonth) {
        return res.status(403).json({
          success: false,
          error: "Your organization has depleted its monthly AI message quota. Please upgrade your subscription."
        });
      }

      // 2. Enforce minute-window Rate Limits
      const now = Date.now();
      let record = rateLimitMap.get(organizationId);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + RATE_LIMIT_WINDOW_MS
        };
        rateLimitMap.set(organizationId, record);
      } else {
        record.count++;
      }

      if (record.count > constraints.rateLimit) {
        return res.status(429).json({
          success: false,
          error: `Rate limit exceeded. Your current plan (${plan}) permits ${constraints.rateLimit} requests per minute. Try again in a minute.`
        });
      }

      next();
    } catch (e) {
      console.error("Usage guard error:", e.message);
      return res.status(500).json({ success: false, error: "Security validation error." });
    }
  },

  /**
   * Increment monthly API usage counter
   */
  async trackUsage(organizationId, count = 1) {
    try {
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          apiUsageThisMonth: {
            increment: count
          }
        }
      });
    } catch (err) {
      console.error("Failed to increment usage tracking counters:", err.message);
    }
  }
};
