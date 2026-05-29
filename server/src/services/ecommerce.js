/**
 * Ecommerce Service: Manages Shopping Cart states and checkout Order calculations.
 * Integrates ChatFlow CRM natively to Lalelilo's live Supabase catalog & Asaas payments.
 */
const axios = require('axios');

const supabaseUrl = process.env.LALELILO_SUPABASE_URL;
const supabaseKey = process.env.LALELILO_SUPABASE_KEY;
const DEFAULT_CLIENT_ID = process.env.LALELILO_DEFAULT_CLIENT_ID || "acb4b354-728f-479d-915a-c857d27da9ad";
const ASAAS_API_KEY = process.env.LALELILO_ASAAS_API_KEY;
const ASAAS_ENV = process.env.LALELILO_ASAAS_ENV || "sandbox";

const ASAAS_BASE_URL = ASAAS_ENV === "production"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

/**
 * Helper to call Lalelilo's Supabase REST API
 */
async function supabaseRequest(method, endpoint, data = null) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Lalelilo Supabase configurations are missing.");
  }
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  if (method !== 'GET') {
    headers['Prefer'] = 'return=representation';
  }
  const config = {
    method,
    url: `${supabaseUrl}/rest/v1${endpoint}`,
    headers,
    ...(data ? { data } : {})
  };
  const response = await axios(config);
  return response.data;
}

/**
 * Helper to call Asaas API
 */
