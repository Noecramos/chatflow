const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.requestForgotPassword);
router.get('/profile', verifyToken, authController.getProfile);
router.get('/clear-db', authController.clearDb);
router.get('/organizations', verifyToken, authController.listOrganizations);
router.put('/organizations/:id', verifyToken, authController.updateOrganization);
router.post('/switch-tenant', verifyToken, authController.switchTenant);

module.exports = router;
