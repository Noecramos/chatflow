/**
 * Admin Controller: Handles Master Admin System Operations
 * Provides subscriber management, plan modification, and system-wide database resets.
 */
const prisma = require('../db');

module.exports = {
  /**
   * List all subscribers (Organizations) and their resource usage
   */
  async listSubscribers(req, res) {
    try {
      // Fetch all organizations, including their owner users, bots, and channels
      const subscribers = await prisma.organization.findMany({
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              passwordResetRequested: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              bots: true,
              channels: true,
              conversations: true,
              contacts: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return res.status(200).json({
        success: true,
        subscribers: subscribers.map(org => {
          const owner = org.users.find(u => u.role === 'OWNER') || org.users[0] || null;
          return {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            maxBots: org.maxBots,
            maxMessagesPerMonth: org.maxMessagesPerMonth,
            apiUsageThisMonth: org.apiUsageThisMonth,
            createdAt: org.createdAt,
            ownerEmail: owner ? owner.email : 'N/A',
            ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'N/A',
            passwordResetRequested: org.users.some(u => u.passwordResetRequested),
            botsCount: org._count.bots,
            channelsCount: org._count.channels,
            conversationsCount: org._count.conversations,
            contactsCount: org._count.contacts
          };
        })
      });
    } catch (error) {
      console.error("[Admin Controller] Error listing subscribers:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Update a subscriber's plan and resource limits
   */
  async updateSubscriberLimits(req, res) {
    const { id } = req.params;
    const { plan, maxBots, maxMessagesPerMonth, apiUsageThisMonth } = req.body;

    try {
      const org = await prisma.organization.findUnique({ where: { id } });
      if (!org) {
        return res.status(404).json({ success: false, error: "Subscriber not found." });
      }

      const updatedOrg = await prisma.organization.update({
        where: { id },
        data: {
          plan: plan !== undefined ? plan : org.plan,
          maxBots: maxBots !== undefined ? parseInt(maxBots) : org.maxBots,
          maxMessagesPerMonth: maxMessagesPerMonth !== undefined ? parseInt(maxMessagesPerMonth) : org.maxMessagesPerMonth,
          apiUsageThisMonth: apiUsageThisMonth !== undefined ? parseInt(apiUsageThisMonth) : org.apiUsageThisMonth
        }
      });

      return res.status(200).json({
        success: true,
        message: "Subscriber limits updated successfully.",
        organization: updatedOrg
      });
    } catch (error) {
      console.error("[Admin Controller] Error updating limits:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Super Admin: Randomly generate a new password for a subscriber's owner account
   */
  async resetSubscriberPassword(req, res) {
    const { id } = req.params;
    const bcrypt = require('bcryptjs');

    try {
      // Find the organization along with its users
      const org = await prisma.organization.findUnique({
        where: { id },
        include: { users: true }
      });

      if (!org) {
        return res.status(404).json({ success: false, error: "Subscriber not found." });
      }

      // Find the OWNER role user first, or fall back to the first user
      const owner = org.users.find(u => u.role === 'OWNER') || org.users[0];
      if (!owner) {
        return res.status(404).json({ success: false, error: "No user found associated with this subscriber." });
      }

      // Generate a highly secure, easy-to-read temporary password
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let tempPassword = "";
      for (let i = 0; i < 10; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Hash the temporary password
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update the user record: set new password and clear the reset request flag
      await prisma.user.update({
        where: { id: owner.id },
        data: {
          password: hashedPassword,
          passwordResetRequested: false
        }
      });

      return res.status(200).json({
        success: true,
        message: "Senha provisória gerada com sucesso.",
        newPassword: tempPassword,
        ownerEmail: owner.email,
        ownerName: `${owner.firstName} ${owner.lastName}`
      });
    } catch (error) {
      console.error("[Admin Controller] Error resetting password:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Delete a subscriber (Organization) and all its cascaded child data
   */
  async deleteSubscriber(req, res) {
    const { id } = req.params;

    try {
      const org = await prisma.organization.findUnique({ where: { id } });
      if (!org) {
        return res.status(404).json({ success: false, error: "Subscriber not found." });
      }

      // Deleting organization cascades and deletes all bots, channels, users, etc.
      await prisma.organization.delete({ where: { id } });

      return res.status(200).json({
        success: true,
        message: "Subscriber and all associated data deleted successfully."
      });
    } catch (error) {
      console.error("[Admin Controller] Error deleting subscriber:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Global system-wide reset (Excludes all registered organizations/users)
   */
  async systemReset(req, res) {
    try {
      console.log("[Admin System Reset] Executing full wipe...");
      
      const userResult = await prisma.user.deleteMany({});
      const orgResult = await prisma.organization.deleteMany({});

      // Re-seed Master Admin immediately so they are never locked out from the session/subsequent log ins
      const bcrypt = require('bcryptjs');
      const adminEmail = 'admin@chatflow.com';
      const adminPassword = process.env.MASTER_ADMIN_PASSWORD || 'admin123456';

      const adminOrg = await prisma.organization.create({
        data: {
          name: "System Administration",
          slug: "system-admin",
          plan: "ENTERPRISE",
          maxBots: 999,
          maxMessagesPerMonth: 999999
        }
      });

      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          firstName: "System",
          lastName: "Admin",
          role: "SUPERADMIN",
          organizationId: adminOrg.id
        }
      });

      return res.status(200).json({
        success: true,
        message: "System database fully reset. All subscribers and users have been excluded, and default Master Admin re-seeded.",
        deleted: {
          users: userResult.count,
          organizations: orgResult.count
        }
      });
    } catch (error) {
      console.error("[Admin System Reset] Error executing full reset:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error during system reset." });
    }
  }
};
