const express = require('express');
const router = express.Router();
const inboxController = require('../controllers/inbox.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const authRoutes = require('./auth');

// Mount Auth routes under the unified /inbox prefix
router.use('/auth', authRoutes);


router.get('/conversations', verifyToken, inboxController.getConversations);
router.get('/conversations/:id/messages', verifyToken, inboxController.getConversationMessages);
router.post('/conversations/:id/assign', verifyToken, inboxController.assignConversation);
router.post('/conversations/:id/handover', verifyToken, inboxController.toggleHandover);
router.put('/conversations/:id/properties', verifyToken, inboxController.updateProperties);
router.post('/conversations/:id/reply', verifyToken, inboxController.sendManualReply);

// Copilot AI suggestions for support agent co-replies
router.get('/conversations/:id/suggestions', verifyToken, inboxController.getAiSuggestions);

// Agent and Seat Management
router.get('/agents', verifyToken, inboxController.listAgents);
router.post('/agents', verifyToken, inboxController.createAgent);

// Mass Broadcast Campaign Management
router.post('/broadcast', verifyToken, inboxController.executeMassBroadcast);

// Public Widget Integration API (no token required)
router.post('/widget/message', inboxController.handleWidgetMessage);

module.exports = router;

