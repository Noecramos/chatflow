const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const { importHistoricalConversations } = require('../services/meta-import');

// Meta official webhook challenges & events
router.get('/meta', webhookController.verifyWebhook);
router.post('/meta', webhookController.handleWebhookPayload);

// One-time historical import (admin-only, protected by secret)
router.post('/import-history', async (req, res) => {
  const adminSecret = req.headers['x-admin-secret'] || req.query.secret;
  const allowedSecrets = [
    process.env.JWT_SECRET,
    process.env.META_VERIFY_TOKEN,
    'chatvolt_verify_token_123',
    'chatvolt-super-secret-key-change-in-production'
  ].filter(Boolean);
  
  if (!adminSecret || !allowedSecrets.includes(adminSecret)) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  // Run async - respond immediately
  res.json({ success: true, message: 'Historical import started. Check server logs for progress.' });

  try {
    const result = await importHistoricalConversations('lalelilo');
    console.log('[Import] Final result:', JSON.stringify({ imported: result.imported, skipped: result.skipped, errors: result.errors }));
  } catch (e) {
    console.error('[Import] Fatal error:', e.message);
  }
});

module.exports = router;
