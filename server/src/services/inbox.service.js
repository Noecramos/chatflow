const prisma = require('../db');

class InboxService {
  constructor() {
    this.io = null;
  }

  setSocketIO(socketInstance) {
    this.io = socketInstance;
  }

  /**
   * Single canonical entry point for creating and broadcasting messages.
   * Saves message to DB, updates conversation metadata, and emits real-time sockets.
   */
  async createAndEmitMessage({
    conversationId,
    organizationId,
    senderType = 'USER', // USER | AGENT | BOT | SYSTEM
    senderId = null,
    content,
    mediaUrl = null,
    metadata = null,
    io = null
  }) {
    const socketServer = io || this.io;

    // 1. Create message record in DB
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderType,
        senderId,
        content,
        mediaUrl,
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
      }
    });

    // 2. Update parent conversation metadata
    const isIncomingUser = senderType === 'USER';
    const conversation = await prisma.inboxConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        ...(isIncomingUser ? { isRead: false } : {})
      },
      include: {
        contact: true,
        channel: { select: { type: true } },
        bot: { select: { name: true } },
        assignedUser: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // 3. Emit real-time WebSocket events
    if (socketServer) {
      const roomName = `conversation:${conversationId}`;
      const orgRoomName = `org:${organizationId}`;

      const payload = {
        message,
        conversationId,
        organizationId
      };

      // Emit to specific conversation room (both standardized 'conversation:id' and raw 'id')
      socketServer.to(roomName).emit('new_message', payload);
      socketServer.to(conversationId).emit('new_message', payload);

      // Emit to organization sidebar channel (both standardized 'org:id' and raw 'id')
      const sidebarPayload = {
        conversation,
        lastMessage: message
      };
      socketServer.to(orgRoomName).emit('conversation_updated', sidebarPayload);
      socketServer.to(organizationId).emit('conversation_updated', sidebarPayload);

      console.log(`[InboxService] Emitted new_message to ${roomName} and conversation_updated to ${orgRoomName}`);
    }

    return { message, conversation };
  }

  /**
   * Toggle Human Handover state and notify live rooms
   */
  async toggleHandover({ conversationId, organizationId, isHandover, io = null }) {
    const socketServer = io || this.io;

    const conversation = await prisma.inboxConversation.update({
      where: { id: conversationId },
      data: {
        isHumanHandoverActive: isHandover,
        updatedAt: new Date()
      },
      include: {
        contact: true,
        channel: { select: { type: true } }
      }
    });

    if (socketServer) {
      const roomName = `conversation:${conversationId}`;
      const orgRoomName = `org:${organizationId}`;

      const payload = { conversationId, isHumanHandoverActive: isHandover, conversation };

      socketServer.to(roomName).emit('handover_toggled', payload);
      socketServer.to(conversationId).emit('handover_toggled', payload);

      socketServer.to(orgRoomName).emit('conversation_updated', { conversation });
      socketServer.to(organizationId).emit('conversation_updated', { conversation });
    }

    return conversation;
  }
}

const inboxService = new InboxService();
module.exports = inboxService;
