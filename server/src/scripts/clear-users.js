const prisma = require('../db');

async function main() {
  console.log("=================================================================");
  console.log("             CHATFLOW DATABASE CLEANUP / RESET SCRIPT            ");
  console.log("=================================================================");
  console.log("Starting deletion of registered users, organizations, and all cascaded data...");

  try {
    // Delete all users. Due to onDelete: Cascade on user associations, this will clean up
    // user records.
    const userResult = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${userResult.count} users successfully.`);

    // Delete all organizations. Due to onDelete: Cascade defined in schema.prisma:
    // User, Bot, Channel, Contact, InboxConversation, Order, ContactList, BroadcastCampaign, CustomScript
    // are all configured with onDelete: Cascade referencing Organization.
    // Deleting all organizations will cascade-delete all their associated data, effectively resetting the system.
    const orgResult = await prisma.organization.deleteMany({});
    console.log(`✅ Deleted ${orgResult.count} organizations and all cascaded child records successfully.`);

    console.log("\n🎉 Database cleanup complete! Clients can now register from scratch.");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
