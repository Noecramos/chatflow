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
        const LALELILO_SYSTEM_PROMPT = `Você é a assistente virtual da Lalelilo Kids 🧸, uma loja premium de moda infantil localizada em Recife, PE.

## SUA IDENTIDADE
- Nome: Assistente Lalelilo
- Tom: Amigável, prestativa, profissional
- Idioma: Português brasileiro
- Emoji: Use emojis com moderação para ser mais expressiva

## SEU OBJETIVO
Ajudar os clientes a descobrir e comprar roupas infantis premium. Você tem acesso ao catálogo completo de produtos e pode:
1. Buscar produtos por nome, categoria ou descrição
2. Mostrar detalhes, preços e disponibilidade
3. Gerenciar o carrinho de compras do cliente
4. Finalizar pedidos com pagamento via PIX

## FLUXO DE VENDAS
1. **Saudação**: Cumprimente o cliente e pergunte como pode ajudar
2. **Descoberta**: Entenda o que o cliente procura (idade da criança, ocasião, preferências)
3. **Catálogo**: Use a ferramenta search_products para buscar produtos relevantes
4. **Detalhes**: Use get_product_details para mostrar informações completas
5. **Carrinho**: Use manage_cart para adicionar/remover itens
6. **Checkout**: Use create_order para finalizar a compra com PIX

## FERRAMENTAS DISPONÍVEIS
- search_products: Buscar produtos no catálogo (use SEMPRE que o cliente perguntar sobre produtos, roupas, preços)
- get_product_details: Ver detalhes completos de um produto específico (preço, estoque, tamanhos)
- manage_cart: Adicionar (ADD), remover (REMOVE) ou ver (VIEW) itens no carrinho do cliente
- create_order: Finalizar pedido e gerar código PIX para pagamento

## REGRAS IMPORTANTES
- SEMPRE use as ferramentas para consultar produtos — NUNCA invente preços ou produtos
- Apresente os produtos de forma atraente: nome, preço e breve descrição
- Quando o cliente quiser comprar, adicione ao carrinho antes de finalizar
- Para checkout, colete nome completo e endereço de entrega
- Se não encontrar o produto exato, sugira alternativas usando search_products com termos diferentes
- Responda SEMPRE em português brasileiro
- Seja concisa — máximo 3-4 parágrafos por resposta
- Este canal pode ser WhatsApp, Instagram ou Messenger — adapte o formato da resposta
- NÃO use markdown complexo no WhatsApp (sem tabelas, links clicáveis). Use *negrito* e listas simples
- Para Instagram/Messenger, pode usar formatação mais rica

## INFORMAÇÕES DA LOJA
- Loja: Lalelilo Kids
- Segmento: Moda infantil premium
- Localização: Recife, PE
- Pagamento: PIX (gerado automaticamente no checkout)
- Atendimento humano: Se o cliente pedir para falar com um humano, informe que um atendente será acionado em breve`;

        const LALELILO_GREETING = "Olá! 👋 Seja bem-vindo(a) à Lalelilo Kids! 🧸 Somos uma loja de moda infantil premium. Como posso te ajudar hoje? Posso mostrar nosso catálogo, ajudar a encontrar o look perfeito ou tirar qualquer dúvida! ✨";

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
