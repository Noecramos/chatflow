/**
 * Webhook Controller: Meta Omnichannel Webhook Receiver
 * Integrates WhatsApp Business, Instagram DM, and FB Messenger to refined Contact and InboxConversation database tables.
 */
const prisma = require('../db');
const metaService = require('../services/meta');
const aiService = require('../services/ai.service');
const { transcribeAudio } = require('../services/audio-stt');
const crypto = require('../utils/crypto');

const processedMessageIds = new Set();
const processedMessageIdsQueue = [];

async function isDuplicate(msgId) {
  if (!msgId) return false;

  // Check in-memory cache
  if (processedMessageIds.has(msgId)) {
    console.log(`[Webhook Deduplication] Duplicate detected (in-memory): ${msgId}`);
    return true;
  }

  // Check database to persist across restarts
  try {
    const existing = await prisma.message.findFirst({
      where: {
        metadata: {
          contains: msgId
        }
      }
    });
    if (existing) {
      console.log(`[Webhook Deduplication] Duplicate detected (database): ${msgId}`);
      // Add to cache for faster future lookups
      processedMessageIds.add(msgId);
      processedMessageIdsQueue.push(msgId);
      return true;
    }
  } catch (err) {
    console.warn("[Webhook Deduplication] DB lookup failed:", err.message);
  }

  // Add to in-memory cache
  processedMessageIds.add(msgId);
  processedMessageIdsQueue.push(msgId);
  if (processedMessageIdsQueue.length > 5000) {
    const oldest = processedMessageIdsQueue.shift();
    processedMessageIds.delete(oldest);
  }

  return false;
}

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

    const verifyToken = process.env.META_VERIFY_TOKEN || 'chatflow_verify_token_123';
    const allowedTokens = [verifyToken, 'lalelilo_verify_2026', 'chatflow_verify_token_123', 'chatvolt_verify_token_123'];

    if (mode && token) {
      if (mode === 'subscribe' && allowedTokens.includes(token)) {
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

    // Acknowledge Meta immediately to avoid retry storms
    res.status(200).send('EVENT_RECEIVED');

    try {
      if (!body.object) return;

      // 1. WhatsApp Events (Batch Processing)
      if (body.object === 'whatsapp_business_account') {
        if (body.entry && Array.isArray(body.entry)) {
          for (const entry of body.entry) {
            if (entry.changes && Array.isArray(entry.changes)) {
              for (const change of entry.changes) {
                const value = change.value;
                if (!value || !value.messages || !Array.isArray(value.messages)) continue;

                for (const message of value.messages) {
                  const contact = value.contacts?.[0];

                  // Webhook retry deduplication
                  if (await isDuplicate(message.id)) {
                    console.log(`[Meta Webhook] Skipping duplicate WhatsApp message: ${message.id}`);
                    continue;
                  }

                  const senderPhone = message.from;
                  const senderName = contact?.profile?.name || `WhatsApp User (${senderPhone.slice(-4)})`;
                  const phoneId = value.metadata?.phone_number_id;

                  let messageText = "";
                  let metaDetails = { whatsappMessageId: message.id };

                  if (message.type === 'text') {
                    messageText = message.text.body;
                  } else if (message.type === 'audio') {
                    // Transcribe audio using Google Cloud Speech-to-Text (client's API key)
                    const googleSTTKey = process.env.GOOGLE_TTS_API_KEY;
                    const wabaToken = process.env.LALELILO_WABA_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
                    const audioMediaId = message.audio?.id;
                    if (googleSTTKey && wabaToken && audioMediaId) {
                      console.log(`[Webhook] Audio message received, transcribing with Google STT...`);
                      const transcribed = await transcribeAudio(audioMediaId, wabaToken, googleSTTKey);
                      if (transcribed) {
                        messageText = transcribed;
                        metaDetails = { ...metaDetails, originalType: 'audio', transcribed: true };
                      } else {
                        messageText = '[Áudio não reconhecido]';
                        metaDetails = { ...metaDetails, originalType: 'audio', transcribed: false };
                      }
                    } else {
                      messageText = '[Mensagem de áudio]';
                      metaDetails = { ...metaDetails, originalType: 'audio', transcribed: false };
                    }
                  } else if (message.type === 'interactive') {
                    const interactive = message.interactive;
                    if (interactive.type === 'list_reply') {
                      messageText = interactive.list_reply.title;
                      metaDetails = { ...metaDetails, list_reply_id: interactive.list_reply.id };
                    } else if (interactive.type === 'button_reply') {
                      messageText = interactive.button_reply.title;
                      metaDetails = { ...metaDetails, button_reply_id: interactive.button_reply.id };
                    }
                  } else if (message.type === 'order') {
                    const order = message.order;
                    messageText = `WhatsApp Native Order Submitted: ${order.product_items.length} items.`;
                    metaDetails = { ...metaDetails, orderItems: order.product_items, catalogId: order.catalog_id };
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
              }
            }
          }
        }
      }

      // 2. Instagram & Messenger Events (Batch Processing)
      if (body.object === 'page' || body.object === 'instagram') {
        if (body.entry && Array.isArray(body.entry)) {
          for (const entry of body.entry) {
            if (entry.messaging && Array.isArray(entry.messaging)) {
              for (const messaging of entry.messaging) {
                const senderId = messaging.sender?.id;
                const recipientId = messaging.recipient?.id;
                const message = messaging.message;
                const postback = messaging.postback;

                if (!message && !postback) continue;

                // Webhook retry deduplication
                const msgId = message?.mid;
                if (msgId && await isDuplicate(msgId)) {
                  console.log(`[Meta Webhook] Skipping duplicate IG/Messenger message: ${msgId}`);
                  continue;
                }

                let messageText = "";
                let metaDetails = msgId ? { messengerMessageId: msgId } : {};

                if (message) {
                  // Check for audio attachments in IG/Messenger
                  const audioAttachment = message.attachments?.find(a => a.type === 'audio');
                  if (audioAttachment && audioAttachment.payload?.url) {
                    const googleSTTKey = process.env.GOOGLE_TTS_API_KEY;
                    if (googleSTTKey) {
                      console.log(`[Webhook] IG/FB audio attachment, transcribing...`);
                      // For IG/Messenger, audio URL is directly available (no media ID lookup needed)
                      try {
                        const axios = require('axios');
                        const audioRes = await axios.get(audioAttachment.payload.url, { responseType: 'arraybuffer' });
                        const base64Audio = Buffer.from(audioRes.data).toString('base64');
                        const sttRes = await axios.post(`https://speech.googleapis.com/v1/speech:recognize?key=${googleSTTKey}`, {
                          config: { encoding: 'OGG_OPUS', sampleRateHertz: 16000, languageCode: 'pt-BR', model: 'latest_long', enableAutomaticPunctuation: true },
                          audio: { content: base64Audio }
                        });
                        const results = sttRes.data.results;
                        if (results && results.length > 0) {
                          messageText = results.map(r => r.alternatives?.[0]?.transcript || '').join(' ').trim();
                          metaDetails = { ...metaDetails, originalType: 'audio', transcribed: true };
                        } else {
                          messageText = '[Áudio não reconhecido]';
                        }
                      } catch (e) {
                        console.error('[Webhook] IG/FB audio transcription failed:', e.message);
                        messageText = '[Mensagem de áudio]';
                      }
                    } else {
                      messageText = '[Mensagem de áudio]';
                    }
                  } else {
                    messageText = message.text || "[Media attachment]";
                  }
                  metaDetails = message.attachments ? { ...metaDetails, attachments: message.attachments } : metaDetails;
                } else if (postback) {
                  messageText = postback.title;
                  metaDetails = { ...metaDetails, payload: postback.payload };
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
            }
          }
        }
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

  // 1. Locate channel integration by matching decrypted credentials (tenant isolation)
  const channels = await prisma.channel.findMany({
    where: { type: channelType, isActive: true },
    include: { bot: true }
  });

  const crypto = require('../utils/crypto');
  let channel = null;

  for (const chan of channels) {
    if (chan.credentials) {
      try {
        let creds = {};
        const rawCreds = chan.credentials;
        try {
          // 1. Try to parse directly in case of raw sandbox JSON
          creds = JSON.parse(rawCreds);
        } catch (e) {
          // 2. Not plain JSON, attempt safe decryption
          const decryptedStr = crypto.decrypt(rawCreds, chan.organizationId);
          creds = decryptedStr ? JSON.parse(decryptedStr) : {};
        }

        if (channelType === 'WHATSAPP') {
          // Match by WhatsApp Phone Number ID
          if (creds.phoneNumberId === channelIdentifier) {
            channel = chan;
            break;
          }
        } else if (channelType === 'INSTAGRAM') {
          // Match by Facebook Page ID or Instagram Business Account ID
          if (creds.pageId === channelIdentifier || creds.instagramBusinessAccountId === channelIdentifier) {
            channel = chan;
            break;
          }
        } else {
          // Match by Facebook Page ID for MESSENGER
          if (creds.pageId === channelIdentifier) {
            channel = chan;
            break;
          }
        }
      } catch (e) {
        console.error(`[Webhook Route] Failed to decrypt/parse credentials for channel ${chan.id}:`, e.message);
      }
    }
  }

  // Fallback to first active channel if no exact match (retains local/sandbox compatibility)
  if (!channel && channels.length > 0) {
    console.log(`[Webhook Route] No exact credential match found for ${channelType} ID: ${channelIdentifier}. Falling back to default channel.`);
    channel = channels[0];
  }

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
          name: "Agente IA",
          systemPrompt: "Você é o Agente IA, um assistente virtual inteligente. Você ajuda os clientes tirando dúvidas, dando suporte e fornecendo informações sobre a empresa de forma prestativa e profissional.",
          greetingMessage: "Olá! Seja bem-vindo. Como posso te ajudar hoje?"
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
