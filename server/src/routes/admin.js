const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Middleware to ensure the user is an admin or system owner
const verifyAdminAccess = (req, res, next) => {
  const userRole = req.user.role;
  const userEmail = req.user.email || '';

  // We permit OWNER (organization creators), SUPERADMIN, or any system administrator (e.g. admin@chatflow.com)
  if (userRole === 'SUPERADMIN' || userRole === 'OWNER' || userEmail.startsWith('admin@') || userEmail === 'system@noviapp.ai') {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: "Access Denied: Only System Administrators can access the master dashboard."
  });
};

// Mount endpoints under `/inbox/admin`
router.get('/subscribers', verifyToken, verifyAdminAccess, adminController.listSubscribers);
router.put('/subscribers/:id/limits', verifyToken, verifyAdminAccess, adminController.updateSubscriberLimits);
router.delete('/subscribers/:id', verifyToken, verifyAdminAccess, adminController.deleteSubscriber);
router.post('/system-reset', verifyToken, verifyAdminAccess, adminController.systemReset);

module.exports = router;
