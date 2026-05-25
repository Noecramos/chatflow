/**
 * Webhook Controller: Meta Omnichannel Webhook Receiver
 * Integrates WhatsApp Business, Instagram DM, and FB Messenger to refined Contact and InboxConversation database tables.
 */
const prisma = require('../db');
const metaService = require('../services/meta');
const aiService = require('../services/ai.service');


let io = null;

function setSocketIO(socketInstance) {
  io = socketInstance;
}

function broadcastToDashboard(orgId, event, data) {
  if (io) {
    console.log(`[Socket] Broadcasting event: ${event} to organization: ${orgId}`);
    io.to(orgId).emit(event, data);
  }
}

module.exports = {
  setSocketIO,

  /**
   * Meta challenge verify token flow
   */
  async verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN || 'chatvolt_verify_token_123';

    if (mode && token) {
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Meta Webhook] challenge verification succeeded.');
        return res.status(200).send(challenge);
      } else {
        console.warn('[Meta Webhook] challenge verification failed.');
        return res.sendStatus(403);
      }
    }
    return res.sendStatus(400);
  },

  /**
   * Webhook message receiver router
   */
  async handleWebhookPayload(req, res) {
    const body = req.body;
    console.log('[Meta Webhook] Payload received:', JSON.stringify(body, null, 2));

    // Acknowledge Meta
    res.status(200).send('EVENT_RECEIVED');

    try {
      if (!body.object) return;

      // 1. WhatsApp Events
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0]?.value;
        const message = change?.messages?.[0];
        const contact = change?.contacts?.[0];

        if (!message) return;

        const senderPhone = message.from;
        const senderName = contact?.profile?.name || `WhatsApp User (${senderPhone.slice(-4)})`;
        const phoneId = change.metadata?.phone_number_id;

        let messageText = "";
        let metaDetails = {};

        if (message.type === 'text') {
          messageText = message.text.body;
        } else if (message.type === 'interactive') {
          const interactive = message.interactive;
          if (interactive.type === 'list_reply') {
            messageText = interactive.list_reply.title;
            metaDetails = { list_reply_id: interactive.list_reply.id };
          } else if (interactive.type === 'button_reply') {
            messageText = interactive.button_reply.title;
            metaDetails = { button_reply_id: interactive.button_reply.id };
          }
        } else if (message.type === 'order') {
          const order = message.order;
          messageText = `WhatsApp Native Order Submitted: ${order.product_items.length} items.`;
          metaDetails = { orderItems: order.product_items, catalogId: order.catalog_id };
        } else {
          messageText = `[Media/Interactive payload: ${message.type}]`;
        }

        await processOmnichannelMessage({
          senderId: senderPhone,
          senderName: senderName,
          channelType: 'WHATSAPP',
          channelIdentifier: phoneId,
          content: messageText,
          metadata: metaDetails
        });
      }

      // 2. Instagram & Messenger Events
      if (body.object === 'page' || body.object === 'instagram') {
        const entry = body.entry?.[0];
        const messaging = entry?.messaging?.[0];
        if (!messaging) return;

        const senderId = messaging.sender?.id;
        const recipientId = messaging.recipient?.id;
        const message = messaging.message;
        const postback = messaging.postback;

        if (!message && !postback) return;

        let messageText = "";
        let metaDetails = {};

        if (message) {
          messageText = message.text || "[Media attachment]";
          metaDetails = message.attachments ? { attachments: message.attachments } : {};
        } else if (postback) {
          messageText = postback.title;
          metaDetails = { payload: postback.payload };
        }

        const channelType = body.object === 'instagram' ? 'INSTAGRAM' : 'MESSENGER';

        await processOmnichannelMessage({
          senderId: senderId,
          senderName: `${channelType === 'INSTAGRAM' ? 'IG' : 'Messenger'} User (${senderId.slice(-4)})`,
          channelType: channelType,
          channelIdentifier: recipientId,
          content: messageText,
          metadata: metaDetails
        });
      }

    } catch (e) {
      console.error("[Meta Webhook parsing error]:", e);
    }
  }
};

