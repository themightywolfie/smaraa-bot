import { config } from 'dotenv';
import { createDatabaseClient } from './database/index.js';
import pino from 'pino';

// Load environment variables
config();

const logger = pino({ name: 'smaraa-bot-backend' });

async function main() {
  logger.info('SmaraaBot Backend API starting...');

  // Initialize database client
  const db = createDatabaseClient();
  
  try {
    // Test database connectivity
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database health check failed');
    }
    
    // Check pgvector extension
    const hasPgVector = await db.checkPgVectorExtension();
    if (!hasPgVector) {
      throw new Error('pgvector extension not found');
    }
    
    logger.info('Database connection established successfully');
    logger.info({ stats: db.getPoolStats() }, 'Database pool statistics');
    
    // TODO: Initialize Express server and start
    // This will be implemented in subsequent tasks
    
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : error }, 'Failed to start backend');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

main().catch((error) => {
  logger.error({ error: error instanceof Error ? error.message : error }, 'Unhandled error in main');
  process.exit(1);
});
