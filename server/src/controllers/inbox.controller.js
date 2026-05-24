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
   * Fetch active conversation list for the Organization
   */
  async getConversations(req, res) {
    const { organizationId } = req.user;
    const { status, label } = req.query;

    try {
      const conversations = await prisma.inboxConversation.findMany({
        where: {
          organizationId,
          status: status || undefined,
          label: label || undefined
        },
        include: {
          contact: true,
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return res.status(200).json({ success: true, conversations });
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

      const noteText = isHumanHandoverActive 
        ? "AI muted. Agent in control." 
        : "AI re-activated. Bot in control.";

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

      return res.status(200).json({ success: true, conversation: updated, systemMessage });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Update properties (labels & notes)
   */
  async updateProperties(req, res) {
    const { id } = req.params;
    const { label, notes } = req.body;
    const { organizationId } = req.user;

    try {
      const updated = await prisma.inboxConversation.update({
        where: { id, organizationId },
        data: {
          label: label !== undefined ? label : undefined,
          notes: notes !== undefined ? notes : undefined
        },
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

      // Save Message
      const agentMessage = await prisma.message.create({
        data: {
          conversationId: id,
          senderType: "AGENT",
          content: content
        }
      });

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
  }
};


