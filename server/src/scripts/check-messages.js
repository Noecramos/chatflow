const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Fetching last 5 conversations...");
    const convs = await prisma.inboxConversation.findMany({
      include: {
        contact: true,
        channel: true
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: 5
    });

    for (const c of convs) {
      console.log(`\n-----------------------------------------`);
      console.log(`Conversation ID: ${c.id}`);
      console.log(`Contact: ${c.contact?.name} (${c.contact?.phone || c.contact?.platformId})`);
      console.log(`Platform: ${c.contact?.platformType}`);
      console.log(`isHumanHandoverActive: ${c.isHumanHandoverActive}`);
      console.log(`Status: ${c.status}`);
      console.log(`Last Message At: ${c.lastMessageAt}`);

      console.log(`Last 5 Messages:`);
      const msgs = await prisma.message.findMany({
        where: { conversationId: c.id },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      for (const m of msgs.reverse()) {
        console.log(`  - [${m.senderType}] (${m.createdAt.toISOString()}): ${m.content}`);
      }
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
