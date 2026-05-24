const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// Meta official webhook challenges & events
router.get('/meta', webhookController.verifyWebhook);
router.post('/meta', webhookController.handleWebhookPayload);

module.exports = router;
