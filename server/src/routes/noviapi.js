const express = require('express');
const router = express.Router();
const controller = require('../controllers/noviapi.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// NoviAPI Custom Code Blocks & Sandbox execution routes
router.get('/scripts', verifyToken, controller.getScripts);
router.post('/scripts', verifyToken, controller.createScript);
router.put('/scripts/:id', verifyToken, controller.updateScript);
router.delete('/scripts/:id', verifyToken, controller.deleteScript);
router.post('/scripts/:id/execute', verifyToken, controller.executeScript);

module.exports = router;
