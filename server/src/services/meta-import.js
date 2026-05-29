/**
 * Historical Meta Conversations Importer
 * One-time import of existing IG/FB Messenger conversations from Meta's Conversations API
 * into ChatFlow's InboxConversation + Message tables.
 * 
 * Triggered via: POST /webhooks/import-history (admin-only)
 */
const axios = require('axios');
const prisma = require('../db');
const crypto = require('../utils/crypto');

const PAGE_ID = '112732697526925';
const GRAPH_API = 'https://graph.facebook.com/v21.0';

/**
 * Determine channel type from conversation link pattern
 * Instagram conversations link to /inbox/ under page ID
 * Messenger conversations link to /manager/messages/
 */
function detectChannelType(conv) {
  const link = conv.link || '';
  if (link.includes('/manager/messages/') || link.includes('/t/')) {
    return 'MESSENGER';
  }
  // Default to Instagram for page inbox conversations
  return 'INSTAGRAM';
}

/**
 * Fetch all conversations from the page with pagination
 */
async function fetchAllConversations(accessToken, maxPages = 10) {
  const conversations = [];
  let url = `${GRAPH_API}/${PAGE_ID}/conversations?fields=id,participants,updated_time,message_count,link&limit=25&access_token=${accessToken}`;
  let page = 0;

  while (url && page < maxPages) {
    const res = await axios.get(url);
    const data = res.data;
    
    if (data.data) {
      conversations.push(...data.data);
    }
    
    url = data.paging?.next || null;
    page++;
    
    // Rate limit: 200ms between paginated requests
    await new Promise(r => setTimeout(r, 200));
  }

  return conversations;
}

/**
 * Fetch messages for a specific conversation
 */
async function fetchConversationMessages(convId, accessToken, maxPages = 5) {
  const messages = [];
  let url = `${GRAPH_API}/${convId}/messages?fields=id,message,from,to,created_time,attachments&limit=50&access_token=${accessToken}`;
  let page = 0;

  while (url && page < maxPages) {
    const res = await axios.get(url);
    const data = res.data;
    
    if (data.data) {
      messages.push(...data.data);
    }
    
    url = data.paging?.next || null;
    page++;
    
    await new Promise(r => setTimeout(r, 200));
  }

  // Return in chronological order (API returns newest first)
  return messages.reverse();
}

/**
 * Main import function
 */
