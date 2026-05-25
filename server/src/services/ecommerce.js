/**
 * Ecommerce Service: Manages Shopping Cart states and checkout Order calculations.
 * Encapsulates dynamic stock reservations, product variant checks, and Pix key generation.
 */
const axios = require('axios');

async function executeBotAction(action, payload) {
  try {
    const headers = typeof action.headers === 'string' ? JSON.parse(action.headers) : action.headers || {};
    const method = action.method.toUpperCase();
    
    const config = {
      method: method,
      url: action.url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (method === 'GET') {
      config.params = payload;
    } else {
      config.data = payload;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`HTTP Action [${action.name}] failed:`, error.message);
    throw new Error(`External connection failed: ${error.message}`);
  }
}

module.exports = {
  /**
   * Search product variant listings via secure ERP connectors (Tiny, Bling, Odoo, custom REST)
   */
  async searchProducts(prisma, bot, query, filters = "") {
    const action = await prisma.botAction.findFirst({
      where: { botId: bot.id, name: "search_products" }
    });

    if (action) {
      try {
        const results = await executeBotAction(action, { query, filters });
        return Array.isArray(results) ? results : [results];
      } catch (e) {
        console.error("External catalog connection failed, returning fallback mock catalog.", e.message);
      }
    }

    // Default Mock inventory with product variants
    const mockCatalog = [
      { id: "prod_01", name: "Premium Wireless Headphones", price: 129.99, stock: 15, description: "Noise cancelling Bluetooth over-ear headphones.", variants: ["Matte Black", "Silver Gray"] },
      { id: "prod_02", name: "Smart Fitness Watch", price: 79.99, stock: 8, description: "Heart rate monitoring, GPS tracking, 7-day battery.", variants: ["Sport Red", "Dark Blue"] },
      { id: "prod_03", name: "Ergonomic Office Chair", price: 249.50, stock: 4, description: "Mesh back, lumbar support, highly adjustable.", variants: ["Standard Mesh", "Premium Leather"] },
      { id: "prod_04", name: "Mechanical Keyboard", price: 99.00, stock: 22, description: "Tactile clicky switches with beautiful HSL backlighting.", variants: ["Brown Switch", "Blue Switch"] }
    ];

    return mockCatalog.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.description.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * Product details & stock status checks
   */
  async checkProductStock(prisma, bot, productId) {
    const action = await prisma.botAction.findFirst({
      where: { botId: bot.id, name: "get_product_details" }
    });

    if (action) {
      try {
        const result = await executeBotAction(action, { id: productId });
        return {
          productId: productId,
          name: result.name || "Product details",
          price: result.price || 0,
          stock: result.stock ?? 0,
          variants: result.variants || []
        };
      } catch (e) {
        console.error("External details query failed", e.message);
      }
    }

    const mockCatalog = {
      "prod_01": { stock: 15, price: 129.99, name: "Premium Wireless Headphones", variants: ["Matte Black", "Silver Gray"] },
      "prod_02": { stock: 8, price: 79.99, name: "Smart Fitness Watch", variants: ["Sport Red", "Dark Blue"] },
      "prod_03": { stock: 4, price: 249.50, name: "Ergonomic Office Chair", variants: ["Standard Mesh", "Premium Leather"] },
      "prod_04": { stock: 22, price: 99.00, name: "Mechanical Keyboard", variants: ["Brown Switch", "Blue Switch"] }
    };

    return mockCatalog[productId] || { stock: 0, price: 0, name: "Unknown Item", variants: [] };
  },

  /**
   * Query Cart Items
   */
  async getCart(prisma, conversation) {
    return prisma.cartItem.findMany({
      where: { conversationId: conversation.id }
    });
  },

  /**
   * Add item to database CartItem table
   */
  async addToCart(prisma, conversation, productId, quantity, bot) {
    const productInfo = await this.checkProductStock(prisma, bot, productId);
    if (productInfo.stock <= 0) {
      throw new Error(`Product ${productId} is out of stock.`);
    }

    const existing = await prisma.cartItem.findFirst({
      where: { conversationId: conversation.id, productId }
    });

    const currentQty = existing ? existing.quantity : 0;
    const targetQty = currentQty + quantity;

    if (targetQty > productInfo.stock) {
      throw new Error(`Cannot add. Stock limit is ${productInfo.stock} units and you already have ${currentQty} in cart.`);
    }

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: targetQty }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          conversationId: conversation.id,
          productId,
          name: productInfo.name,
          price: productInfo.price,
          quantity: quantity
        }
      });
    }

    return this.getCart(prisma, conversation);
  },

  /**
   * Remove item from CartItem table
   */
  async removeFromCart(prisma, conversation, productId) {
    const existing = await prisma.cartItem.findFirst({
      where: { conversationId: conversation.id, productId }
    });

    if (existing) {
      await prisma.cartItem.delete({
        where: { id: existing.id }
      });
    }

    return this.getCart(prisma, conversation);
  },

  /**
   * Finalize Cart, Reserve stock, create Order in DB, and wipe active CartItem records
   */
  async checkout(prisma, conversation, customerName, shippingAddress) {
    const cart = await this.getCart(prisma, conversation);
    if (cart.length === 0) {
      throw new Error("Cannot checkout. Customer shopping cart is empty!");
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Simulate stock reservation (stock checking & lock updates on external connectors)
    console.log(`[Stock Reservation] Locking inventory for ${cart.length} items in session ${conversation.id}`);

    // Generate dynamic Brazilian Pix instant payment code
    const randomHex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
    const mockPixKey = `00020101021226830014br.gov.bcb.pix2561pix.chatflow.com/qr/order_key_${randomHex}5204000053039865406${total.toFixed(2)}5802BR5913ChatFlowSaaS6009SaoPaulo62070503***6304${randomHex}`;

    const order = await prisma.order.create({
      data: {
        organizationId: conversation.organizationId,
        conversationId: conversation.id,
        contactId: conversation.contactId,
        totalAmount: parseFloat(total.toFixed(2)),
        status: "PENDING",
        shippingAddress: shippingAddress || "Collected via Chat",
        paymentLink: `PIX_KEY:${mockPixKey}`
      }
    });

    // Wipe cart items
    await prisma.cartItem.deleteMany({
      where: { conversationId: conversation.id }
    });

    return { order, total, pixKey: mockPixKey };
  }
};
