const prisma = require('../db');
const metaService = require('./meta.service');

let io = null;
let intervalId = null;

function setSocketIO(socketIO) {
  io = socketIO;
}

async function start() {
  if (intervalId) return;
  console.log('[Broadcast Worker] Campaign scheduler successfully started.');
  intervalId = setInterval(async () => {
    try {
      await checkAndTransitionScheduledCampaigns();
      await processActiveCampaigns();
    } catch (err) {
      console.error('[Broadcast Worker Error]:', err.message);
    }
  }, 5000);
}

/**
 * Find PENDING campaigns that are scheduled for a time in the past
 * and transition them to PROCESSING.
 */
async function checkAndTransitionScheduledCampaigns() {
  const now = new Date();
  const scheduledCampaigns = await prisma.broadcastCampaign.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now }
    }
  });

  for (const campaign of scheduledCampaigns) {
    console.log(`[Broadcast Worker] Scheduled campaign "${campaign.name}" (${campaign.id}) is due. Starting execution.`);
    await prisma.broadcastCampaign.update({
      where: { id: campaign.id },
      data: { status: 'PROCESSING' }
    });
    
    // Notify clients via socket
    if (io) {
      io.to(campaign.organizationId).emit('campaign_status_updated', {
        campaignId: campaign.id,
        status: 'PROCESSING'
      });
    }
  }
}

/**
 * Process campaigns that are currently in PROCESSING status
 */
async function processActiveCampaigns() {
  const activeCampaigns = await prisma.broadcastCampaign.findMany({
    where: { status: 'PROCESSING' }
  });

  for (const campaign of activeCampaigns) {
    const { id: campaignId, organizationId, label, contactListId, content } = campaign;

    // 1. Fetch targeted contacts
    let targetContacts = [];
    if (contactListId) {
      const list = await prisma.contactList.findUnique({
        where: { id: contactListId },
        include: { contacts: true }
      });
      if (list) {
        targetContacts = list.contacts;
      }
    } else if (label) {
      targetContacts = await prisma.contact.findMany({
        where: {
          organizationId,
          conversations: {
            some: {
              label: label,
              status: { not: 'CLOSED' }
            }
          }
        }
      });
    } else {
      // Target all organization contacts
      targetContacts = await prisma.contact.findMany({
        where: { organizationId }
      });
    }

    // 2. Fetch already processed contact IDs for this campaign
    const processedLogs = await prisma.broadcastLog.findMany({
      where: { campaignId },
      select: { contactId: true }
    });
    const processedContactIds = new Set(processedLogs.map(l => l.contactId));

    // 3. Filter out contacts already processed
    const remainingContacts = targetContacts.filter(c => !processedContactIds.has(c.id));

    // 4. Update campaign totalCount if it's 0 or not correct
    if (campaign.totalCount !== targetContacts.length) {
      await prisma.broadcastCampaign.update({
        where: { id: campaignId },
        data: { totalCount: targetContacts.length }
      });
      campaign.totalCount = targetContacts.length;
    }

    // 5. If all processed, complete campaign
    if (remainingContacts.length === 0) {
      console.log(`[Broadcast Worker] Campaign "${campaign.name}" (${campaignId}) completed successfully.`);
      const completed = await prisma.broadcastCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      if (io) {
        io.to(organizationId).emit('campaign_status_updated', {
          campaignId,
          status: 'COMPLETED',
          completedAt: completed.completedAt
        });
      }
      continue;
    }

    // 6. Otherwise, process the next batch (process up to 3 contacts at a time to prevent Meta API throttling)
    const batch = remainingContacts.slice(0, 3);
    console.log(`[Broadcast Worker] Campaign "${campaign.name}" processing batch of ${batch.length} contacts (${remainingContacts.length} remaining).`);

    for (const contact of batch) {
      let logStatus = 'SUCCESS';
      let errorMessage = null;

      try {
        // Find or create an inbox conversation for this contact to log the message
        let activeConv = await prisma.inboxConversation.findFirst({
          where: {
            organizationId,
            contactId: contact.id,
            status: { not: 'CLOSED' }
          },
          include: { channel: true }
        });

        // If no active conversation exists, find any channel matching platformType or default
        if (!activeConv) {
          const channel = await prisma.channel.findFirst({
            where: { organizationId, type: contact.platformType }
          }) || await prisma.channel.findFirst({
            where: { organizationId }
          });

          if (!channel) {
            throw new Error(`No available channel found to dispatch to platform ${contact.platformType}`);
          }

          const bot = await prisma.bot.findFirst({
            where: { organizationId }
          });

          activeConv = await prisma.inboxConversation.create({
            data: {
              organizationId,
              contactId: contact.id,
              channelId: channel.id,
              botId: bot ? bot.id : 'default-bot-id',
              status: 'OPEN',
              label: label || undefined
            },
            include: { channel: true }
          });
        }

        const inboxService = require('./inbox.service');

        // Create the message in database and emit real-time socket events via central inboxService
        const { message: broadcastMsg } = await inboxService.createAndEmitMessage({
          conversationId: activeConv.id,
          organizationId,
          senderType: 'BOT',
          content,
          io
        });

        // Send via Meta API (WhatsApp/Instagram/Messenger/Widget)
        await metaService.sendTextMessage(activeConv.channel, contact.platformId, content);

        // Legacy socket event for backward compatibility
        if (io) {
          io.to(organizationId).emit('message_sent', {
            session: {
              ...activeConv,
              assignedUser: null,
              contact: contact,
              channel: activeConv.channel
            },
            message: broadcastMsg
          });
        }
      } catch (err) {
        logStatus = 'FAILED';
        errorMessage = err.message;
        console.error(`[Broadcast Worker Error] Failed for contact ${contact.name} (${contact.platformId}):`, err.message);
      }

      // Record detailed log
      await prisma.broadcastLog.create({
        data: {
          campaignId,
          contactId: contact.id,
          status: logStatus,
          errorMessage
        }
      });

      // Update progress metrics in database
      const updatedCampaign = await prisma.broadcastCampaign.update({
        where: { id: campaignId },
        data: {
          sentCount: { increment: logStatus === 'SUCCESS' ? 1 : 0 },
          errorCount: { increment: logStatus === 'FAILED' ? 1 : 0 }
        }
      });

      // Emit live progress update via Socket
      if (io) {
        io.to(organizationId).emit('campaign_progress_updated', {
          campaignId,
          sentCount: updatedCampaign.sentCount,
          errorCount: updatedCampaign.errorCount,
          totalCount: updatedCampaign.totalCount
        });
      }
    }
  }
}

module.exports = {
  setSocketIO,
  start
};
