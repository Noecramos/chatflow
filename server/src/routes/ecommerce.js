const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerce.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/orders', verifyToken, ecommerceController.getOrders);
router.get('/metrics', verifyToken, ecommerceController.getSalesMetrics);
router.put('/orders/:orderId/status', verifyToken, ecommerceController.updateOrderStatus);

// Built-in HTTP ERP mock inventory system for AI tool testing
router.post('/connector/inventory', ecommerceController.mockInventoryConnector);

module.exports = router;