async function asaasRequest(method, endpoint, data = null) {
  if (!ASAAS_API_KEY) {
    throw new Error("Asaas API key is missing.");
  }
  const config = {
    method,
    url: `${ASAAS_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY
    },
    ...(data ? { data } : {})
  };
  const response = await axios(config);
  return response.data;
}

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
   * Fetch all active shops from Lalelilo Supabase
   */
  async getShops() {
    try {
      if (supabaseUrl && supabaseKey) {
        const endpoint = `/shops?select=id,name,city,state&is_active=eq.true&order=name`;
        return await supabaseRequest('GET', endpoint);
      }
    } catch (e) {
      console.error("[GetShops] Supabase REST fetch failed:", e.message);
    }
    return [];
  },

  /**
   * Search product variant listings in Lalelilo Supabase
   * Uses keyword splitting and searches across name + description for broader matching
   */
  async searchProducts(prisma, bot, query, filters = "") {
    // 1. Try DB connector BotAction
    const action = await prisma.botAction.findFirst({
      where: { botId: bot.id, name: "search_products" }
    });

    if (action) {
      try {
        const results = await executeBotAction(action, { query, filters });
        return Array.isArray(results) ? results : [results];
      } catch (e) {
        console.error("External catalog connection failed, falling back to direct Supabase.", e.message);
      }
    }

    // 2. Direct Supabase Query with smart keyword search
    try {
      if (supabaseUrl && supabaseKey) {
        // If query is empty or whitespace, return default list of active products to autofill the Catalog view
        if (!query || !query.trim()) {
          const endpoint = `/products?select=id,name,price,compare_at_price,description,image_url,sizes,colors&is_active=eq.true&order=name&limit=20`;
          try {
            const products = await supabaseRequest('GET', endpoint);
            if (products && products.length > 0) {
              return products.map(p => ({
                id: p.id,
                name: p.name,
                price: Number(p.price),
                compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
                stock: 10,
                description: p.description || "",
                variants: p.sizes || [],
                colors: p.colors || [],
                imageUrl: p.image_url || ""
              }));
            }
          } catch (e) {
            console.error("[SearchProducts] Default fetch failed:", e.message);
          }
          return [];
        }

        // Split query into individual keywords, filter out short/common words
        const stopWords = ['de', 'da', 'do', 'para', 'com', 'um', 'uma', 'o', 'a', 'os', 'as', 'e', 'ou', 'no', 'na', 'quero', 'ver', 'tem', 'me', 'mostra'];
        const keywords = query
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.includes(w));

        // Portuguese plural/singular stemming: e.g. "vestidos" -> "vestido", "moletoms" -> "moletom"
        const searchKeywords = [];
        for (const kw of keywords) {
          searchKeywords.push(kw);
          if (kw.length > 3 && kw.endsWith('s')) {
            const stemmed = kw.slice(0, -1);
            if (!searchKeywords.includes(stemmed)) {
              searchKeywords.push(stemmed);
            }
          }
        }

        let allProducts = [];

        // Search each keyword across name and description
        for (const keyword of searchKeywords) {
          const encoded = encodeURIComponent(keyword.toUpperCase());
          const encodedLower = encodeURIComponent(keyword);
          // Use 'or' filter to search both name and description
          const endpoint = `/products?select=id,name,price,compare_at_price,description,image_url,sizes,colors&or=(name.ilike.%25${encoded}%25,description.ilike.%25${encodedLower}%25)&is_active=eq.true&limit=10`;
          try {
            const products = await supabaseRequest('GET', endpoint);
            if (products && products.length > 0) {
              allProducts.push(...products);
            }
          } catch (e) {
            console.warn(`[SearchProducts] Keyword "${keyword}" search failed:`, e.message);
          }
        }

        // If no keyword match, try the full query as-is (with stemming if it ends in 's')
        if (allProducts.length === 0) {
          let cleanQuery = query;
          if (query.length > 3 && query.toLowerCase().endsWith('s')) {
            cleanQuery = query.slice(0, -1);
          }
          const encodedFull = encodeURIComponent(cleanQuery.toUpperCase());
          const encodedFullLower = encodeURIComponent(cleanQuery.toLowerCase());
          const endpoint = `/products?select=id,name,price,compare_at_price,description,image_url,sizes,colors&or=(name.ilike.%25${encodedFull}%25,description.ilike.%25${encodedFullLower}%25)&is_active=eq.true&limit=10`;
          try {
            const products = await supabaseRequest('GET', endpoint);
            if (products && products.length > 0) {
              allProducts = products;
            }
          } catch (e) {
            console.warn("[SearchProducts] Full query search failed:", e.message);
          }
        }

        // Deduplicate by product ID
        const seen = new Set();
        const unique = allProducts.filter(p => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });

        if (unique.length > 0) {
          return unique.slice(0, 10).map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : null,
            stock: 10,
            description: p.description || "",
            variants: p.sizes || [],
            colors: p.colors || [],
            imageUrl: p.image_url || ""
          }));
        }
      }
    } catch (e) {
      console.error("[SearchProducts] Supabase REST search failed:", e.message);
    }

    // 3. No results found
    return [];
  },

  /**
   * Check product variant stock from Lalelilo Supabase
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
          stock: result.stock ?? 10,
          variants: result.variants || []
        };
      } catch (e) {
        console.error("External details query failed", e.message);
      }
    }

    try {
      if (supabaseUrl && supabaseKey) {
        const endpoint = `/products?select=id,name,price,sizes,colors,inventory_quantity&id=eq.${productId}`;
        const products = await supabaseRequest('GET', endpoint);
        if (products && products.length > 0) {
          const p = products[0];
          return {
            productId: p.id,
            name: p.name,
            price: Number(p.price),
            stock: p.inventory_quantity ?? 10,
            variants: p.sizes || []
          };
        }
      }
    } catch (e) {
      console.error("[ProductStock] Supabase REST fetch failed:", e.message);
    }

    return { stock: 10, price: 99.00, name: "Premium Product", variants: ["Standard"] };
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
   * Add item to database CartItem table and sync it to Lalelilo Supabase Cart
   */
  async addToCart(prisma, conversation, productId, quantity, bot, size = null, color = null) {
    const phone = conversation.contact?.phone || conversation.contact?.platformId || "";
    const productInfo = await this.checkProductStock(prisma, bot, productId);

    // 1. Sync Cart to Lalelilo Supabase
    try {
      if (supabaseUrl && supabaseKey && phone) {
        // Find existing cart (converted_at is null)
        const carts = await supabaseRequest('GET', `/carts?customer_phone=eq.${phone}&order_id=is.null&limit=1`);
        let cartId = carts && carts.length > 0 ? carts[0].id : null;

        if (!cartId) {
          const expires = new Date();
          expires.setHours(expires.getHours() + 2);

          let shopId = null;
          if (conversation.contact?.metadata) {
            try {
              const meta = JSON.parse(conversation.contact.metadata);
              shopId = meta.assignedShopId || null;
            } catch (e) {
              console.warn("[AddToCart] Error parsing metadata:", e.message);
            }
          }

          const newCart = await supabaseRequest('POST', '/carts', {
            client_id: DEFAULT_CLIENT_ID,
            customer_phone: phone,
            shop_id: shopId,
            expires_at: expires.toISOString()
          });
          if (newCart && newCart.length > 0) {
            cartId = newCart[0].id;
          }
        }

        if (cartId) {
          // Check if cart item already exists
          const cartItems = await supabaseRequest('GET', `/cart_items?cart_id=eq.${cartId}&product_id=eq.${productId}`);
          if (cartItems && cartItems.length > 0) {
            const currentQty = cartItems[0].quantity;
            await supabaseRequest('PATCH', `/cart_items?id=eq.${cartItems[0].id}`, {
              quantity: currentQty + quantity
            });
          } else {
            await supabaseRequest('POST', '/cart_items', {
              cart_id: cartId,
              product_id: productId,
              quantity,
              price: productInfo.price,
              size: size || null,
              color: color || null
            });
          }
        }
      }
    } catch (e) {
      console.error("[AddToCart] Sync to Lalelilo Supabase failed:", e.message);
    }

    // 2. Add to ChatFlow local DB for dashboard tracking
    const displayName = `${productInfo.name}${size || color ? ' (' : ''}${size ? 'Tam ' + size : ''}${size && color ? ' / ' : ''}${color ? color : ''}${size || color ? ')' : ''}`;

    const existing = await prisma.cartItem.findFirst({
      where: { conversationId: conversation.id, productId }
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { 
          quantity: existing.quantity + quantity,
          name: displayName
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          conversationId: conversation.id,
          productId,
          name: displayName,
          price: productInfo.price,
          quantity: quantity
        }
      });
    }

    return this.getCart(prisma, conversation);
  },

  /**
   * Remove item from CartItem table and sync it to Lalelilo Supabase Cart
   */
  async removeFromCart(prisma, conversation, productId) {
    const phone = conversation.contact?.phone || conversation.contact?.platformId || "";

    // 1. Sync deletion to Lalelilo Supabase
    try {
      if (supabaseUrl && supabaseKey && phone) {
        const carts = await supabaseRequest('GET', `/carts?customer_phone=eq.${phone}&order_id=is.null&limit=1`);
        if (carts && carts.length > 0) {
          await supabaseRequest('DELETE', `/cart_items?cart_id=eq.${carts[0].id}&product_id=eq.${productId}`);
        }
      }
    } catch (e) {
      console.error("[RemoveFromCart] Sync to Lalelilo Supabase failed:", e.message);
    }

    // 2. Remove locally
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
   * Finalize Cart, create Order in Lalelilo Supabase, and generate Asaas PIX code
   */
  async checkout(prisma, conversation, customerName, shippingAddress) {
    const phone = conversation.contact?.phone || conversation.contact?.platformId || "";
    const cart = await this.getCart(prisma, conversation);

    if (cart.length === 0) {
      throw new Error("Cannot checkout. Customer shopping cart is empty!");
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const roundedTotal = Math.round(total * 100) / 100;

    // Load discount and shop ID from metadata
    let shopId = null;
    let discount = 0;
    let discountType = null;
    let discountValue = 0;
    if (conversation.contact?.metadata) {
      try {
        const meta = JSON.parse(conversation.contact.metadata);
        shopId = meta.assignedShopId || null;
        discountType = meta.appliedDiscountType || null;
        discountValue = Number(meta.appliedDiscountValue || 0);

        if (discountType === 'percentage' && discountValue > 0) {
          discount = Math.round((roundedTotal * (discountValue / 100)) * 100) / 100;
        } else if (discountType === 'fixed' && discountValue > 0) {
          discount = Math.min(discountValue, roundedTotal);
        }
      } catch (e) {
        console.warn("[Checkout] Failed to parse contact metadata JSON:", e.message);
      }
    }

    const finalAmount = Math.max(0, Math.round((roundedTotal - discount) * 100) / 100);

    let orderId = null;
    let orderNumber = `WA${Date.now().toString(36).toUpperCase()}`;
    let pixKey = "";

    // 1. Trigger checkout via live Asaas payment and insert order into Supabase
    try {
      if (supabaseUrl && supabaseKey && phone && ASAAS_API_KEY) {
        // Clean phone/CPF for Asaas
        const cleanPhone = phone.replace(/\D/g, '');
        const cleanCpf = "12345678909"; // Mock fallback or dynamically fetched

        // A. Find or create customer on Asaas
        const searchCustomer = await asaasRequest('GET', `/customers?cpfCnpj=${cleanCpf}`);
        let customerId = searchCustomer.data?.length > 0 ? searchCustomer.data[0].id : null;

        if (!customerId) {
          const newCustomer = await asaasRequest('POST', '/customers', {
            name: customerName,
            cpfCnpj: cleanCpf,
            phone: cleanPhone,
            notificationDisabled: true
          });
          customerId = newCustomer.id;
        }

        if (customerId) {
          // B. Get active cart ID
          const carts = await supabaseRequest('GET', `/carts?customer_phone=eq.${phone}&order_id=is.null&limit=1`);
          const cartId = carts && carts.length > 0 ? carts[0].id : null;

          if (cartId) {
            // C. Insert Order in Supabase
            const orderItems = cart.map(i => ({
              product_id: i.productId,
              product_name: i.name,
              quantity: i.quantity,
              price: i.price,
              subtotal: i.price * i.quantity
            }));

            // Retrieve salesperson details if assigned
            let agentId = null;
            let agentName = null;
            if (conversation.assignedUserId) {
              agentId = conversation.assignedUserId;
              if (conversation.assignedUser) {
                agentName = `${conversation.assignedUser.firstName} ${conversation.assignedUser.lastName}`.trim();
              }
            }

            const supabaseOrder = await supabaseRequest('POST', '/orders', {
              client_id: DEFAULT_CLIENT_ID,
              shop_id: shopId,
              order_number: orderNumber,
              customer_name: customerName,
              customer_phone: phone,
              order_type: 'delivery',
              status: 'pending',
              subtotal: roundedTotal,
              delivery_fee: 0,
              discount: discount,
              total_amount: finalAmount,
              payment_method: 'pix',
              payment_status: 'pending',
              source_channel: conversation.channel?.type?.toLowerCase() || 'whatsapp',
              agent_id: agentId,
              agent_name: agentName,
              cart_id: cartId,
              items: orderItems
            });

            if (supabaseOrder && supabaseOrder.length > 0) {
              orderId = supabaseOrder[0].id;

              // D. Generate PIX Payment on Asaas
              const payment = await asaasRequest('POST', '/payments', {
                customer: customerId,
                billingType: 'PIX',
                value: finalAmount,
                dueDate: new Date().toISOString().split('T')[0],
                description: `Lalelilo #${orderNumber}`,
                externalReference: orderId
              });

              // E. Get PIX Copy & Paste QR Code
              const pixData = await asaasRequest('GET', `/payments/${payment.id}/pixQrCode`);
              pixKey = pixData.payload || "";

              // F. Insert payment reference into Supabase
              await supabaseRequest('POST', '/asaas_payments', {
                order_id: orderId,
                asaas_payment_id: payment.id,
                asaas_customer_id: customerId,
                amount: finalAmount,
                status: 'PENDING',
                pix_code: pixKey,
                client_id: DEFAULT_CLIENT_ID
              });

              // G. Mark cart as converted
              await supabaseRequest('PATCH', `/carts?id=eq.${cartId}`, {
                converted_at: new Date().toISOString(),
                order_id: orderId
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("[Checkout] Sync to Lalelilo + Asaas failed:", e.message);
    }

    // 2. Generate local order for CRM dashboard tracking
    const order = await prisma.order.create({
      data: {
        organizationId: conversation.organizationId,
        conversationId: conversation.id,
        contactId: conversation.contactId,
        totalAmount: finalAmount,
        status: "PENDING",
        shippingAddress: shippingAddress || "Collected via Chat",
        paymentLink: pixKey ? `PIX_KEY:${pixKey}` : `https://checkout.chatflow.com/pay/${orderNumber}`
      }
    });

    // 3. Wipe cart items locally
    await prisma.cartItem.deleteMany({
      where: { conversationId: conversation.id }
    });

    return { order, total: finalAmount, pixKey: pixKey || "PIX_KEY_MOCK_FALLBACK_123" };
  }
};
