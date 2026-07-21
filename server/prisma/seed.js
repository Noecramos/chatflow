const db = require('../src/db');
const bcrypt = require('bcryptjs');
const crypto = require('../src/utils/crypto');
require('dotenv').config();

async function main() {
  console.log('[Seed] Starting database seed...');
  await db.$connect();

  // 1. Master Admin System Account
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
    console.log(`[Seed] Default Master Admin seeded: ${adminEmail}`);
  }

  // 2. Legacy Bot Migration
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
      console.log(`[Seed] Migrated ${migrated.count} legacy Volt bots to Agente IA.`);
    }
  } catch (migError) {
    console.warn('[Seed] Warning: Failed to migrate legacy bots:', migError.message);
  }

  // 3. Lalelilo Organization & Meta Integration
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
      console.log('[Seed] Created Lalelilo organization.');
    }

    if (org) {
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
        console.log('[Seed] Default Lalelilo owner user seeded.');
      }

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
        console.log('[Seed] Lalelilo Gemini key configured.');
      }

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
   - Com base na cidade informada, mencione as lojas disponíveis naquela região e solicite que o cliente confirme de qual loja prefere ser atendido.
   
4. **FILTRO DE GÊNERO**:
   - Após a definição da loja, pergunte se as roupinhas que ele procura são para menino 👦, menina 👧 ou ambos.
   
5. **DESCOBERTA DE PRODUTOS & BUSCA**:
   - Pergunte o que o cliente gostaria de ver e use a ferramenta 'search_products' para buscar no estoque da loja selecionada.
   
6. **GERENCIAMENTO DO CARRINHO**:
   - Quando o cliente escolher um item, adicione ao carrinho usando 'manage_cart' (ADD).
   
7. **FINALIZAÇÃO DO CHECKOUT (PIX)**:
   - Quando o cliente confirmar que deseja fechar o pedido: solicite Nome Completo e CPF, use 'create_order' para gerar o código PIX copia e cola.`;

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
        console.log('[Seed] Created Agente Lalelilo.');
      } else {
        await db.bot.update({
          where: { id: bot.id },
          data: {
            systemPrompt: LALELILO_SYSTEM_PROMPT,
            greetingMessage: LALELILO_GREETING,
            name: "Agente Lalelilo"
          }
        });
        console.log('[Seed] Updated Agente Lalelilo prompt.');
      }

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
        console.log('[Seed] Lalelilo WhatsApp Cloud API channel configured.');
      }

      const igToken = process.env.LALELILO_IG_ACCESS_TOKEN;
      const igPageId = process.env.LALELILO_IG_PAGE_ID;

      if (igToken && igPageId) {
        const igCredentials = { accessToken: igToken, pageId: igPageId };
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
        console.log('[Seed] Lalelilo Instagram/Messenger channels configured.');
      }
    }
  } catch (err) {
    console.warn('[Seed] Warning during Lalelilo setup:', err.message);
  }

  console.log('[Seed] Database seed completed successfully.');
}
// Only auto-execute when run directly (e.g. `node prisma/seed.js`)
// When require()'d from server.js, export the function without running it
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('[Seed Error]:', e);
      process.exit(1);
    })
    .finally(async () => {
      await db.$disconnect();
    });
}

module.exports = main;

