/**
 * Inbox Controller: Manages live chat operations in the Omnichannel Inbox
 * Handles unified conversations, contacts metadata, manual replies, assignment, handover, and AI suggestions.
 */
const prisma = require('../db');
const metaService = require('../services/meta');
const { GoogleGenAI } = require('@google/genai');

const ragService = require('../services/rag.service');

let io = null;
function setSocketIO(socketInstance) {
  io = socketInstance;
}

module.exports = {
  setSocketIO,

  /**
   * Fetch conversation list with tab filtering, search, and stats
   * Query params: tab (unresolved|unread|human_requested|resolved|all), search, channel
   */
  async getConversations(req, res) {
    const { organizationId } = req.user;
    const { tab, search, channel } = req.query;

    try {
      // Build where clause based on tab
      let where = { organizationId };

      switch (tab) {
        case 'unresolved':
          where.status = { in: ['OPEN', 'PENDING'] };
          break;
        case 'unread':
          where.isRead = false;
          where.status = { not: 'CLOSED' };
          break;
        case 'human_requested':
          where.isHumanHandoverActive = true;
          break;
        case 'resolved':
          where.status = 'CLOSED';
          break;
        // 'all' or undefined = no filter
      }

      // Channel filter
      if (channel && channel !== 'ALL') {
        where.channel = { type: channel.toUpperCase() };
      }

      // Text search across contact name, platformId, tags
      if (search && search.trim()) {
        where.OR = [
          { contact: { name: { contains: search, mode: 'insensitive' } } },
          { contact: { platformId: { contains: search, mode: 'insensitive' } } },
          { label: { contains: search, mode: 'insensitive' } },
          { tags: { contains: search, mode: 'insensitive' } }
        ];
      }

      const conversations = await prisma.inboxConversation.findMany({
        where,
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      // Tab counts (for badges)
      const allConvs = await prisma.inboxConversation.findMany({
        where: { organizationId },
        select: { status: true, isRead: true, isHumanHandoverActive: true, channel: { select: { type: true } } }
      });

      const tabCounts = {
        unresolved: allConvs.filter(c => c.status === 'OPEN' || c.status === 'PENDING').length,
        unread: allConvs.filter(c => !c.isRead && c.status !== 'CLOSED').length,
        human_requested: allConvs.filter(c => c.isHumanHandoverActive).length,
        resolved: allConvs.filter(c => c.status === 'CLOSED').length,
        all: allConvs.length
      };

      // Stats
      const uniqueChannels = [...new Set(allConvs.map(c => c.channel.type))];
      const stats = {
        totalConversations: allConvs.length,
        distinctChannels: uniqueChannels.length
      };

      return res.status(200).json({ success: true, conversations, tabCounts, stats });
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Fetch message history & cart items for a specific conversation
   */
  async getConversationMessages(req, res) {
    const { id } = req.params;
    const { organizationId } = req.user;

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      const messages = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' }
      });

      const cartItems = await prisma.cartItem.findMany({
        where: { conversationId: id }
      });

      return res.status(200).json({
        success: true,
        conversation,
        messages,
        cartItems
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Assign conversation thread to a specific agent user
   */
  async assignConversation(req, res) {
    const { id } = req.params;
    const { userId } = req.body;
    const { organizationId } = req.user;

    try {
      const updated = await prisma.inboxConversation.update({
        where: { id, organizationId },
        data: { assignedUserId: userId || null },
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      if (io) {
        io.to(organizationId).emit("session_updated", { session: updated });
      }

      return res.status(200).json({ success: true, conversation: updated });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Toggle AI/Human Handover takeover
   */
  async toggleHandover(req, res) {
    const { id } = req.params;
    const { isHumanHandoverActive } = req.body;
    const { organizationId } = req.user;

    try {
      const updated = await prisma.inboxConversation.update({
        where: { id, organizationId },
        data: { isHumanHandoverActive },
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      const operator = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { firstName: true, lastName: true }
      });
      const operatorName = operator ? `${operator.firstName} ${operator.lastName}` : "Atendente";

      const noteText = isHumanHandoverActive 
        ? `${operatorName} assumiu o controle. IA silenciada.` 
        : `${operatorName} devolveu o controle. IA reativada.`;

      const systemMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: "SYSTEM",
          content: noteText
        }
      });

      if (io) {
        io.to(organizationId).emit("session_updated", { session: updated });
        io.to(organizationId).emit("message_received", { session: updated, message: systemMessage });
      }

      // Auto-trigger bot response when returned to AI and AI is active
      if (!isHumanHandoverActive && updated.bot?.isAiActive) {
        const lastUserMsg = await prisma.message.findFirst({
          where: { conversationId: id, senderType: "USER" },
          orderBy: { createdAt: 'desc' }
        });

        if (lastUserMsg) {
          const aiService = require('../services/ai.service');
          console.log(`[Handover Return] Automatically triggering AI for returned conversation: ${id}`);
          
          // Execute AI chat processing asynchronously or synchronously
          aiService.processChatMessage(prisma, updated.bot, updated, lastUserMsg.content)
            .then(async (reply) => {
              const botMessage = await prisma.message.create({
                data: {
                  conversationId: id,
                  senderType: "BOT",
                  content: reply
                }
              });

              try {
                await metaService.sendTextMessage(updated.channel, updated.contact.platformId, reply);
              } catch (err) {
                console.error("Meta Cloud automatic handover reply delivery error:", err.message);
              }

              if (io) {
                io.to(organizationId).emit("message_sent", { session: updated, message: botMessage });
              }
            })
            .catch((err) => {
              console.error("[Handover Return] AI generation failed:", err.message);
            });
        }
      }

      return res.status(200).json({ success: true, conversation: updated, systemMessage });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Update properties (labels, notes, priority, status, tags, isRead)
   */
  async updateProperties(req, res) {
    const { id } = req.params;
    const { label, notes, priority, status, tags, isRead } = req.body;
    const { organizationId } = req.user;

    try {
const { parseJson, stringifyJson } = require('../utils/json-helpers');

      const updateData = {};
      if (label !== undefined) updateData.label = label;
      if (notes !== undefined) updateData.notes = notes;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;
      if (tags !== undefined) updateData.tags = stringifyJson(tags, '[]');
      if (isRead !== undefined) updateData.isRead = isRead;

      const updated = await prisma.inboxConversation.update({
        where: { id, organizationId },
        data: updateData,
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      if (io) {
        io.to(organizationId).emit("session_updated", { session: updated });
      }

      return res.status(200).json({ success: true, conversation: updated });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Dispatch manual agent reply via Meta APIs
   */
  async sendManualReply(req, res) {
    const { id } = req.params;
    const { content } = req.body;
    const { organizationId } = req.user;

    if (!content) {
      return res.status(400).json({ success: false, error: "Content cannot be blank." });
    }

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { channel: true, contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      // Send via Meta API
      try {
        await metaService.sendTextMessage(conversation.channel, conversation.contact.platformId, content);
      } catch (err) {
        console.error("Meta transmission failure:", err.message);
        return res.status(502).json({ success: false, error: `Transmission failed: ${err.message}` });
      }

      const operator = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { firstName: true, lastName: true }
      });
      const operatorName = operator ? `${operator.firstName} ${operator.lastName}` : "Atendente";

      const inboxService = require('../services/inbox.service');
      const { message: agentMessage, conversation: updated } = await inboxService.createAndEmitMessage({
        conversationId: id,
        organizationId,
        senderType: "AGENT",
        content,
        metadata: { senderName: operatorName },
        io
      });

      // Legacy socket emit for backward compatibility
      if (io) {
        io.to(organizationId).emit("message_sent", { session: updated, message: agentMessage });
      }

      return res.status(200).json({ success: true, message: agentMessage });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * AI Suggestions Copilot generator
   * Formulates highly tailored suggested responses based on chat history and bot context.
   */
  async getAiSuggestions(req, res) {
    const { id } = req.params;
    const { organizationId } = req.user;

    const org = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    const crypto = require('../utils/crypto');
    const geminiKey = (org && org.geminiKey) 
      ? crypto.decrypt(org.geminiKey, org.id) 
      : (process.env.GEMINI_API_KEY || null);

    if (!geminiKey) {

      return res.status(200).json({
        success: true,
        suggestion: "Hi! How can I help you today? (Configure GEMINI_API_KEY to unlock smart AI Suggested Replies)"
      });
    }

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { bot: true, contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      // Load last 6 messages
      const history = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'desc' },
        take: 6
      });

      // Reverse to get chronological order
      history.reverse();

      const lastUserMsg = history.filter(m => m.senderType === 'USER').pop();
      const queryText = lastUserMsg ? lastUserMsg.content : "customer inquiry";

      // Match RAG knowledge chunks
      const matchedChunks = await ragService.searchKnowledge(prisma, conversation.bot.id, queryText, null, 2);
      
      let contextStr = "Brand Prompt: " + conversation.bot.systemPrompt + "\n";
      if (matchedChunks.length > 0) {
        contextStr += "\nRelevant catalog / documentation context:\n";
        matchedChunks.forEach((c, idx) => {
          contextStr += `[Context ${idx+1}]: ${c.content}\n`;
        });
      }

      // Format timeline
      let timeline = "";
      history.forEach(m => {
        const who = m.senderType === 'USER' ? 'Customer' : 'Bot/Agent';
        timeline += `${who}: ${m.content}\n`;
      });

      // Execute Gemini
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{
              text: `You are an AI Copilot helping a customer service representative handle their chat.
Review the knowledge context and recent conversation history below. 
Generate a helpful, polite, and brand-compliant suggested reply for the agent to send.
Keep it extremely concise (1-3 sentences max).
Return ONLY the suggested response text itself. Do not include quotes, wrappers, "Suggested reply:" headers, or markdown annotations.

CONTEXT:
${contextStr}

CONVERSATION TIMELINE:
${timeline}
Suggested Agent Reply:`
            }]
          }
        ]
      });

      const suggestionText = response.text?.trim() || "How can I help you today?";

      // Write to database
      await prisma.inboxConversation.update({
        where: { id },
        data: { aiSuggestions: suggestionText }
      });

      return res.status(200).json({ success: true, suggestion: suggestionText });

    } catch (e) {
      console.error("Failed to generate AI Suggestions:", e.message);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Public Web Widget message handler: Lets external projects interact programmatically
   */
  async handleWidgetMessage(req, res) {
    const { botId, message, sessionId } = req.body;

    if (!botId || !message) {
      return res.status(400).json({ success: false, error: "botId and message are required." });
    }

    try {
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        include: { channels: true }
      });

      if (!bot) {
        return res.status(404).json({ success: false, error: "Bot not found." });
      }

      // Find or create widget channel integration
      let channel = await prisma.channel.findFirst({
        where: { botId: bot.id, type: "WIDGET", isActive: true }
      });

      if (!channel) {
        channel = await prisma.channel.create({
          data: {
            organizationId: bot.organizationId,
            botId: bot.id,
            type: "WIDGET",
            isActive: true
          }
        });
      }

      // Find or create contact
      const visitorPlatformId = sessionId || `widget-visitor-${Date.now()}`;
      let contact = await prisma.contact.findFirst({
        where: { organizationId: bot.organizationId, platformId: visitorPlatformId }
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            organizationId: bot.organizationId,
            name: `Widget Visitor (${visitorPlatformId.slice(-4)})`,
            platformId: visitorPlatformId,
            platformType: "WIDGET"
          }
        });
      }

      // Find or create conversation
      let conversation = await prisma.inboxConversation.findFirst({
        where: { channelId: channel.id, contactId: contact.id }
      });

      if (!conversation) {
        conversation = await prisma.inboxConversation.create({
          data: {
            organizationId: bot.organizationId,
            channelId: channel.id,
            contactId: contact.id,
            botId: bot.id,
            status: "OPEN"
          }
        });

        // Greeting
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

      // Save user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "USER",
          content: message
        }
      });

      // Update last active
      const updated = await prisma.inboxConversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      // Socket broadcast
      if (io) {
        io.to(bot.organizationId).emit("message_received", {
          session: updated,
          message: { senderType: "USER", content: message, createdAt: new Date() }
        });
      }

      // AI response
      let reply = "";
      if (conversation.isHumanHandoverActive) {
        reply = "A human agent has assumed control of this thread. They will reply to you shortly!";
      } else {
        const aiService = require('../services/ai.service');
        reply = await aiService.processChatMessage(prisma, bot, updated, message);
      }

      // Save Bot response
      const botMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "BOT",
          content: reply
        }
      });

      if (io) {
        io.to(bot.organizationId).emit("message_sent", {
          session: updated,
          message: botMsg
        });
      }

      return res.status(200).json({
        success: true,
        reply,
        sessionId: visitorPlatformId
      });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Fetch all active team member Agent accounts for Organization
   */
  async listAgents(req, res) {
    const { organizationId } = req.user;
    try {
      const agents = await prisma.user.findMany({
        where: { organizationId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
      });
      return res.status(200).json({ success: true, agents });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Create and record a new team Agent seat in SQLite
   */
  async createAgent(req, res) {
    const { organizationId } = req.user;
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: "Please fill out all required fields." });
    }

    try {
      const bcrypt = require('bcryptjs');
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, error: "User already exists with this email." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAgent = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || "AGENT",
          organizationId
        }
      });

      return res.status(201).json({
        success: true,
        agent: {
          id: newAgent.id,
          email: newAgent.email,
          firstName: newAgent.firstName,
          lastName: newAgent.lastName,
          role: newAgent.role
        }
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Dispatch dynamic mass marketing broadcast to contacts matching selected label
   */
  async executeMassBroadcast(req, res) {
    const { organizationId } = req.user;
    const { label, content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: "Broadcast content cannot be blank." });
    }

    try {
      const targetConversations = await prisma.inboxConversation.findMany({
        where: {
          organizationId,
          label: label || undefined,
          status: { not: "CLOSED" }
        },
        include: { channel: true, contact: true }
      });

      const sentMessages = [];

      for (const conv of targetConversations) {
        const broadcastMsg = await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderType: "BOT",
            content: content
          }
        });

        if (io) {
          io.to(organizationId).emit("message_sent", {
            session: {
              ...conv,
              assignedUser: null,
              contact: conv.contact,
              channel: conv.channel
            },
            message: broadcastMsg
          });
        }

        try {
          await metaService.sendTextMessage(conv.channel, conv.contact.platformId, content);
        } catch (metaErr) {
          console.warn(`Simulated broadcast delivery ignored for ${conv.contact.platformId}:`, metaErr.message);
        }

        sentMessages.push(broadcastMsg);
      }

      return res.status(200).json({
        success: true,
        message: `Mass broadcast successfully triggered for ${sentMessages.length} contacts!`,
        sentCount: sentMessages.length
      });
    } catch (e) {
      console.error("Broadcast failed:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Fetch all broadcast campaigns for organization
   */
  async getBroadcastCampaigns(req, res) {
    const { organizationId } = req.user;
    try {
      const campaigns = await prisma.broadcastCampaign.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        include: { contactList: true }
      });
      return res.status(200).json({ success: true, campaigns });
    } catch (e) {
      console.error("Failed to fetch campaigns:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Create a new broadcast campaign
   */
  async createBroadcastCampaign(req, res) {
    const { organizationId } = req.user;
    const { name, label, contactListId, content, scheduledFor } = req.body;

    if (!name || !content) {
      return res.status(400).json({ success: false, error: "Campaign name and message content are required." });
    }

    try {
      // Calculate target contacts count
      let targetCount = 0;
      if (contactListId) {
        const list = await prisma.contactList.findUnique({
          where: { id: contactListId },
          include: { _count: { select: { contacts: true } } }
        });
        if (list) targetCount = list._count.contacts;
      } else if (label) {
        targetCount = await prisma.contact.count({
          where: {
            organizationId,
            conversations: {
              some: {
                label,
                status: { not: 'CLOSED' }
              }
            }
          }
        });
      } else {
        targetCount = await prisma.contact.count({
          where: { organizationId }
        });
      }

      const status = scheduledFor ? "PENDING" : "PROCESSING";
      const parsedSchedule = scheduledFor ? new Date(scheduledFor) : null;

      const campaign = await prisma.broadcastCampaign.create({
        data: {
          name,
          organizationId,
          label: label || null,
          contactListId: contactListId || null,
          content,
          status,
          totalCount: targetCount,
          scheduledFor: parsedSchedule
        },
        include: { contactList: true }
      });

      return res.status(201).json({ success: true, campaign });
    } catch (e) {
      console.error("Failed to create campaign:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Stop/pause an active campaign
   */
  async stopBroadcastCampaign(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;

    try {
      const campaign = await prisma.broadcastCampaign.findFirst({
        where: { id, organizationId }
      });

      if (!campaign) {
        return res.status(404).json({ success: false, error: "Campaign not found." });
      }

      const updated = await prisma.broadcastCampaign.update({
        where: { id },
        data: { status: "PAUSED" }
      });

      if (io) {
        io.to(organizationId).emit("campaign_status_updated", {
          campaignId: id,
          status: "PAUSED"
        });
      }

      return res.status(200).json({ success: true, campaign: updated });
    } catch (e) {
      console.error("Failed to pause campaign:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Retry failed dispatches in a campaign
   */
  async retryFailedDispatches(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;

    try {
      const campaign = await prisma.broadcastCampaign.findFirst({
        where: { id, organizationId }
      });

      if (!campaign) {
        return res.status(404).json({ success: false, error: "Campaign not found." });
      }

      // Delete failed logs so background worker can re-process them
      const deleteResult = await prisma.broadcastLog.deleteMany({
        where: { campaignId: id, status: "FAILED" }
      });

      // Reset error count and transition campaign back to PROCESSING
      const updated = await prisma.broadcastCampaign.update({
        where: { id },
        data: {
          status: "PROCESSING",
          errorCount: { decrement: deleteResult.count >= 0 ? deleteResult.count : 0 }
        }
      });

      if (io) {
        io.to(organizationId).emit("campaign_status_updated", {
          campaignId: id,
          status: "PROCESSING"
        });
      }

      return res.status(200).json({ success: true, campaign: updated, retriedCount: deleteResult.count });
    } catch (e) {
      console.error("Failed to retry campaign:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Get detailed campaign logs
   */
  async getCampaignLogs(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;

    try {
      const campaign = await prisma.broadcastCampaign.findFirst({
        where: { id, organizationId }
      });

      if (!campaign) {
        return res.status(404).json({ success: false, error: "Campaign not found." });
      }

      const logs = await prisma.broadcastLog.findMany({
        where: { campaignId: id },
        include: { contact: true },
        orderBy: { sentAt: 'desc' }
      });

      return res.status(200).json({ success: true, logs });
    } catch (e) {
      console.error("Failed to fetch logs:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Get custom contact lists
   */
  async getContactLists(req, res) {
    const { organizationId } = req.user;
    try {
      const contactLists = await prisma.contactList.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        include: { contacts: true }
      });
      return res.status(200).json({ success: true, contactLists });
    } catch (e) {
      console.error("Failed to fetch contact lists:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Create custom contact list
   */
  async createContactList(req, res) {
    const { organizationId } = req.user;
    const { name, contactIds } = req.body;

    if (!name || !contactIds || !Array.isArray(contactIds)) {
      return res.status(400).json({ success: false, error: "List name and contact IDs are required." });
    }

    try {
      const list = await prisma.contactList.create({
        data: {
          name,
          organizationId,
          contacts: {
            connect: contactIds.map(id => ({ id }))
          }
        },
        include: { contacts: true }
      });
      return res.status(201).json({ success: true, contactList: list });
    } catch (e) {
      console.error("Failed to create list:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Delete contact list
   */
  async deleteContactList(req, res) {
    const { organizationId } = req.user;
    const { id } = req.params;

    try {
      const list = await prisma.contactList.findFirst({
        where: { id, organizationId }
      });

      if (!list) {
        return res.status(404).json({ success: false, error: "Contact list not found." });
      }

      await prisma.contactList.delete({
        where: { id }
      });

      return res.status(200).json({ success: true, message: "Contact list deleted successfully." });
    } catch (e) {
      console.error("Failed to delete list:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Search catalog products from Lalelilo's live Supabase catalog.
   */
  async searchCatalogProducts(req, res) {
    const { id } = req.params;
    const { query } = req.query;
    const { organizationId } = req.user;

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { bot: true, contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      const cartService = require('../services/ecommerce');
      const products = await cartService.searchProducts(prisma, conversation.bot, query || "");
      
      return res.status(200).json({ success: true, products });
    } catch (error) {
      console.error("Failed to search catalog products:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Add or edit an item manually to the customer's cart.
   */
  async addManualCartItem(req, res) {
    const { id } = req.params;
    const { productId, quantity, size, color } = req.body;
    const { organizationId } = req.user;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Product ID is required." });
    }

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { bot: true, contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      const cartService = require('../services/ecommerce');
      const qty = parseInt(quantity || 1);
      
      const cartItems = await cartService.addToCart(
        prisma,
        conversation,
        productId,
        qty,
        conversation.bot,
        size || null,
        color || null
      );

      // Emit socket update to notify the dashboard of real-time cart additions
      if (io) {
        io.to(organizationId).emit("session_updated", { session: conversation });
      }

      return res.status(200).json({ success: true, cartItems });
    } catch (error) {
      console.error("Failed to add manual cart item:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Remove a product variant manually from the customer's cart.
   */
  async removeManualCartItem(req, res) {
    const { id, productId } = req.params;
    const { organizationId } = req.user;

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      const cartService = require('../services/ecommerce');
      const cartItems = await cartService.removeFromCart(prisma, conversation, productId);

      // Emit socket update to notify dashboard in real time
      if (io) {
        io.to(organizationId).emit("session_updated", { session: conversation });
      }

      return res.status(200).json({ success: true, cartItems });
    } catch (error) {
      console.error("Failed to remove manual cart item:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Apply a custom manual discount (flat currency or percentage) to the contact's metadata.
   */
  async applyManualDiscount(req, res) {
    const { id } = req.params;
    const { discountType, discountValue } = req.body; // 'fixed' | 'percentage', and number
    const { organizationId } = req.user;

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      let meta = {};
      if (conversation.contact.metadata) {
        try {
          meta = JSON.parse(conversation.contact.metadata);
        } catch (e) {
          meta = {};
        }
      }

      // Store discount values inside Contact metadata
      if (discountType === 'percentage' || discountType === 'fixed') {
        meta.appliedDiscountType = discountType;
        meta.appliedDiscountValue = Number(discountValue || 0);
      } else {
        delete meta.appliedDiscountType;
        delete meta.appliedDiscountValue;
      }

      await prisma.contact.update({
        where: { id: conversation.contactId },
        data: { metadata: JSON.stringify(meta) }
      });

      // Emit socket update to sync dashboard total
      if (io) {
        io.to(organizationId).emit("session_updated", { session: conversation });
      }

      return res.status(200).json({ 
        success: true, 
        message: "Discount applied successfully.",
        discountType: meta.appliedDiscountType || null,
        discountValue: meta.appliedDiscountValue || 0
      });
    } catch (error) {
      console.error("Failed to apply manual discount:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Format the current cart summary (with any discounts applied) and send as a message to Meta.
   */
  async sendCartSummary(req, res) {
    const { id } = req.params;
    const { organizationId } = req.user;

    try {
      const conversation = await prisma.inboxConversation.findFirst({
        where: { id, organizationId },
        include: { channel: true, contact: true }
      });

      if (!conversation) {
        return res.status(404).json({ success: false, error: "Conversation thread not found." });
      }

      const cartItems = await prisma.cartItem.findMany({
        where: { conversationId: id }
      });

      if (cartItems.length === 0) {
        return res.status(400).json({ success: false, error: "Cart is empty. Cannot send summary." });
      }

      // Load discount and shop ID from metadata
      let shopName = "nossa loja";
      let discount = 0;
      let discountType = null;
      let discountValue = 0;

      if (conversation.contact.metadata) {
        try {
          const meta = JSON.parse(conversation.contact.metadata);
          discountType = meta.appliedDiscountType || null;
          discountValue = Number(meta.appliedDiscountValue || 0);

          if (meta.assignedShopId) {
            const { getShops } = require('../services/ecommerce');
            const shops = await getShops();
            const shop = shops.find(s => s.id === meta.assignedShopId);
            if (shop) shopName = shop.name;
          }
        } catch (e) {
          console.warn("[SendCartSummary] Metadata parse failed:", e.message);
        }
      }

      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const roundedSubtotal = Math.round(subtotal * 100) / 100;

      if (discountType === 'percentage' && discountValue > 0) {
        discount = Math.round((roundedSubtotal * (discountValue / 100)) * 100) / 100;
      } else if (discountType === 'fixed' && discountValue > 0) {
        discount = Math.min(discountValue, roundedSubtotal);
      }
      
      const finalTotal = Math.max(0, Math.round((roundedSubtotal - discount) * 100) / 100);

      // Build friendly message summary
      let msg = `Olá! Montei um carrinho super especial para você na *${shopName}*! 😍\n\n`;
      msg += `🛍️ *Sua sacola de compras:*\n`;
      
      cartItems.forEach((item, index) => {
        msg += `${index + 1}️⃣ *${item.name}*\n   Qtd: ${item.quantity} · Preço: R$ ${item.price.toFixed(2).replace('.', ',')} (Subtotal: R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')})\n`;
      });

      msg += `\n💵 *Resumo dos Valores:*\n`;
      msg += `• Subtotal: R$ ${roundedSubtotal.toFixed(2).replace('.', ',')}\n`;
      
      if (discount > 0) {
        const discountDesc = discountType === 'percentage' ? ` (${discountValue}%)` : '';
        msg += `• Desconto Especial${discountDesc}: - R$ ${discount.toFixed(2).replace('.', ',')}\n`;
      }
      
      msg += `\n💰 *Total final: R$ ${finalTotal.toFixed(2).replace('.', ',')}*\n\n`;
      msg += `Você confirma esses itens para iniciarmos o fechamento de pagamento? 😊`;

      // Send via Meta API
      try {
        await metaService.sendTextMessage(conversation.channel, conversation.contact.platformId, msg);
      } catch (err) {
        console.error("[SendCartSummary] Meta transmission failure:", err.message);
        return res.status(502).json({ success: false, error: `Transmission failed: ${err.message}` });
      }

      const operator = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { firstName: true, lastName: true }
      });
      const operatorName = operator ? `${operator.firstName} ${operator.lastName}` : "Atendente";

      // Save as Agent message
      const agentMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: "AGENT",
          content: msg,
          metadata: JSON.stringify({ senderName: operatorName, isCartSummary: true })
        }
      });

      // Update conversation
      const updated = await prisma.inboxConversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        }
      });

      if (io) {
        io.to(organizationId).emit("message_sent", { session: updated, message: agentMessage });
      }

      return res.status(200).json({ success: true, message: agentMessage });

    } catch (error) {
      console.error("Failed to send cart summary:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
};


