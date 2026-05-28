const axios = require('axios');
const crypto = require('../utils/crypto');

/**
 * Get credentials helper and decrypt on-the-fly
 */
function getChannelCredentials(channel) {
  try {
    const rawCreds = channel.credentials;
    if (!rawCreds) return {};
    
    // First, try to parse rawCreds directly as JSON in case it is stored unencrypted (sandbox fallback)
    try {
      if (typeof rawCreds === 'object') return rawCreds;
      return JSON.parse(rawCreds);
    } catch (e) {
      // Not plain JSON, continue to decrypt
    }
    
    const decrypted = crypto.decrypt(rawCreds, channel.organizationId);
    if (!decrypted) {
      console.warn(`[getChannelCredentials] Decryption returned empty for channel ${channel.id}. Key mismatch?`);
      return {};
    }
    return typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted || {};
  } catch (e) {
    console.error("Meta credentials decryption error:", e.message);
    return {};
  }
}

/**
 * Send WhatsApp Business API message
 */
async function sendWhatsApp(creds, recipientId, payload) {
  const { accessToken, phoneNumberId } = creds;
  if (!accessToken || !phoneNumberId) {
    throw new Error("Missing WhatsApp accessToken or phoneNumberId in channel credentials.");
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const response = await axios.post(url, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: recipientId,
    ...payload
  }, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

/**
 * Send Instagram Direct Message
 */
async function sendInstagram(creds, recipientId, payload) {
  const { accessToken } = creds;
  if (!accessToken) {
    throw new Error("Missing Instagram Page Access Token in channel credentials.");
  }

  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
  const response = await axios.post(url, {
    recipient: { id: recipientId },
    ...payload
  });
  return response.data;
}

/**
 * Send Facebook Messenger Message
 */
async function sendMessenger(creds, recipientId, payload) {
  const { accessToken } = creds;
  if (!accessToken) {
    throw new Error("Missing Facebook Page Access Token in channel credentials.");
  }

  const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
  const response = await axios.post(url, {
    recipient: { id: recipientId },
    ...payload
  });
  return response.data;
}

module.exports = {
  /**
   * Universal router to send text response across channels
   */
  async sendTextMessage(channel, recipientId, text) {
    const creds = getChannelCredentials(channel);
    
    switch (channel.type.toUpperCase()) {
      case 'WHATSAPP':
        return sendWhatsApp(creds, recipientId, {
          type: "text",
          text: { body: text }
        });
        
      case 'INSTAGRAM':
        return sendInstagram(creds, recipientId, {
          message: { text: text }
        });
        
      case 'MESSENGER':
        return sendMessenger(creds, recipientId, {
          message: { text: text }
        });
        
      case 'WIDGET':
        console.log(`[Widget Send] To: ${recipientId}, Msg: ${text}`);
        return { message_id: `widget-${Date.now()}` };
        
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  },

  /**
   * Send WhatsApp Interactive Menu / List Selector
   */
  async sendWhatsAppList(channel, recipientId, headerText, bodyText, footerText, buttonText, sections) {
    const creds = getChannelCredentials(channel);
    if (channel.type.toUpperCase() !== 'WHATSAPP') {
      const options = sections.flatMap(sec => sec.rows.map(row => `- ${row.title}: ${row.description || ''}`)).join('\n');
      return this.sendTextMessage(channel, recipientId, `${headerText}\n\n${bodyText}\n\n${options}\n\n${footerText}`);
    }

    return sendWhatsApp(creds, recipientId, {
      type: "interactive",
      interactive: {
        type: "list",
        header: headerText ? { type: "text", text: headerText } : undefined,
        body: { text: bodyText },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          button: buttonText,
          sections: sections
        }
      }
    });
  },

  /**
   * Send WhatsApp Catalog Single Product Card or Multi-product Section
   */
  async sendWhatsAppProductCard(channel, recipientId, catalogId, productRetailerId, bodyText, footerText) {
    const creds = getChannelCredentials(channel);
    if (channel.type.toUpperCase() !== 'WHATSAPP') {
      return this.sendTextMessage(channel, recipientId, `${bodyText}\n(Product Code: ${productRetailerId})`);
    }

    return sendWhatsApp(creds, recipientId, {
      type: "interactive",
      interactive: {
        type: "product",
        action: {
          catalog_id: catalogId,
          product_retailer_id: productRetailerId
        },
        body: bodyText ? { text: bodyText } : undefined,
        footer: footerText ? { text: footerText } : undefined
      }
    });
  },

  /**
   * Send WhatsApp Multi-Product catalog section
   */
  async sendWhatsAppMultiProduct(channel, recipientId, catalogId, headerText, bodyText, sections) {
    const creds = getChannelCredentials(channel);
    if (channel.type.toUpperCase() !== 'WHATSAPP') {
      return this.sendTextMessage(channel, recipientId, `${headerText}\n\n${bodyText}`);
    }

    return sendWhatsApp(creds, recipientId, {
      type: "interactive",
      interactive: {
        type: "product_list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        action: {
          catalog_id: catalogId,
          sections: sections
        }
      }
    });
  },

  /**
   * Send Instagram / Messenger Generic Rich Template (Image + Title + Buttons)
   */
  async sendRichTemplate(channel, recipientId, title, subtitle, imageUrl, buttons) {
    const creds = getChannelCredentials(channel);
    const type = channel.type.toUpperCase();

    if (type === 'INSTAGRAM' || type === 'MESSENGER') {
      const payload = {
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [{
                title: title,
                subtitle: subtitle,
                image_url: imageUrl,
                buttons: buttons.map(b => ({
                  type: b.url ? "web_url" : "postback",
                  url: b.url,
                  title: b.title,
                  payload: b.payload
                }))
              }]
            }
          }
        }
      };

      if (type === 'INSTAGRAM') return sendInstagram(creds, recipientId, payload);
      return sendMessenger(creds, recipientId, payload);
    }

    let fallbackText = `*${title}*\n${subtitle}`;
    if (imageUrl) fallbackText = `${imageUrl}\n\n${fallbackText}`;
    return this.sendTextMessage(channel, recipientId, fallbackText);
  }
};
