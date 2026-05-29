const prisma = require('../db');
const crypto = require('../utils/crypto');

async function main() {
  console.log("=== CHATFLOW DB DIAGNOSTIC ===");
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        users: {
          select: { id: true, email: true, role: true }
        },
        channels: true,
        bots: true
      }
    });

    console.log(`Found ${orgs.length} organizations:\n`);
    for (const org of orgs) {
      console.log(`[Org] Name: ${org.name}`);
      console.log(`      ID: ${org.id}`);
      console.log(`      Slug: ${org.slug}`);
      console.log(`      Plan: ${org.plan}`);
      console.log(`      Users:`, org.users);
      console.log(`      Bots:`, org.bots.map(b => ({ id: b.id, name: b.name, isAiActive: b.isAiActive })));
      
      console.log(`      Channels:`);
      for (const chan of org.channels) {
        let decCreds = "N/A";
        if (chan.credentials) {
          try {
            decCreds = crypto.decrypt(chan.credentials, org.id);
          } catch (e) {
            decCreds = `Decryption failed: ${e.message}`;
          }
        }
        console.log(`        - ID: ${chan.id}`);
        console.log(`          Type: ${chan.type}`);
        console.log(`          Provider: ${chan.provider}`);
        console.log(`          IsActive: ${chan.isActive}`);
        console.log(`          Credentials (Decrypted):`, decCreds);
      }
      console.log("-".repeat(40));
    }
  } catch (err) {
    console.error("Diagnostic error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
