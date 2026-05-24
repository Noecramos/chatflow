/**
 * AI Service: Multi-Model Orchestrator & Conversational Commerce Copilot
 * Implements RAG details injection, and official Ecommerce Tools declarations.
 */
const { GoogleGenAI } = require('@google/genai');
const ragService = require('./rag.service');
const cartService = require('./ecommerce');


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

    // Fetch last 8 messages
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 8
    });

    const parsedHistory = history.map(msg => ({
      role: msg.senderType === 'USER' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    if (!geminiKey) {
      console.warn("GEMINI_API_KEY is not configured.");
      return "Hello! I am ready to assist you. Please configure the GEMINI_API_KEY inside the Settings tab of your Dashboard to activate my AI capabilities.";
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: systemPrompt,
          temperature: bot.temperature,
          tools: [{ functionDeclarations: ECOMMERCE_TOOLS }]
        },
        history: parsedHistory
      });

      const result = await chat.sendMessage({ message: userMessageContent });
      const functionCalls = result.functionCalls;

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
        const finalResponse = await chat.sendMessage({
          message: [
            {
              functionResponse: {
                name: name,
                response: { result: toolResult }
              }
            }
          ]
        });

        return finalResponse.text;
      }

      return result.text;

    } catch (err) {
      console.error("Gemini AI Core transmission error:", err);
      return "I received your message, but experienced a small connection glitch. How can I help you with your order checkout today?";
    }
  }
};
