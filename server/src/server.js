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
app.get('*', (req, res, next) => {
  // Don't catch API routes or socket.io
  if (req.path.startsWith('/inbox') || req.path.startsWith('/channels') || 
      req.path.startsWith('/ecommerce') || req.path.startsWith('/webhooks') || 
      req.path.startsWith('/crm') || req.path.startsWith('/health') ||
      req.path.startsWith('/socket.io') || req.path.startsWith('/widget') ||
      req.path.startsWith('/master-admin')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
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

// Setup socket connection
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

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
  
  // Join Organization Room by default
  socket.join(organizationId);

  // Focus real-time updates inside a single active conversation
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`[Socket] User ${userId} joined conversation room: ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
    console.log(`[Socket] User ${userId} left conversation room: ${conversationId}`);
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

    // Ensure Master Admin System Account exists on startup
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@chatflow.com';
    const adminPassword = process.env.MASTER_ADMIN_PASSWORD || 'admin123456';

    let adminOrg = await db.organization.findUnique({
      where: { slug: 'system-admin' }
    });

    if (!adminOrg) {
      adminOrg = await db.organization.create({
        data: {
          name: "System Administration",
          slug: "system-admin",
          plan: "ENTERPRISE",
          maxBots: 999,
          maxMessagesPerMonth: 999999
        }
      });
      console.log('[Seed] Default admin organization created.');
    }

    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await db.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: "System",
          lastName: "Admin",
          role: "SUPERADMIN",
          organizationId: adminOrg.id
        }
      });
      console.log(`[Seed] Default Master Admin seeded successfully: ${adminEmail}`);
    }

    // Automatically migrate any legacy "Volt Assistant" or "Volt AI Bot" in the database to "Agente IA"
    try {
      const migrated = await db.bot.updateMany({
        where: {
          name: {
            in: ["Volt Assistant", "Volt AI Bot"]
          }
        },
        data: {
          name: "Agente IA",
          systemPrompt: "Você é o Agente IA, um assistente virtual inteligente. Você ajuda os clientes tirando dúvidas, dando suporte e fornecendo informações sobre a empresa de forma prestativa e profissional.",
          greetingMessage: "Olá! Seja bem-vindo. Como posso te ajudar hoje?"
        }
      });
      if (migrated.count > 0) {
        console.log(`[Seed] Automatically migrated ${migrated.count} existing legacy Volt bots to Agente IA.`);
      }
    } catch (migError) {
      console.warn('[Seed] Warning: Failed to migrate legacy bots:', migError.message);
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
