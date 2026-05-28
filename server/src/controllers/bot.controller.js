/**
 * Bot Controller: Handles Bot CRUD, RAG Knowledge indexing, HTTP connectors and Meta channel setups.
 */
const prisma = require('../db');
const ragService = require('../services/rag.service');
const { GoogleGenAI } = require('@google/genai');

module.exports = {
  /**
   * List all Chatbots for Organization
   */
  async listBots(req, res) {
    const { organizationId } = req.user;

    try {
      const bots = await prisma.bot.findMany({
        where: { organizationId },
        include: {
          channels: { select: { type: true, isActive: true } },
          _count: { select: { knowledge: true, actions: true } }
        }
      });
      return res.status(200).json({ success: true, bots });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Create new Bot (enforces Organization plan limits)
   */
  async createBot(req, res) {
    const { organizationId } = req.user;
    const { name, systemPrompt, greetingMessage, temperature, model, accentColor } = req.body;

    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        include: { _count: { select: { bots: true } } }
      });

      if (org._count.bots >= org.maxBots) {
        return res.status(400).json({
          success: false,
          error: `Your organization has reached the limit of ${org.maxBots} bots. Please upgrade your plan.`
        });
      }

      const bot = await prisma.bot.create({
        data: {
          organizationId,
          name: name || "New Agent",
          systemPrompt: systemPrompt || "You are a helpful assistant.",
          greetingMessage: greetingMessage || "Hello! How can I help you?",
          temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
          model: model || "gemini-1.5-flash",
          accentColor: accentColor || "#8a2be2"
        }
      });

      return res.status(201).json({ success: true, bot });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Update existing Bot Configuration settings
   */
  async updateBot(req, res) {
    const { id } = req.params;
    const { organizationId } = req.user;
    const { name, systemPrompt, greetingMessage, temperature, model, accentColor, isAiActive } = req.body;

    try {
      const updated = await prisma.bot.update({
        where: { id, organizationId },
        data: {
          name,
          systemPrompt,
          greetingMessage,
          temperature: temperature !== undefined ? parseFloat(temperature) : undefined,
          model,
          accentColor,
          isAiActive
        }
      });
      return res.status(200).json({ success: true, bot: updated });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: "Bot not found or unauthorized update." });
    }
  },

  /**
   * Delete existing Bot
   */
  async deleteBot(req, res) {
    const { id } = req.params;
    const { organizationId } = req.user;

    try {
      await prisma.bot.delete({
        where: { id, organizationId }
      });
      return res.status(200).json({ success: true, message: "Bot deleted successfully." });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: "Failed to delete bot." });
    }
  },

  /**
   * Index Knowledge Source (Text, Documents)
   */
  async addKnowledge(req, res) {
    const { id } = req.params; // botId
    const { organizationId } = req.user;
    const { sourceName, content } = req.body;

    if (!sourceName || !content) {
      return res.status(400).json({ success: false, error: "sourceName and content are required." });
    }

    try {
      const bot = await prisma.bot.findFirst({ where: { id, organizationId } });
      if (!bot) {
        return res.status(404).json({ success: false, error: "Bot not found." });
      }

      const textChunks = ragService.chunkText(content, 600, 100);
      const geminiKey = process.env.GEMINI_API_KEY;

      const createdChunks = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunkText = textChunks[i];
        let embeddingVector = [];

        if (geminiKey) {
          try {
            const ai = new GoogleGenAI({ apiKey: geminiKey });
            const embed = await ai.models.embedContent({
              model: 'text-embedding-004',
              contents: chunkText,
            });
            if (embed?.embedding?.values) {
              embeddingVector = embed.embedding.values;
            }
          } catch (embedErr) {
            console.warn("RAG Embedding failed. Storing empty vector.", embedErr.message);
          }
        }

        const chunk = await prisma.knowledgeChunk.create({
          data: {
            botId: id,
            sourceName: `${sourceName} (Part ${i + 1})`,
            content: chunkText,
            embedding: JSON.stringify(embeddingVector)
          }
        });
        createdChunks.push(chunk);
      }

      return res.status(201).json({
        success: true,
        message: `Successfully processed knowledge data into ${createdChunks.length} chunks.`,
        chunksCount: createdChunks.length
      });
    } catch (e) {
      console.error("Knowledge upload error:", e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Add secure HTTP Connector / API Action
   */
  async addBotAction(req, res) {
    const { id } = req.params; // botId
    const { organizationId } = req.user;
    const { name, description, url, method, headers, payloadSchema } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, error: "name and url are required." });
    }

    try {
      const bot = await prisma.bot.findFirst({ where: { id, organizationId } });
      if (!bot) {
        return res.status(404).json({ success: false, error: "Bot not found." });
      }

      const action = await prisma.botAction.create({
        data: {
          botId: id,
          name,
          description: description || `Triggers when user requests action: ${name}`,
          url,
          method: method || "POST",
          headers: typeof headers === 'object' ? JSON.stringify(headers) : headers || "{}",
          payloadSchema: typeof payloadSchema === 'object' ? JSON.stringify(payloadSchema) : payloadSchema || "{}"
        }
      });

      return res.status(201).json({ success: true, action });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Save Meta Omnichannel Integration Credentials (WhatsApp, Instagram, FB)
   */
  async saveChannelIntegration(req, res) {
    const { id } = req.params; // botId
    const { organizationId } = req.user;
    const { type, credentials, isActive } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, error: "Integration type is required." });
    }

    try {
      const bot = await prisma.bot.findFirst({ where: { id, organizationId } });
      if (!bot) {
        return res.status(404).json({ success: false, error: "Bot not found." });
      }

      const existing = await prisma.channel.findFirst({
        where: { botId: id, type }
      });

      const crypto = require('../utils/crypto');
      const credsString = typeof credentials === 'object' ? JSON.stringify(credentials) : credentials || "{}";
      const encryptedCreds = crypto.encrypt(credsString, organizationId);

      let channel;
      if (existing) {
        channel = await prisma.channel.update({
          where: { id: existing.id },
          data: {
            credentials: encryptedCreds,
            isActive: isActive !== undefined ? isActive : undefined
          }
        });
      } else {
        channel = await prisma.channel.create({
          data: {
            organizationId,
            botId: id,
            type,
            credentials: encryptedCreds,
            isActive: isActive !== undefined ? isActive : true
          }
        });
      }


      return res.status(200).json({ success: true, channel });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Get Decrypted Channel Integrations for a specific Bot
   */
  async getChannelIntegrations(req, res) {
    const { id } = req.params; // botId
    const { organizationId } = req.user;

    try {
      const bot = await prisma.bot.findFirst({ where: { id, organizationId } });
      if (!bot) {
        return res.status(404).json({ success: false, error: "Bot not found." });
      }

      const channels = await prisma.channel.findMany({
        where: { botId: id }
      });

      const crypto = require('../utils/crypto');

      const integrations = channels.map(chan => {
        let decryptedCreds = {};
        if (chan.credentials) {
          try {
            const decryptedStr = crypto.decrypt(chan.credentials, organizationId);
            decryptedCreds = JSON.parse(decryptedStr);
          } catch (e) {
            console.error(`Failed to decrypt credentials for channel ${chan.id}:`, e.message);
          }
        }

        return {
          id: chan.id,
          type: chan.type,
          provider: chan.provider,
          isActive: chan.isActive,
          credentials: decryptedCreds
        };
      });

      return res.status(200).json({ success: true, integrations });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Encrypt and store Organization settings (Gemini API Key, OpenAI API Key) securely per Organization
   */
  async updateOrganizationSettings(req, res) {
    const { organizationId } = req.user;
    const { geminiKey, openaiKey, name, website, dashboardUrl, description } = req.body;

    try {
      const crypto = require('../utils/crypto');
      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (website !== undefined) updateData.website = website;
      if (dashboardUrl !== undefined) updateData.dashboardUrl = dashboardUrl;
      if (description !== undefined) updateData.description = description;

      if (geminiKey !== undefined) {
        updateData.geminiKey = geminiKey ? crypto.encrypt(geminiKey, organizationId) : null;
      }
      if (openaiKey !== undefined) {
        updateData.openaiKey = openaiKey ? crypto.encrypt(openaiKey, organizationId) : null;
      }

      const updatedOrg = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData
      });

      return res.status(200).json({
        success: true,
        message: "Organization credentials and settings updated successfully.",
        organization: {
          id: updatedOrg.id,
          name: updatedOrg.name,
          slug: updatedOrg.slug,
          plan: updatedOrg.plan,
          website: updatedOrg.website,
          dashboardUrl: updatedOrg.dashboardUrl,
          description: updatedOrg.description,
          geminiKeyConfigured: !!updatedOrg.geminiKey,
          openaiKeyConfigured: !!updatedOrg.openaiKey
        }
      });
    } catch (e) {
      console.error("Failed to update organization settings:", e.message);
      return res.status(500).json({ success: false, error: "Failed to save settings: " + e.message });
    }
  }
};

