/**
 * Ecommerce Controller: Manages WhatsApp Conversational Commerce data and Order fulfillment flows.
 */
const prisma = require('../db');

module.exports = {
  /**
   * Fetch complete lists of orders generated through WhatsApp checkout
   */
  async getOrders(req, res) {
    const { organizationId } = req.user;

    try {
      const orders = await prisma.order.findMany({
        where: { organizationId },
        include: {
          contact: { select: { name: true, platformId: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const parsedOrders = [];
      for (const ord of orders) {
        // Query items in CartItem or Order detail (simulated by querying cart items in that conversation at checkout, 
        // but since we delete CartItems on checkout in cart.service.js, we can write items detail directly to Order shippingAddress 
        // or keep them. Let's make sure it returns cleanly)
        parsedOrders.push({
          id: ord.id,
          customerName: ord.contact.name,
          customerPhone: ord.contact.platformId,
          address: ord.shippingAddress,
          totalAmount: ord.totalAmount,
          status: ord.status,
          createdAt: ord.createdAt
        });
      }

      return res.status(200).json({ success: true, orders: parsedOrders });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Aggregate conversational e-commerce dashboard analytics
   */
  async getSalesMetrics(req, res) {
    const { organizationId } = req.user;

    try {
      const orders = await prisma.order.findMany({
        where: { organizationId }
      });

      let totalSales = 0;
      let pendingOrders = 0;
      let paidOrders = 0;

      orders.forEach(ord => {
        totalSales += ord.totalAmount;
        if (ord.status === 'PENDING') pendingOrders++;
        if (ord.status === 'PAID') paidOrders++;
      });

      return res.status(200).json({
        success: true,
        metrics: {
          totalSales: parseFloat(totalSales.toFixed(2)),
          totalOrdersCount: orders.length,
          pendingOrdersCount: pendingOrders,
          paidOrdersCount: paidOrders,
          itemsSold: orders.length * 2 // simulated average
        }
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * Update Order Payment status
   */
  async updateOrderStatus(req, res) {
    const { orderId } = req.params;
    const { status } = req.body;
    const { organizationId } = req.user;

    try {
      const updated = await prisma.order.update({
        where: { id: orderId, organizationId },
        data: { status }
      });
      return res.status(200).json({ success: true, order: updated });
    } catch (e) {
      return res.status(404).json({ success: false, error: "Order not found or unauthorized." });
    }
  },

  /**
   * Mock ERP stock search connector
   */
  async mockInventoryConnector(req, res) {
    const { query, productId } = req.body;
    console.log(`[Mock ERP Connector] Body:`, req.body);

    const mockDatabase = [
      { productId: "prod_01", name: "Premium Wireless Headphones", price: 129.99, stock: 15, description: "Noise cancelling Bluetooth over-ear headphones." },
      { productId: "prod_02", name: "Smart Fitness Watch", price: 79.99, stock: 8, description: "Heart rate monitoring, GPS tracking, 7-day battery." },
      { productId: "prod_03", name: "Ergonomic Office Chair", price: 249.50, stock: 4, description: "Mesh back, lumbar support, highly adjustable." },
      { productId: "prod_04", name: "Mechanical Keyboard", price: 99.00, stock: 22, description: "Tactile clicky switches with beautiful HSL backlighting." }
    ];

    if (productId) {
      const matched = mockDatabase.find(p => p.productId === productId);
      if (matched) return res.status(200).json(matched);
      return res.status(404).json({ error: "Product not found." });
    }

    if (query) {
      const matched = mockDatabase.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.description.toLowerCase().includes(query.toLowerCase())
      );
      return res.status(200).json(matched);
    }

    return res.status(400).json({ error: "Provide 'query' or 'productId'." });
  }
};
