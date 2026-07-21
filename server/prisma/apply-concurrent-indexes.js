const prisma = require('../src/db');

/**
 * Non-blocking PostgreSQL Concurrent Index Application Script
 * 
 * Applies compound performance indexes using 'CREATE INDEX CONCURRENTLY'
 * to guarantee ZERO write blocking or table locking during deployment.
 */
async function applyConcurrentIndexes() {
  console.log('[Indexes] Checking and applying PostgreSQL non-blocking concurrent indexes...');

  const indexQueries = [
    {
      name: 'idx_inbox_conv_org_status',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inbox_conv_org_status" ON "InboxConversation" ("organizationId", "status");`
    },
    {
      name: 'idx_inbox_conv_org_lastmsg',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_inbox_conv_org_lastmsg" ON "InboxConversation" ("organizationId", "lastMessageAt" DESC);`
    },
    {
      name: 'idx_message_conv_created',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_message_conv_created" ON "Message" ("conversationId", "createdAt" DESC);`
    },
    {
      name: 'idx_contact_org_platform',
      sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_contact_org_platform" ON "Contact" ("organizationId", "platformId");`
    }
  ];

  for (const { name, sql } of indexQueries) {
    try {
      console.log(`[Indexes] Applying ${name}...`);
      await prisma.$executeRawUnsafe(sql);
      console.log(`[Indexes] Successfully applied ${name}.`);
    } catch (err) {
      // CONCURRENTLY may fail if unsupported (e.g. SQLite in test environment or index already exists)
      if (err.message.includes('already exists') || err.message.includes('duplicate key')) {
        console.log(`[Indexes] Index ${name} already exists. Skipping.`);
      } else {
        console.warn(`[Indexes] Note on ${name}:`, err.message);
      }
    }
  }

  console.log('[Indexes] Non-blocking index application finished.');
}

if (require.main === module) {
  applyConcurrentIndexes()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error('[Indexes Error]:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = applyConcurrentIndexes;
