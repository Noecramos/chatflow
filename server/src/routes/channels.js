const express = require('express');
const router = express.Router();
const botController = require('../controllers/bot.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Chatbots Config CRUD
router.get('/bots', verifyToken, botController.listBots);
router.post('/bots', verifyToken, botController.createBot);
router.put('/bots/:id', verifyToken, botController.updateBot);
router.delete('/bots/:id', verifyToken, botController.deleteBot);

// RAG Data upload and chunking
router.post('/bots/:id/knowledge', verifyToken, botController.addKnowledge);

// Connectors & secure HTTP Actions
router.post('/bots/:id/actions', verifyToken, botController.addBotAction);

// Omnichannel credential integration sets (WhatsApp, Instagram, FB Messenger)
router.post('/bots/:id/integrations', verifyToken, botController.saveChannelIntegration);
router.get('/bots/:id/integrations', verifyToken, botController.getChannelIntegrations);

// Secure encrypted settings for LLM API keys per Organization
router.put('/settings', verifyToken, botController.updateOrganizationSettings);

module.exports = router;

