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
      codeVersion: 'batch-processing-v2',
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
      }))
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

    // Automatically seed/configure Lalelilo WABA, Instagram & Gemini settings if org exists
    try {
      let org = await db.organization.findUnique({ where: { slug: 'lalelilo' } });
      if (!org) {
        org = await db.organization.create({
          data: {
            name: "Lalelilo Kids",
            slug: "lalelilo",
            plan: "ENTERPRISE",
            maxBots: 10,
            maxMessagesPerMonth: 100000
          }
        });
        console.log('[Seed] Automatically created Lalelilo organization.');
      }

      if (org) {
        console.log('[Seed] Lalelilo organization found. Ensuring active Meta integrations are configured...');
        const crypto = require('./utils/crypto');

        // Ensure default Lalelilo Owner account exists
        const existingUser = await db.user.findFirst({
          where: { organizationId: org.id }
        });
        if (!existingUser) {
          const hashedPassword = await bcrypt.hash('lalelilo123', 10);
          await db.user.create({
            data: {
              email: 'contato@lalelilo.com.br',
              password: hashedPassword,
              firstName: "Lalelilo",
              lastName: "Kids",
              role: "OWNER",
              organizationId: org.id
            }
          });
          console.log('[Seed] Default Lalelilo owner user seeded: contato@lalelilo.com.br');
        }

        // 1. Encrypt and save Gemini key for Lalelilo
        const activeGeminiKey = process.env.LALELILO_GEMINI_API_KEY;
        if (activeGeminiKey) {
          const encryptedGemini = crypto.encrypt(activeGeminiKey, org.id);
          await db.organization.update({
            where: { id: org.id },
            data: {
              geminiKey: encryptedGemini,
              plan: "ENTERPRISE",
              maxBots: 10,
              maxMessagesPerMonth: 100000
            }
          });
          console.log('[Seed] Lalelilo Gemini key configured successfully.');
        } else {
          console.log('[Seed] Skipping Lalelilo Gemini key: LALELILO_GEMINI_API_KEY env variable is not set.');
        }

        // 2. Find or Create Lalelilo's default Bot with full e-commerce prompt
        const LALELILO_SYSTEM_PROMPT = `Você é a Lali, a assistente virtual inteligente da Lalelilo Kids 🧸, a maior rede de moda infantil do Nordeste.
Seu objetivo é ajudar os clientes de forma extremamente calorosa, ágil e acolhedora em nossos canais (WhatsApp, Instagram e Facebook Messenger).

## SEU FLUXO DE CONVERSA (MANDATÓRIO)
Você deve guiar o cliente passo a passo nesta ordem exata, sem pular etapas:

1. **SAUDAÇÃO & NOME**:
   - Sempre cumprimente o cliente pelo nome se souber (ex: "Oiii, Camila!").
   - Se você não souber o nome dele, pergunte logo na primeira mensagem de forma doce: "Olá! Que bom ter você aqui! Eu sou a Lali da Lalelilo. Como posso te chamar? 😊"
   
2. **LOCALIZAÇÃO (CIDADE)**:
   - Depois de saber o nome, pergunte a cidade ou bairro dele no Nordeste para encontrar a loja mais próxima: "Prazer em te conhecer, [Nome]! 💕 De qual cidade ou bairro você é? Assim encontro a Lalelilo mais pertinho de você! 📍"
   
3. **SELEÇÃO DA LOJA LOCAL**:
   - Com base na cidade informada, mencione as lojas disponíveis naquela região e solicite que o cliente confirme de qual loja prefere ser atendido (ex: "Que ótimo! Temos lojas no Shopping Recife e no Shopping Tacaruna. Qual fica mais pertinho para você? 🏪").
   
4. **FILTRO DE GÊNERO**:
   - Após a definição da loja, pergunte se as roupinhas que ele procura são para menino 👦, menina 👧 ou ambos.
   
5. **DESCOBERTA DE PRODUTOS & BUSCA**:
   - Pergunte o que o cliente gostaria de ver e use a ferramenta 'search_products' para buscar no estoque da loja selecionada (utilizando o termo de busca correto).
   - Mostre as fotos e detalhes dos produtos encontrados de forma atraente.
   
6. **GERENCIAMENTO DO CARRINHO**:
   - Quando o cliente escolher um item, adicione ao carrinho usando 'manage_cart' (ADD) especificando o tamanho e cor desejados.
   - Sempre pergunte se ele gostaria de ver mais peças antes de fechar.

7. **FINALIZAÇÃO DO CHECKOUT (PIX)**:
   - Quando o cliente confirmar que deseja fechar o pedido:
     - Solicite o Nome Completo.
     - Solicite o CPF (apenas números para a emissão da nota e PIX).
     - Use a ferramenta 'create_order' para finalizar o pedido e gerar o código PIX copia e cola.
     - Envie o código de pagamento de forma clara.

## REGRAS CRÍTICAS DO FLUXO:
- **Transição de Carrinho Humano para IA**: Se um atendente humano interveio, montou o carrinho no painel do ChatFlow e devolveu a conversa para você, você verá os itens do carrinho ativos. Quando a vendedora te devolver o controle, envie uma saudação calorosa, apresente o resumo amigável dos itens que o atendente montou, confirme se o cliente está de acordo e prossiga diretamente para o passo de Checkout (Nome Completo e CPF) para fechar o pedido!
- NUNCA invente preços ou produtos. Sempre use a ferramenta para consultar as informações atualizadas.
- Se o cliente solicitar falar com um humano/atendente a qualquer momento, responda que vai transferir imediatamente para um de nossos representantes e aguarde.
- Use emojis com moderação para manter uma conversa leve, alegre e acolhedora.
- Mantenha respostas curtas e concisas de 2 a 3 parágrafos no máximo.`;

        const LALELILO_GREETING = "Oiii! 😍 Eu sou a Lali, da *Lalelilo*! A maior rede de moda infantil do Nordeste! 👶✨ Como posso te chamar?";

        let bot = await db.bot.findFirst({ where: { organizationId: org.id } });
        if (!bot) {
          bot = await db.bot.create({
            data: {
              organizationId: org.id,
              name: "Agente Lalelilo",
              model: "gemini-2.5-flash",
              systemPrompt: LALELILO_SYSTEM_PROMPT,
              greetingMessage: LALELILO_GREETING,
              temperature: 0.7
            }
          });
          console.log('[Seed] Created Agente Lalelilo with full e-commerce prompt.');
        } else {
          // Always update the prompt on boot to keep it current
          await db.bot.update({
            where: { id: bot.id },
            data: {
              systemPrompt: LALELILO_SYSTEM_PROMPT,
              greetingMessage: LALELILO_GREETING,
              name: "Agente Lalelilo"
            }
          });
          console.log('[Seed] Updated Agente Lalelilo e-commerce prompt.');
        }

        // 3. Configure WhatsApp Channel
        const wabaToken = process.env.LALELILO_WABA_ACCESS_TOKEN;
        const wabaPhoneId = process.env.LALELILO_WABA_PHONE_NUMBER_ID;
        const wabaBusinessId = process.env.LALELILO_WABA_BUSINESS_ACCOUNT_ID;

        if (wabaToken && wabaPhoneId && wabaBusinessId) {
          const wabaCredentials = {
            accessToken: wabaToken,
            phoneNumberId: wabaPhoneId,
            businessAccountId: wabaBusinessId
          };
          const encryptedWaba = crypto.encrypt(JSON.stringify(wabaCredentials), org.id);

          const existingWaba = await db.channel.findFirst({
            where: { botId: bot.id, type: 'WHATSAPP' }
          });

          if (existingWaba) {
            await db.channel.update({
              where: { id: existingWaba.id },
              data: { credentials: encryptedWaba, isActive: true }
            });
          } else {
            await db.channel.create({
              data: {
                organizationId: org.id,
                botId: bot.id,
                type: 'WHATSAPP',
                provider: 'META',
                credentials: encryptedWaba,
                isActive: true
              }
            });
          }
          console.log('[Seed] Lalelilo WhatsApp Cloud API channel configured successfully.');
        } else {
          console.log('[Seed] Skipping Lalelilo WhatsApp: WABA environment variables are not set.');
        }

        // 4. Configure Instagram & FB Messenger Channels
        const igToken = process.env.LALELILO_IG_ACCESS_TOKEN;
        const igPageId = process.env.LALELILO_IG_PAGE_ID;

        if (igToken && igPageId) {
          const igCredentials = {
            accessToken: igToken,
            pageId: igPageId
          };
          const encryptedIg = crypto.encrypt(JSON.stringify(igCredentials), org.id);

          const existingIg = await db.channel.findFirst({
            where: { botId: bot.id, type: 'INSTAGRAM' }
          });

          if (existingIg) {
            await db.channel.update({
              where: { id: existingIg.id },
              data: { credentials: encryptedIg, isActive: true }
            });
          } else {
            await db.channel.create({
              data: {
                organizationId: org.id,
                botId: bot.id,
                type: 'INSTAGRAM',
                provider: 'META',
                credentials: encryptedIg,
                isActive: true
              }
            });
          }

          const existingFb = await db.channel.findFirst({
            where: { botId: bot.id, type: 'MESSENGER' }
          });

          if (existingFb) {
            await db.channel.update({
              where: { id: existingFb.id },
              data: { credentials: encryptedIg, isActive: true }
            });
          } else {
            await db.channel.create({
              data: {
                organizationId: org.id,
                botId: bot.id,
                type: 'MESSENGER',
                provider: 'META',
                credentials: encryptedIg,
                isActive: true
              }
            });
          }
          console.log('[Seed] Lalelilo Instagram and Messenger channels configured successfully.');
        } else {
          console.log('[Seed] Skipping Lalelilo Instagram/Messenger: IG environment variables are not set.');
        }

        console.log('[Seed] Lalelilo Meta integration channels, Gemini key, and limits verified successfully.');
      }
    } catch (laleliloError) {
      console.warn('[Seed] Warning: Failed to seed Lalelilo Meta channels:', laleliloError.message);
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