/**
 * Common Orchestrator mapping webhooks directly to Contact and InboxConversation tables
 */
async function processOmnichannelMessage({ senderId, senderName, channelType, channelIdentifier, content, metadata }) {
  console.log(`[Omni Webhook Processor] Msg from ${senderId} via ${channelType}`);

  // 1. Locate channel integration
  let channel = await prisma.channel.findFirst({
    where: { type: channelType, isActive: true },
    include: { bot: true }
  });

  if (!channel) {
    console.warn(`No active ${channelType} channel configuration found. Bootstrapping sandbox.`);
    
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({
        data: { name: "Default Org", slug: "default-org" }
      });
    }

    let bot = await prisma.bot.findFirst({ where: { organizationId: org.id } });
    if (!bot) {
      bot = await prisma.bot.create({
        data: {
          organizationId: org.id,
          name: "Volt AI Bot",
          systemPrompt: "You are Volt Copilot. Help customers discover products in the store and create orders.",
          greetingMessage: "Hello! Welcome to our store. How can I help you today?"
        }
      });
    }

    channel = await prisma.channel.create({
      data: {
        organizationId: org.id,
        botId: bot.id,
        type: channelType,
        credentials: JSON.stringify({ accessToken: process.env.META_ACCESS_TOKEN || "", phoneNumberId: channelIdentifier || "" }),
        isActive: true
      },
      include: { bot: true }
    });
  }

  const bot = channel.bot;

  // 2. Fetch or Create Contact record
  let contact = await prisma.contact.findFirst({
    where: {
      organizationId: channel.organizationId,
      platformId: senderId,
      platformType: channelType
    }
  });

  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        organizationId: channel.organizationId,
        name: senderName,
        platformId: senderId,
        platformType: channelType,
        phone: channelType === 'WHATSAPP' ? senderId : null,
        leadSource: channelType
      }
    });
  }

  // 3. Fetch or Create InboxConversation thread
  let conversation = await prisma.inboxConversation.findFirst({
    where: {
      channelId: channel.id,
      contactId: contact.id
    }
  });

  if (!conversation) {
    conversation = await prisma.inboxConversation.create({
      data: {
        organizationId: channel.organizationId,
        channelId: channel.id,
        contactId: contact.id,
        botId: bot.id,
        status: "OPEN"
      }
    });

    if (bot.greetingMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "BOT",
          content: bot.greetingMessage
        }
      });
    }
  }

  // 4. Save Customer Message
  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: "USER",
      content: content,
      metadata: JSON.stringify(metadata)
    }
  });

  // 5. Update Conversation active date
  const updatedConversation = await prisma.inboxConversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
    include: {
      contact: true,
      channel: { select: { type: true } },
      bot: { select: { name: true } },
      assignedUser: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  // 6. Socket stream to dashboard
  broadcastToDashboard(channel.organizationId, "message_received", {
    session: updatedConversation,
    message: userMessage
  });

  // 7. Handover validation
  if (conversation.isHumanHandoverActive || !bot.isAiActive) {
    console.log(`[Takeover Active] Muted bot AI. Waiting for live agent.`);
    return;
  }

  // 8. Trigger AI engine
  const reply = await aiService.processChatMessage(prisma, bot, updatedConversation, content);

  // 9. Save Bot response
  const botMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: "BOT",
      content: reply
    }
  });

  // 10. Deliver reply back via Meta Graph API
  try {
    await metaService.sendTextMessage(channel, senderId, reply);
  } catch (err) {
    console.error("Meta Cloud reply delivery error:", err.message);
  }

  // 11. Socket stream back to dashboard
  broadcastToDashboard(channel.organizationId, "message_sent", {
    session: updatedConversation,
    message: botMessage
  });
}