async function importHistoricalConversations(organizationSlug = 'lalelilo') {
  const log = [];
  const pushLog = (msg) => { console.log(`[Import] ${msg}`); log.push(msg); };

  try {
    // 1. Find org and get the IG page token from channel credentials
    const org = await prisma.organization.findUnique({ where: { slug: organizationSlug } });
    if (!org) throw new Error(`Organization "${organizationSlug}" not found`);

    // Find IG or Messenger channel to get the access token
    const igChannel = await prisma.channel.findFirst({
      where: { organizationId: org.id, type: 'INSTAGRAM', isActive: true },
      include: { bot: true }
    });

    const fbChannel = await prisma.channel.findFirst({
      where: { organizationId: org.id, type: 'MESSENGER', isActive: true },
      include: { bot: true }
    });

    const channel = igChannel || fbChannel;
    if (!channel) throw new Error('No active Instagram or Messenger channel found. Ensure IG env vars are set.');

    // Decrypt credentials to get the access token
    let creds = {};
    try {
      const raw = channel.credentials;
      try { creds = JSON.parse(raw); } catch { 
        const decrypted = crypto.decrypt(raw, org.id);
        creds = decrypted ? JSON.parse(decrypted) : {};
      }
    } catch (e) {
      throw new Error(`Failed to decrypt channel credentials: ${e.message}`);
    }

    const accessToken = creds.accessToken;
    if (!accessToken) throw new Error('No accessToken found in channel credentials');

    pushLog(`Organization: ${org.name} (${org.id})`);
    pushLog(`Using channel: ${channel.type} (${channel.id})`);
    pushLog(`Bot: ${channel.bot?.name || 'Unknown'}`);

    // 2. Fetch all conversations from Meta
    pushLog('Fetching conversations from Meta API...');
    const metaConversations = await fetchAllConversations(accessToken);
    pushLog(`Found ${metaConversations.length} conversations on the page`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // 3. Process each conversation
    for (const metaConv of metaConversations) {
      try {
        // Find the customer participant (not the page)
        const customer = metaConv.participants?.data?.find(p => p.id !== PAGE_ID);
        if (!customer) {
          pushLog(`  Skipped conv ${metaConv.id}: No customer participant found`);
          skipped++;
          continue;
        }

        const channelType = detectChannelType(metaConv);
        const targetChannel = channelType === 'INSTAGRAM' ? igChannel : (fbChannel || igChannel);
        
        if (!targetChannel) {
          pushLog(`  Skipped conv ${metaConv.id}: No ${channelType} channel configured`);
          skipped++;
          continue;
        }

        // 3a. Find or create Contact
        let contact = await prisma.contact.findFirst({
          where: { organizationId: org.id, platformId: customer.id }
        });

        if (!contact) {
          contact = await prisma.contact.create({
            data: {
              organizationId: org.id,
              name: customer.name || `${channelType} User (${customer.id.slice(-4)})`,
              platformId: customer.id,
              platformType: channelType,
              email: customer.email?.includes('@facebook.com') ? null : customer.email
            }
          });
        }

        // 3b. Find or create InboxConversation
        let conversation = await prisma.inboxConversation.findFirst({
          where: { channelId: targetChannel.id, contactId: contact.id }
        });

        if (!conversation) {
          conversation = await prisma.inboxConversation.create({
            data: {
              organizationId: org.id,
              channelId: targetChannel.id,
              contactId: contact.id,
              botId: targetChannel.botId,
              status: 'OPEN',
              lastMessageAt: new Date(metaConv.updated_time)
            }
          });
        }

        // 3c. Fetch and import messages
        const metaMessages = await fetchConversationMessages(metaConv.id, accessToken);
        let newMsgCount = 0;

        for (const msg of metaMessages) {
          if (!msg.message && !msg.attachments) continue;

          // Check for duplicate by meta message ID
          const metaMsgId = msg.id;
          const existing = await prisma.message.findFirst({
            where: { conversationId: conversation.id, metadata: { contains: metaMsgId } }
          });

          if (existing) continue;

          const isFromPage = msg.from?.id === PAGE_ID;

          // Build descriptive content for attachments
          let content = msg.message || '';
          if (!content && msg.attachments?.data) {
            const att = msg.attachments.data[0];
            const type = (att.type || att.mime_type || 'file').toLowerCase();
            if (type.includes('image') || type === 'image') content = '📷 [Imagem]';
            else if (type.includes('video') || type === 'video') content = '🎬 [Vídeo]';
            else if (type.includes('audio') || type === 'audio') content = '🎵 [Áudio]';
            else if (type === 'sticker') content = '🏷️ [Sticker]';
            else if (type === 'share' || type === 'link') content = '🔗 [Link compartilhado]';
            else if (type === 'story_mention') content = '📖 [Menção no story]';
            else content = `📎 [${type}]`;
          }
          if (!content) content = '💬 [Mensagem sem texto]';

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderType: isFromPage ? 'BOT' : 'USER',
              content: content,
              metadata: JSON.stringify({ metaMessageId: metaMsgId, importedAt: new Date().toISOString() }),
              createdAt: new Date(msg.created_time)
            }
          });
          newMsgCount++;
        }

        // Update conversation timestamp
        if (metaMessages.length > 0) {
          const lastMsg = metaMessages[metaMessages.length - 1];
          await prisma.inboxConversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date(lastMsg.created_time || metaConv.updated_time) }
          });
        }

        pushLog(`  ✓ ${customer.name} (${channelType}): ${newMsgCount} new msgs imported (total: ${metaMessages.length})`);
        imported++;

      } catch (convErr) {
        pushLog(`  ✗ Error processing conv ${metaConv.id}: ${convErr.message}`);
        errors++;
      }
    }

    pushLog(`\n=== Import Complete ===`);
    pushLog(`Imported: ${imported} conversations`);
    pushLog(`Skipped: ${skipped}`);
    pushLog(`Errors: ${errors}`);

    return { success: true, imported, skipped, errors, log };

  } catch (e) {
    pushLog(`FATAL: ${e.message}`);
    return { success: false, error: e.message, log };
  }
}

module.exports = { importHistoricalConversations };
