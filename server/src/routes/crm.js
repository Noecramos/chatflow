const express = require('express');
const router = express.Router();
const crmController = require('../controllers/crm.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Pipeline view — contacts grouped by stage
router.get('/pipeline', verifyToken, crmController.getPipeline);

// Debug endpoint (no DB, no auth)
router.get('/debug', (req, res) => {
  res.json({ success: true, debug: true, time: new Date().toISOString(), msg: 'CRM routes are reachable' });
});

// CRM Metrics — aggregated KPIs
router.get('/metrics', verifyToken, crmController.getMetrics);

// Update contact CRM fields
router.put('/contacts/:id/stage', verifyToken, crmController.updateStage);
router.put('/contacts/:id', verifyToken, crmController.updateContact);

module.exports = router;
