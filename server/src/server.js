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

// Register refined Core routes prefixes (strictly keeping only 4 prefixes)
app.use('/inbox', inboxRoutes);
app.use('/channels', channelsRoutes);
app.use('/ecommerce', ecommerceRoutes);
app.use('/webhooks', webhookRoutes);
app.use('/crm', crmRoutes);

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

const JWT_SECRET = process.env.JWT_SECRET || 'chatvolt-super-secret-key-change-in-production';
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
