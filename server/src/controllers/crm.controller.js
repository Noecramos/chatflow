const prisma = require('../db');

const PIPELINE_STAGES = [
  { key: 'NOVO', name: 'Novo Lead', color: '#8a2be2' },
  { key: 'QUALIFICADO', name: 'Qualificado', color: '#006aff' },
  { key: 'NEGOCIACAO', name: 'Negociação', color: '#f9d423' },
  { key: 'PROPOSTA', name: 'Proposta', color: '#ff6b35' },
  { key: 'FECHADO_WON', name: 'Fechado (Won)', color: '#00c853' },
  { key: 'FECHADO_LOST', name: 'Perdido (Lost)', color: '#ff1744' }
];

module.exports = {
  /**
   * GET /crm/pipeline — All contacts grouped by leadStage
   */
  async getPipeline(req, res) {
    try {
      const orgId = req.user.organizationId;
      const contacts = await prisma.contact.findMany({
        where: { organizationId: orgId },
        orderBy: { updatedAt: 'desc' },
        include: {
          conversations: {
            take: 1,
            orderBy: { lastMessageAt: 'desc' },
            select: {
              id: true,
              lastMessageAt: true,
              channel: { select: { type: true } },
              status: true
            }
          }
        }
      });

      const pipeline = PIPELINE_STAGES.map(stage => {
        const stageContacts = contacts.filter(c => c.leadStage === stage.key);
        const totalValue = stageContacts.reduce((sum, c) => sum + (c.leadValue || 0), 0);
        return {
          ...stage,
          contacts: stageContacts.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            platformType: c.platformType,
            platformId: c.platformId,
            leadValue: c.leadValue,
            leadNotes: c.leadNotes,
            leadSource: c.leadSource,
            nextFollowUp: c.nextFollowUp,
            closedAt: c.closedAt,
            tags: (() => { try { return JSON.parse(c.tags || '[]'); } catch { return []; } })(),
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            lastConversation: c.conversations[0] || null
          })),
          count: stageContacts.length,
          totalValue
        };
      });

      res.json({ success: true, pipeline, stages: PIPELINE_STAGES });
    } catch (e) {
      console.error('[CRM Pipeline Error]:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * GET /crm/metrics — Aggregated CRM KPIs
   */
  async getMetrics(req, res) {
    try {
      const orgId = req.user.organizationId;
      const { channel, period } = req.query;

      // 1. Fetch all raw data for the organization
      const allContacts = await prisma.contact.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          leadStage: true,
          leadValue: true,
          leadSource: true,
          platformType: true,
          closedAt: true,
          createdAt: true
        }
      });

      const allConversations = await prisma.inboxConversation.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          status: true,
          isHumanHandoverActive: true,
          createdAt: true,
          channel: { select: { type: true } }
        }
      });

      // 2. Filter contacts in-memory
      let filteredContacts = [...allContacts];
      if (channel && channel !== 'ALL') {
        filteredContacts = filteredContacts.filter(c => 
          (c.leadSource && c.leadSource.toUpperCase() === channel.toUpperCase()) || 
          (c.platformType && c.platformType.toUpperCase() === channel.toUpperCase())
        );
      }
      if (period && period !== 'ALL') {
        const now = new Date();
        let limitDate = new Date();
        if (period === '7D') limitDate.setDate(now.getDate() - 7);
        if (period === '30D') limitDate.setDate(now.getDate() - 30);
        filteredContacts = filteredContacts.filter(c => new Date(c.createdAt) >= limitDate);
      }

      // 3. Filter conversations in-memory
      let filteredConversations = [...allConversations];
      if (channel && channel !== 'ALL') {
        filteredConversations = filteredConversations.filter(c => 
          c.channel && c.channel.type.toUpperCase() === channel.toUpperCase()
        );
      }
      if (period && period !== 'ALL') {
        const now = new Date();
        let limitDate = new Date();
        if (period === '7D') limitDate.setDate(now.getDate() - 7);
        if (period === '30D') limitDate.setDate(now.getDate() - 30);
        filteredConversations = filteredConversations.filter(c => new Date(c.createdAt) >= limitDate);
      }

      // 4. Calculate CRM KPIs based on filtered contacts
      const totalLeads = filteredContacts.length;
      const wonDeals = filteredContacts.filter(c => c.leadStage === 'FECHADO_WON');
      const lostDeals = filteredContacts.filter(c => c.leadStage === 'FECHADO_LOST');
      const activeDeals = filteredContacts.filter(c => ['NEGOCIACAO', 'PROPOSTA'].includes(c.leadStage));
      const qualifiedLeads = filteredContacts.filter(c => c.leadStage === 'QUALIFICADO');
      const novoLeads = filteredContacts.filter(c => c.leadStage === 'NOVO');

      // Pipeline value = sum of leadValue for non-lost contacts
      const pipelineValue = filteredContacts
        .filter(c => c.leadStage !== 'FECHADO_LOST')
        .reduce((sum, c) => sum + (c.leadValue || 0), 0);

      // Won value
      const wonValue = wonDeals.reduce((sum, c) => sum + (c.leadValue || 0), 0);

      // Conversion rate (won / total that reached at least QUALIFICADO)
      const qualifiedOrBeyond = filteredContacts.filter(c => c.leadStage !== 'NOVO');
      const conversionRate = qualifiedOrBeyond.length > 0
        ? ((wonDeals.length / qualifiedOrBeyond.length) * 100).toFixed(1)
        : 0;

      // Average time to close (days) for won deals
      let avgDaysToClose = 0;
      if (wonDeals.length > 0) {
        const totalDays = wonDeals.reduce((sum, c) => {
          if (c.closedAt) {
            return sum + ((new Date(c.closedAt) - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
          }
          return sum;
        }, 0);
        avgDaysToClose = (totalDays / wonDeals.length).toFixed(1);
      }

      // Leads by channel
      const channelCounts = {};
      filteredContacts.forEach(c => {
        const ch = c.leadSource || c.platformType || 'UNKNOWN';
        channelCounts[ch] = (channelCounts[ch] || 0) + 1;
      });

      // Funnel data (count per stage)
      const funnel = PIPELINE_STAGES.map(stage => ({
        key: stage.key,
        name: stage.name,
        color: stage.color,
        count: filteredContacts.filter(c => c.leadStage === stage.key).length,
        value: filteredContacts.filter(c => c.leadStage === stage.key).reduce((s, c) => s + (c.leadValue || 0), 0)
      }));

      // Daily leads last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentContacts = filteredContacts.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);
      const dailyLeads = {};
      recentContacts.forEach(c => {
        const day = new Date(c.createdAt).toISOString().split('T')[0];
        dailyLeads[day] = (dailyLeads[day] || 0) + 1;
      });

      // 5. Calculate conversation metrics based on filtered conversations
      const totalConversations = filteredConversations.length;
      const humanHandled = filteredConversations.filter(c => c.isHumanHandoverActive).length;
      const aiHandled = filteredConversations.filter(c => !c.isHumanHandoverActive).length;
      const unresolved = filteredConversations.filter(c => c.status === 'OPEN' || c.status === 'PENDING').length;
      const resolved = filteredConversations.filter(c => c.status === 'CLOSED').length;

      res.json({
        success: true,
        metrics: {
          totalLeads,
          pipelineValue,
          wonValue,
          wonCount: wonDeals.length,
          lostCount: lostDeals.length,
          activeDeals: activeDeals.length,
          qualifiedLeads: qualifiedLeads.length,
          novoLeads: novoLeads.length,
          conversionRate: parseFloat(conversionRate),
          avgDaysToClose: parseFloat(avgDaysToClose),
          channelCounts,
          funnel,
          dailyLeads,
          conversationStats: {
            totalConversations,
            humanHandled,
            aiHandled,
            unresolved,
            resolved
          }
        }
      });
    } catch (e) {
      console.error('[CRM Metrics Error]:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * PUT /crm/contacts/:id/stage — Move contact to a pipeline stage
   */
  async updateStage(req, res) {
    try {
      const { id } = req.params;
      const { stage } = req.body;

      if (!PIPELINE_STAGES.find(s => s.key === stage)) {
        return res.status(400).json({ success: false, error: `Invalid stage: ${stage}` });
      }

      const updateData = { leadStage: stage };

      // Auto-set closedAt when moving to won/lost
      if (stage === 'FECHADO_WON' || stage === 'FECHADO_LOST') {
        updateData.closedAt = new Date();
      } else {
        updateData.closedAt = null;
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, contact });
    } catch (e) {
      console.error('[CRM Stage Update Error]:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  },

  /**
   * PUT /crm/contacts/:id — Update CRM fields (value, notes, tags, followup)
   */
  async updateContact(req, res) {
    try {
      const { id } = req.params;
      const { leadValue, leadNotes, tags, nextFollowUp, name, email, phone } = req.body;

      const updateData = {};
      if (leadValue !== undefined) updateData.leadValue = parseFloat(leadValue) || 0;
      if (leadNotes !== undefined) updateData.leadNotes = leadNotes;
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);
      if (nextFollowUp !== undefined) updateData.nextFollowUp = nextFollowUp ? new Date(nextFollowUp) : null;
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;

      const contact = await prisma.contact.update({
        where: { id },
        data: updateData
      });

      res.json({ success: true, contact });
    } catch (e) {
      console.error('[CRM Contact Update Error]:', e);
      res.status(500).json({ success: false, error: e.message });
    }
  }
};
