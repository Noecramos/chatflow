/**
 * AI Service: Multi-Model Orchestrator & Conversational Commerce Copilot
 * Implements RAG details injection, and official Ecommerce Tools declarations.
 */
const { GoogleGenAI } = require('@google/genai');
const ragService = require('./rag.service');
const cartService = require('./ecommerce');

// Auto-upgrade deprecated/removed Gemini model identifiers
const DEPRECATED_MODEL_MAP = {
  'gemini-1.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-pro': 'gemini-2.5-flash',
  'gemini-1.0-pro': 'gemini-2.5-flash',
  'gemini-pro': 'gemini-2.5-flash',
};

function resolveModel(modelName) {
  const model = (modelName || 'gemini-2.5-flash').toLowerCase();
  return DEPRECATED_MODEL_MAP[model] || model;
}


function buildSystemInstruction(bot, contextChunks) {
  let instruction = bot.systemPrompt;
  
  if (contextChunks && contextChunks.length > 0) {
    instruction += "\n\n=== SEMANTIC CATALOG / FAQ CONTEXT ===\n";
    contextChunks.forEach((chunk, index) => {
      instruction += `[Context ${index + 1}]: ${chunk.content}\n`;
    });
    instruction += "\nUse this context information if relevant. If not, rely on your instructions but remain aligned with the brand.\n";
  }

  return instruction;
}

/**
 * Refined official Ecommerce Tools declarations
 */
const ECOMMERCE_TOOLS = [
  {
    name: "search_products",
    description: "Search products in the catalog by keyword and apply optional filters like category or price limits.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product description, category or keyword (e.g. 'mechanical keyboard')" },
        filters: { type: "STRING", description: "Optional filters (e.g. category, budget limits)" }
      },
      required: ["query"]
    }
  },
  {
    name: "get_product_details",
    description: "Retrieve comprehensive real-time product specification details, price, and stock levels using the product ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        id: { type: "STRING", description: "The product code/ID (e.g. 'prod_01')" }
      },
      required: ["id"]
    }
  },
  {
    name: "manage_cart",
    description: "Perform shopping cart adjustments: add items, remove items, or view current cart items.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: { type: "STRING", description: "The cart operation. Must be 'ADD', 'REMOVE', or 'VIEW'." },
        productId: { type: "STRING", description: "The product ID to add or remove." },
        quantity: { type: "INTEGER", description: "Quantity to add (defaults to 1)." }
      },
      required: ["action"]
    }
  },
  {
    name: "create_order",
    description: "Finalize conversational checkout, collect customer delivery details, and register a sales order.",
    parameters: {
      type: "OBJECT",
      properties: {
        customerName: { type: "STRING", description: "Name of the customer placing order" },
        shippingAddress: { type: "STRING", description: "Complete delivery address for shipment" }
      },
      required: ["customerName", "shippingAddress"]
    }
  }
];

