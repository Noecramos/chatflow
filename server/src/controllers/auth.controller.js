/**
 * Auth Controller: Handles User Authentication and Tenant Management
 * Implements JWT authentication, multi-tenant isolation, and resource usage verification.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'chatflow-super-secret-key-change-in-production';

module.exports = {
  /**
   * Organization Sign Up (Registration)
   */
  async register(req, res) {
    const { email, password, firstName, lastName, organizationName } = req.body;

    if (!email || !password || !firstName || !lastName || !organizationName) {
      return res.status(400).json({ success: false, error: "Please fill out all fields." });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ success: false, error: "User already exists with this email." });
      }

      // Generate organization slug
      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Check slug uniqueness
      let orgSlug = slug;
      let counter = 1;
      while (await prisma.organization.findUnique({ where: { slug: orgSlug } })) {
        orgSlug = `${slug}-${counter}`;
        counter++;
      }

      // Create Organization and Owner
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug: orgSlug,
            plan: "FREE",
            maxBots: 2,
            maxMessagesPerMonth: 1000
          }
        });

        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: "OWNER",
            organizationId: organization.id
          }
        });

        // Initialize default sandbox bot
        await tx.bot.create({
          data: {
            organizationId: organization.id,
            name: "Agente IA",
            systemPrompt: "Você é o Agente IA, um assistente virtual inteligente. Você ajuda os clientes tirando dúvidas, dando suporte e fornecendo informações sobre a empresa de forma prestativa e profissional.",
            greetingMessage: "Olá! Seja bem-vindo. Como posso te ajudar hoje?"
          }
        });

        return { organization, user };
      });

      // Generate login token
      const token = jwt.sign(
        { userId: result.user.id, organizationId: result.organization.id, role: result.user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role
        },
        organization: result.organization
      });

    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * User Sign In (Login)
   */
  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, error: "Invalid email or password." });
      }

      const token = jwt.sign(
        { userId: user.id, organizationId: user.organizationId, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        organization: user.organization
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Get Active Logged-In User Profile Details
   */
  async getProfile(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: { organization: true }
      });

      if (!user) {
        return res.status(404).json({ success: false, error: "User not found." });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isImpersonated: req.user.isImpersonated || false,
          originalOrganizationId: req.user.originalOrganizationId || null
        },
        organization: user.organization,
        isImpersonated: req.user.isImpersonated || false,
        originalOrganizationId: req.user.originalOrganizationId || null
      });
    } catch (error) {
      console.error("Get Profile error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Database Reset / Clear Users and Organizations
   */
  async clearDb(req, res) {
    const { secret } = req.query;
    const expectedSecret = process.env.JWT_SECRET || 'chatvolt-super-secret-key-change-in-production';
    
    if (secret !== expectedSecret) {
      return res.status(403).json({ success: false, error: "Unauthorized reset request." });
    }

    try {
      console.log("[DB Reset] Starting deletion of registered users, organizations, and all cascaded data...");
      
      const userResult = await prisma.user.deleteMany({});
      const orgResult = await prisma.organization.deleteMany({});
      
      console.log(`[DB Reset] Successfully deleted ${userResult.count} users and ${orgResult.count} organizations.`);
      
      return res.status(200).json({
        success: true,
        message: "Database cleaned successfully. All users and organizations have been excluded.",
        deleted: {
          users: userResult.count,
          organizations: orgResult.count
        }
      });
    } catch (error) {
      console.error("[DB Reset] Error during database cleanup:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error during database cleanup." });
    }
  },

  /**
   * Super Admin: List all organizations in ChatFlow
   */
  async listOrganizations(req, res) {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: "Access Denied. Super Admin authorization required." });
    }

    try {
      const orgs = await prisma.organization.findMany({
        include: {
          _count: {
            select: {
              bots: true,
              users: true,
              channels: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json({ success: true, organizations: orgs });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Super Admin: Update organization limits and plan details
   */
  async updateOrganization(req, res) {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: "Access Denied. Super Admin authorization required." });
    }

    const { id } = req.params;
    const { name, plan, maxBots, maxMessagesPerMonth } = req.body;

    try {
      const updated = await prisma.organization.update({
        where: { id },
        data: {
          name,
          plan: plan || undefined,
          maxBots: maxBots !== undefined ? parseInt(maxBots) : undefined,
          maxMessagesPerMonth: maxMessagesPerMonth !== undefined ? parseInt(maxMessagesPerMonth) : undefined
        }
      });
      return res.status(200).json({ success: true, organization: updated });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: "Failed to update organization details." });
    }
  },

  /**
   * Super Admin: Impersonate/Switch to a client organization dashboard
   */
  async switchTenant(req, res) {
    const { targetOrganizationId } = req.body;
    const currentUser = req.user;

    if (currentUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: "Access Denied. Super Admin authorization required." });
    }

    try {
      const targetOrg = await prisma.organization.findUnique({
        where: { id: targetOrganizationId }
      });

      if (!targetOrg) {
        return res.status(404).json({ success: false, error: "Target organization not found." });
      }

      // Generate a new impersonated JWT token
      const isReturning = currentUser.originalOrganizationId && targetOrganizationId === currentUser.originalOrganizationId;
      const token = jwt.sign(
        {
          userId: currentUser.userId,
          organizationId: targetOrganizationId,
          role: "SUPER_ADMIN", // Preserves master admin role
          isImpersonated: !isReturning,
          originalOrganizationId: isReturning ? null : (currentUser.originalOrganizationId || currentUser.organizationId)
        },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({ success: true, token, organization: targetOrg });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: "Impersonation request failed." });
    }
  },

  /**
   * Helper Middleware to Verify Tenant Limits (Usage Limits per Organization)
   */
  async checkTenantLimits(req, res, next) {
    const { organizationId } = req.user;

    try {
      const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ success: false, error: "Organization not found." });
      }

      if (organization.apiUsageThisMonth >= organization.maxMessagesPerMonth) {
        return res.status(403).json({
          success: false,
          error: "Your organization has reached the monthly message usage limit. Please upgrade your plan."
        });
      }

      next();
    } catch (error) {
      console.error("Check limits error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  }
};
