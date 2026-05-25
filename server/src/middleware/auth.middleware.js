const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chatflow-super-secret-key-change-in-production';

module.exports = {
  /**
   * Verify JWT and inject user credentials into request context
   */
  verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ success: false, error: "Access Denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Contains: userId, tenantId, role
      next();
    } catch (err) {
      console.warn("Invalid JWT verification token:", err.message);
      return res.status(403).json({ success: false, error: "Invalid token. Session expired." });
    }
  }
};