module.exports = {
  /**
   * AI Chatbot processor matching refined Contact, InboxConversation, and CartItem schema tables.
   */
  async processChatMessage(prisma, bot, conversation, userMessageContent) {
    let queryEmbedding = null;
    
    // Retrieve Organization details to extract and decrypt private API keys on the fly
    const org = await prisma.organization.findUnique({
      where: { id: bot.organizationId }
    });

    const crypto = require('../utils/crypto');
    const geminiKey = (org && org.geminiKey) 
      ? crypto.decrypt(org.geminiKey, org.id) 
      : (process.env.GEMINI_API_KEY || null);


    // Fetch embeddings
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const embedResponse = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: userMessageContent,
        });
        if (embedResponse?.embedding?.values) {
          queryEmbedding = embedResponse.embedding.values;
        }
      } catch (err) {
        console.warn("RAG embeddings call failed. Falling back to keyword search:", err.message);
      }
    }

    // Load matching context chunks
    const matchedChunks = await ragService.searchKnowledge(prisma, bot.id, userMessageContent, queryEmbedding, 3);
    const systemPrompt = buildSystemInstruction(bot, matchedChunks);

    // Fetch last 10 messages to construct conversational timeline
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    // Sanitization: Gemini API requires the history list to strictly alternate roles starting with a 'user' turn.
    // Since the database registers bot greetings first, we skip items until we locate the first historical user message.
    // Also, we combine consecutive messages from the same role to avoid API alternation crashes.
    const sanitizedHistory = [];
    let foundFirstUser = false;
    const historicalMessages = history.slice(0, -1);

    for (const msg of historicalMessages) {
      if (msg.senderType === 'USER') {
        foundFirstUser = true;
      }
      if (foundFirstUser) {
        const role = msg.senderType === 'USER' ? 'user' : 'model';
        const lastMsg = sanitizedHistory[sanitizedHistory.length - 1];

        if (lastMsg && lastMsg.role === role) {
          // Merge consecutive same-role messages
          lastMsg.parts[0].text += `\n${msg.content}`;
        } else {
          sanitizedHistory.push({
            role: role,
            parts: [{ text: msg.content }]
          });
        }
      }
    }

    const contents = [...sanitizedHistory];
    const lastHistoryMsg = contents[contents.length - 1];

    if (lastHistoryMsg && lastHistoryMsg.role === 'user') {
      // Merge current user message into the last historical user message to maintain alternation
      lastHistoryMsg.parts[0].text += `\n${userMessageContent}`;
    } else {
      // Append as a new user turn
      contents.push({
        role: 'user',
        parts: [{ text: userMessageContent }]
      });
    }

    if (!geminiKey) {
      console.warn("GEMINI_API_KEY is not configured.");
      return "Hello! I am ready to assist you. Please configure the GEMINI_API_KEY inside the Settings tab of your Dashboard to activate my AI capabilities.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const effectiveModel = resolveModel(bot.model);
      console.log(`[AI] Using model: ${effectiveModel} (original: ${bot.model})`);
      const response = await ai.models.generateContent({
        model: effectiveModel,
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: bot.temperature,
          tools: [{ functionDeclarations: ECOMMERCE_TOOLS }]
        }
      });

      const functionCalls = response.functionCalls;

      // Process Ecommerce tool calling triggers
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const { name, args } = call;
        
        console.log(`[AI Copilot Commerce Tool] Traced call: ${name}`, args);
        let toolResult = "";

        switch (name) {
          case 'search_products': {
            const products = await cartService.searchProducts(prisma, bot, args.query, args.filters);
            toolResult = JSON.stringify(products);
            break;
          }
          case 'get_product_details': {
            const product = await cartService.checkProductStock(prisma, bot, args.id);
            toolResult = JSON.stringify(product);
            break;
          }
          case 'manage_cart': {
            try {
              if (args.action === 'ADD') {
                const cart = await cartService.addToCart(prisma, conversation, args.productId, args.quantity || 1, bot);
                toolResult = JSON.stringify({ success: true, message: "Added item to cart.", cart });
              } else if (args.action === 'REMOVE') {
                const cart = await cartService.removeFromCart(prisma, conversation, args.productId);
                toolResult = JSON.stringify({ success: true, message: "Removed item from cart.", cart });
              } else {
                const cart = await cartService.getCart(prisma, conversation);
                toolResult = JSON.stringify({ cart });
              }
            } catch (err) {
              toolResult = JSON.stringify({ success: false, error: err.message });
            }
            break;
          }
          case 'create_order': {
            try {
              const { order, total, pixKey } = await cartService.checkout(prisma, conversation, args.customerName, args.shippingAddress);
              toolResult = JSON.stringify({ 
                success: true, 
                message: "Conversational order created successfully with stock reserved!", 
                orderId: order.id, 
                totalAmount: total, 
                pixCopyPasteKey: pixKey,
                paymentLink: `https://checkout.chatvolt.com/pay/${order.id}` 
              });
            } catch (err) {
              toolResult = JSON.stringify({ success: false, error: err.message });
            }
            break;
          }

          default:
            toolResult = JSON.stringify({ error: "Unknown tool call" });
        }

        // Return tool results back to LLM for final output synthesis
        contents.push({
          role: 'model',
          parts: [{ functionCall: call }]
        });
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: name,
              response: { result: toolResult }
            }
          }]
        });

        const finalResponse = await ai.models.generateContent({
          model: effectiveModel,
          contents: contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: bot.temperature,
            tools: [{ functionDeclarations: ECOMMERCE_TOOLS }]
          }
        });

        return finalResponse.text;
      }

      return response.text;

    } catch (err) {
      console.error("Gemini AI Core transmission error:", err?.message || err, JSON.stringify({ model: bot.model, resolvedModel: resolveModel(bot.model), orgId: bot.organizationId }));
      return "Desculpe, estou enfrentando uma dificuldade técnica momentânea. Por favor, tente novamente em alguns instantes.";
    }
  }
};
