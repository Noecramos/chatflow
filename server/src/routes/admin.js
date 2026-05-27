const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const prisma = require('../db');

// Middleware to ensure the user is an admin or system owner
const verifyAdminAccess = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Access Denied. User not found." });
    }

    const userEmail = user.email || '';
    const userRole = user.role || '';

    // STRICT ACCESS CONTROL:
    // Only permit explicit SUPERADMIN roles OR specific, dedicated master administrator emails.
    // Standard OWNER role from regular registration is STRICTLY forbidden.
    const allowedEmails = ['admin@chatflow.com', 'system@noviapp.ai'];
    
    // Add custom env admin email if defined
    if (process.env.MASTER_ADMIN_EMAIL) {
      allowedEmails.push(process.env.MASTER_ADMIN_EMAIL.toLowerCase());
    }

    const isAllowedEmail = allowedEmails.includes(userEmail.toLowerCase());
    const isSuperAdmin = userRole === 'SUPERADMIN';

    if (isSuperAdmin || isAllowedEmail) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Access Denied: Only the Master System Administrator can access the master dashboard."
    });
  } catch (error) {
    console.error("[verifyAdminAccess] Error checking admin permissions:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error during admin verification." });
  }
};

// Mount endpoints under `/inbox/admin`
router.get('/subscribers', verifyToken, verifyAdminAccess, adminController.listSubscribers);
router.put('/subscribers/:id/limits', verifyToken, verifyAdminAccess, adminController.updateSubscriberLimits);
router.delete('/subscribers/:id', verifyToken, verifyAdminAccess, adminController.deleteSubscriber);
router.post('/system-reset', verifyToken, verifyAdminAccess, adminController.systemReset);

module.exports = router;
