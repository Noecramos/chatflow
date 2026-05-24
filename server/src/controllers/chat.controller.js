/**
 * Chat Controller: Manages live chat operations in the Omnichannel Inbox
 * Handles assignment, labels, handover state toggling, and manual agent messages.
 */
const prisma = require('../db');
const metaService = require('../services/meta.service');

// Ref to socket dispatcher
let io = null;
function setSocketIO(socketInstance) {
  io = socketInstance;
}

module.exports = {
  setSocketIO,

  /**
   * Fetch active conversation sessions for the Tenant
   */
  async getSessions(req, res) {
    const { tenantId } = req.user; // Injected by Auth middleware

    try {
      const sessions = await prisma.session.findMany({
        where: { tenantId },
        include: {
          channel: { select: { type: true } },
          bot: { select: { name: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { lastMessageAt: 'desc' }
      });

      return res.status(200).json({ success: true, sessions });
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Fetch complete message history for a specific conversation session
   */
  async getSessionMessages(req, res) {
    const { sessionId } = req.params;
    const { tenantId } = req.user;

    try {
      // Validate ownership
      const session = await prisma.session.findFirst({
        where: { id: sessionId, tenantId }
      });

      if (!session) {
        return res.status(404).json({ success: false, error: "Session not found." });
      }

      const messages = await prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' }
      });

      return res.status(200).json({ success: true, messages, cart: JSON.parse(session.cart || "[]") });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Assign a conversation session to an Agent/User
   */
  async assignSession(req, res) {
    const { sessionId } = req.params;
    const { userId } = req.body;
    const { tenantId } = req.user;

    try {
      const updatedSession = await prisma.session.update({
        where: { id: sessionId, tenantId },
        data: { assignedUserId: userId || null },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } }
      });

      // Broadcast update
      if (io) {
        io.to(tenantId).emit("session_updated", { session: updatedSession });
      }

      return res.status(200).json({ success: true, session: updatedSession });
    } catch (error) {
      console.error("Failed to assign session:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Toggle AI/Human Handover state
   */
  async toggleHandover(req, res) {
    const { sessionId } = req.params;
    const { isHumanHandoverActive } = req.body; // boolean
    const { tenantId } = req.user;

    try {
      const updatedSession = await prisma.session.update({
        where: { id: sessionId, tenantId },
        data: { isHumanHandoverActive },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } }
      });

      // Insert system note record
      const noteContent = isHumanHandoverActive 
        ? "AI muted. Conversation assumed by Human Agent." 
        : "AI reactivated. Conversation returned to Bot.";

      const systemMessage = await prisma.message.create({
        data: {
          sessionId: sessionId,
          senderType: "SYSTEM",
          content: noteContent
        }
      });

      // Broadcast update
      if (io) {
        io.to(tenantId).emit("session_updated", { session: updatedSession });
        io.to(tenantId).emit("message_received", { session: updatedSession, message: systemMessage });
      }

      return res.status(200).json({ success: true, session: updatedSession, systemMessage });
    } catch (error) {
      console.error("Failed to toggle handover:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Edit conversation metadata labels & internal notes
   */
  async updateSessionMetadata(req, res) {
    const { sessionId } = req.params;
    const { label, notes } = req.body;
    const { tenantId } = req.user;

    try {
      const updatedSession = await prisma.session.update({
        where: { id: sessionId, tenantId },
        data: {
          label: label !== undefined ? label : undefined,
          notes: notes !== undefined ? notes : undefined
        },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } }
      });

      if (io) {
        io.to(tenantId).emit("session_updated", { session: updatedSession });
      }

      return res.status(200).json({ success: true, session: updatedSession });
    } catch (error) {
      console.error("Failed to update session metadata:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Manual message dispatcher: Send replies from agent UI via Meta APIs
   */
  async sendManualReply(req, res) {
    const { sessionId } = req.params;
    const { content } = req.body;
    const { tenantId } = req.user;

    if (!content) {
      return res.status(400).json({ success: false, error: "Message content cannot be blank." });
    }

    try {
      // Find session and include active channel
      const session = await prisma.session.findFirst({
        where: { id: sessionId, tenantId },
        include: { channel: true }
      });

      if (!session) {
        return res.status(404).json({ success: false, error: "Active session not found." });
      }

      // 1. Send the message via Meta APIs (WhatsApp, IG, FB, etc.)
      try {
        await metaService.sendTextMessage(session.channel, session.externalId, content);
      } catch (metaErr) {
        console.error("Meta API transmission failed:", metaErr.message);
        return res.status(502).json({ success: false, error: `Transmission failed: ${metaErr.message}` });
      }

      // 2. Save Agent message in Database
      const agentMessage = await prisma.message.create({
        data: {
          sessionId: sessionId,
          senderType: "AGENT",
          content: content
        }
      });

      // 3. Update session timestamps
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
        include: { assignedUser: { select: { id: true, firstName: true, lastName: true } } }
      });

      // 4. WebSocket sync for instant updates in other active agent tabs
      if (io) {
        io.to(tenantId).emit("message_sent", { session: updatedSession, message: agentMessage });
      }

      return res.status(200).json({ success: true, message: agentMessage });
    } catch (error) {
      console.error("Failed to dispatch manual agent message:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Public Web Widget & SDK API: Lets external projects interact programmatically or via HTML bubbles
   */
  async handleWidgetMessage(req, res) {
    const { botId, message, sessionId } = req.body;

    if (!botId || !message) {
      return res.status(400).json({ success: false, error: "botId and message are required." });
    }

    try {
      // Find Bot and active channel
      const bot = await prisma.bot.findUnique({
        where: { id: botId },
        include: { channels: true }
      });

      if (!bot) {
        return res.status(404).json({ success: false, error: "Bot not found." });
      }

      // Find or create widget channel integration for this bot
      let channel = await prisma.channel.findFirst({
        where: { botId: bot.id, type: "WIDGET", isActive: true }
      });

      if (!channel) {
        channel = await prisma.channel.create({
          data: {
            tenantId: bot.tenantId,
            botId: bot.id,
            type: "WIDGET",
            isActive: true
          }
        });
      }

      // Find or create customer session
      const targetSessionId = sessionId || `widget-session-${Date.now()}`;
      let session = await prisma.session.findFirst({
        where: { channelId: channel.id, externalId: targetSessionId }
      });

      if (!session) {
        session = await prisma.session.create({
          data: {
            tenantId: bot.tenantId,
            channelId: channel.id,
            botId: bot.id,
            externalId: targetSessionId,
            status: "OPEN"
          }
        });

        // Greeting
        if (bot.greetingMessage) {
          await prisma.message.create({
            data: {
              sessionId: session.id,
              senderType: "BOT",
              content: bot.greetingMessage
            }
          });
        }
      }

      // Save User message
      await prisma.message.create({
        data: {
          sessionId: session.id,
          senderType: "USER",
          content: message
        }
      });

      // Update session active time
      await prisma.session.update({
        where: { id: session.id },
        data: { lastMessageAt: new Date() }
      });

      // Broadcast new user message to live admin inbox via socket
      if (io) {
        io.to(bot.tenantId).emit("message_received", {
          session: { ...session, lastMessageAt: new Date(), channel, bot },
          message: { senderType: "USER", content: message, createdAt: new Date() }
        });
      }

      // AI response RAG + E-commerce
      let reply = "";
      if (session.isHumanHandoverActive) {
        reply = "Our live support agents have assumed this thread. A human representative will reply to you shortly!";
      } else {
        const aiService = require('../services/ai.service');
        reply = await aiService.processChatMessage(prisma, bot, session, message);
      }

      // Save Bot response
      const botMsg = await prisma.message.create({
        data: {
          sessionId: session.id,
          senderType: "BOT",
          content: reply
        }
      });

      // Broadcast bot reply to dashboard in real-time
      if (io) {
        io.to(bot.tenantId).emit("message_sent", {
          session: { ...session, lastMessageAt: new Date(), channel, bot },
          message: botMsg
        });
      }

      return res.status(200).json({
        success: true,
        reply: reply,
        sessionId: targetSessionId
      });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  }
};

