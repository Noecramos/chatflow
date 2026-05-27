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
    // Deleting all organizations will cascade-delete all their associated data.
    const orgResult = await prisma.organization.deleteMany({});
    console.log(`✅ Deleted ${orgResult.count} organizations and all cascaded child records successfully.`);

    // Re-seed Master Admin immediately so they are never locked out
    const bcrypt = require('bcryptjs');
    const adminEmail = 'admin@chatflow.com';
    const adminPassword = process.env.MASTER_ADMIN_PASSWORD || 'admin123456';

    const adminOrg = await prisma.organization.create({
      data: {
        name: "System Administration",
        slug: "system-admin",
        plan: "ENTERPRISE",
        maxBots: 999,
        maxMessagesPerMonth: 999999
      }
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: "System",
        lastName: "Admin",
        role: "SUPERADMIN",
        organizationId: adminOrg.id
      }
    });

    console.log(`\n🎉 Database cleanup complete! Clients can register from scratch.`);
    console.log(`🔑 Master Admin System Account re-seeded: ${adminEmail}`);
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
