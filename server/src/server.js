const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('./db');
const inboxRoutes = require('./routes/inbox');

const channelsRoutes = require('./routes/channels');
const ecommerceRoutes = require('./routes/ecommerce');
const webhookRoutes = require('./routes/webhook');
const crmRoutes = require('./routes/crm');
const noviapiRoutes = require('./routes/noviapi');

const webhookController = require('./controllers/webhook.controller');
const inboxController = require('./controllers/inbox.controller');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve widget files
const path = require('path');
app.use('/widget', express.static(path.join(__dirname, '../../widget')));

// Standalone Master Admin System Console
app.get('/master-admin', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.sendFile(path.join(__dirname, 'views/admin.html'));
});

// Register refined Core routes prefixes
app.use('/inbox', inboxRoutes);
app.use('/channels', channelsRoutes);
app.use('/ecommerce', ecommerceRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/inbox/crm', crmRoutes);  // Under /inbox so Railway proxy forwards it
app.use('/channels', noviapiRoutes);

// Serve client static build (production SPA)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// SPA catch-all: any GET that doesn't match an API route serves index.html
const fs = require('fs');
app.get('*', (req, res, next) => {
  // Don't catch API routes or socket.io
  if (req.path.startsWith('/inbox') || req.path.startsWith('/channels') || 
      req.path.startsWith('/ecommerce') || req.path.startsWith('/webhooks') || 
      req.path.startsWith('/crm') || req.path.startsWith('/health') ||
      req.path.startsWith('/socket.io') || req.path.startsWith('/widget') ||
      req.path.startsWith('/master-admin')) {
    return next();
  }
  
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Return a beautiful informational page if the frontend dist folder is empty
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ChatFlow — API Server Active</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@800;900&display=swap" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Inter', sans-serif;
            background: radial-gradient(circle at center, #14141d 0%, #08080c 100%);
            color: #f3f4f6;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          }
          h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 36px;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #8a2be2, #00e5ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: #9ca3af;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 25px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #8a2be2 0%, #00e5ff 100%);
            color: #000;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0, 229, 255, 0.3);
            transition: all 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 229, 255, 0.5);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>ChatFlow Active</h1>
          <p>O servidor de API e Webhooks do ChatFlow está online e operando com sucesso. Para acessar a interface administrativa e gerenciar seus agentes inteligentes, acesse o endereço oficial do seu aplicativo no Vercel.</p>
          <a href="/master-admin" class="btn">Retornar ao Painel Master</a>
        </div>
      </body>
      </html>
    `);
  }
});

// Global Error Boundary & Logging Middleware
app.use((err, req, res, next) => {
  console.error(`[Global Error Handler] [${req.method} ${req.url}] Error: ${err.message}`, err);
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || "An internal server error occurred.",
    timestamp: new Date()
  });
});

app.get('/health', (req, res) => {

  return res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Diagnostic endpoint — shows channel config and recent webhook activity
app.get('/health/diagnostic', async (req, res) => {
  // Simple security: require a secret query param
  if (req.query.key !== (process.env.META_VERIFY_TOKEN || 'chatflow_verify_token_123')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const channels = await db.channel.findMany({
      select: {
        id: true,
        type: true,
        isActive: true,
        organizationId: true,
        credentials: true,
        createdAt: true
      }
    });

    // Mask sensitive data but show structure
    const channelSummary = channels.map(c => {
      let credsParsed = null;
      try {
        credsParsed = JSON.parse(c.credentials);
      } catch (e) {
        credsParsed = { encrypted: true, length: c.credentials?.length || 0 };
      }

      // Mask tokens but show keys present
      if (credsParsed && typeof credsParsed === 'object') {
        const masked = {};
        for (const [key, val] of Object.entries(credsParsed)) {
          if (typeof val === 'string' && val.length > 20) {
            masked[key] = val.slice(0, 8) + '...' + val.slice(-4) + ` (${val.length} chars)`;
          } else {
            masked[key] = val;
          }
        }
        credsParsed = masked;
      }

      return {
        id: c.id,
        type: c.type,
        isActive: c.isActive,
        organizationId: c.organizationId,
        credentials: credsParsed,
        createdAt: c.createdAt
      };
    });

    // Recent conversations (last 5)
    const recentConvos = await db.inboxConversation.findMany({
      take: 5,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        contact: { select: { name: true, platformType: true, platformId: true } },
        channel: { select: { type: true } },
        _count: { select: { messages: true } }
      }
    });

    // Recent messages (last 10)
    const recentMessages = await db.message.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        senderType: true,
        content: true,
        createdAt: true,
        conversation: {
          select: {
            contact: { select: { name: true, platformType: true } },
            channel: { select: { type: true } }
          }
        }
      }
    });

    return res.json({
      status: 'diagnostic',
      timestamp: new Date(),
      codeVersion: 'batch-processing-v3-with-logging',
      channels: channelSummary,
      recentConversations: recentConvos.map(c => ({
        id: c.id,
        status: c.status,
        channelType: c.channel?.type,
        contactName: c.contact?.name,
        platformType: c.contact?.platformType,
        messageCount: c._count?.messages,
        lastMessageAt: c.lastMessageAt,
        isHumanHandover: c.isHumanHandoverActive
      })),
      recentMessages: recentMessages.map(m => ({
        id: m.id,
        senderType: m.senderType,
        content: m.content?.substring(0, 100),
        channelType: m.conversation?.channel?.type,
        contactName: m.conversation?.contact?.name,
        createdAt: m.createdAt
      })),
      webhookLog: webhookController.getWebhookLog()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Setup socket connection
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const inboxService = require('./services/inbox.service');
inboxService.setSocketIO(io);
webhookController.setSocketIO(io);
inboxController.setSocketIO(io);

const broadcastWorker = require('./services/broadcast-worker');
broadcastWorker.setSocketIO(io);
broadcastWorker.start();

const JWT_SECRET = require('./utils/jwt-secret');
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Token required."));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // inject organizationId & userId
    next();
  } catch (err) {
    return next(new Error("Session expired."));
  }
});

io.on('connection', (socket) => {
  const { organizationId, userId } = socket.user;
  console.log(`[Socket Connected] User ${userId} joined organization channel ${organizationId}`);
  
  // Join Organization Room by default (both raw ID and standardized org:ID)
  socket.join(organizationId);
  socket.join(`org:${organizationId}`);

  // Focus real-time updates inside a single active conversation
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    socket.join(`conversation:${conversationId}`);
    console.log(`[Socket] User ${userId} joined conversation room: conversation:${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    socket.leave(`conversation:${conversationId}`);
    console.log(`[Socket] User ${userId} left conversation room: conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] User ${userId} left organization channel ${organizationId}`);
  });
});


const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await db.$connect();
    console.log('[Prisma Client] DB Connection Verified.');

    // Execute isolated seed script on boot
    try {
      const seedScript = require('../prisma/seed');
    } catch (seedErr) {
      console.warn('[Seed] Seed script loaded:', seedErr.message);
    }

    server.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(` CHATFLOW ENTERPRISE SAAS BOOTED SUCCESSFULLY`);
      console.log(` Port URL: http://localhost:${PORT}`);
      console.log(` Webhook URL: http://localhost:${PORT}/webhooks/meta`);
      console.log(`================================================================`);
    });
  } catch (err) {
    console.error('Bootstrapping error:', err.message);
    process.exit(1);
  }
}

bootstrap();

