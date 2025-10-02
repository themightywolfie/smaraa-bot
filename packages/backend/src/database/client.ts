import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'database-client' });

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseClient {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.maxConnections || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle client');
    });

    // Handle pool connection events
    this.pool.on('connect', (client) => {
      logger.debug('New client connected to database');
      this.isConnected = true;
    });

    this.pool.on('remove', (client) => {
      logger.debug('Client removed from pool');
    });
  }

  /**
   * Execute a query with parameters
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    const queryId = Math.random().toString(36).substring(7);
    
    try {
      logger.debug({ queryId, text, params }, 'Executing query');
      
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug({ 
        queryId, 
        duration, 
        rowCount: result.rowCount 
      }, 'Query completed');
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({ 
        queryId, 
        text, 
        params, 
        duration, 
        error: error instanceof Error ? error.message : error 
      }, 'Query failed');
      
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const transactionId = Math.random().toString(36).substring(7);
    
    try {
      logger.debug({ transactionId }, 'Starting transaction');
      
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      
      logger.debug({ transactionId }, 'Transaction committed');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ 
        transactionId, 
        error: error instanceof Error ? error.message : error 
      }, 'Transaction rolled back');
      
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for manual transaction management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Check database connectivity and health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return result.rows.length === 1 && result.rows[0].health_check === 1;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Health check failed');
      return false;
    }
  }

  /**
   * Check if pgvector extension is available
   */
  async checkPgVectorExtension(): Promise<boolean> {
    try {
      const result = await this.query(
        "SELECT 1 FROM pg_extension WHERE extname = 'vector'"
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'pgvector extension check failed');
      return false;
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected,
    };
  }

  /**
   * Close all connections in the pool
   */
  async close(): Promise<void> {
    logger.info('Closing database connection pool');
    await this.pool.end();
    this.isConnected = false;
  }

  /**
   * Graceful shutdown with timeout
   */
  async gracefulShutdown(timeoutMs: number = 5000): Promise<void> {
    logger.info({ timeoutMs }, 'Starting graceful database shutdown');
    
    const shutdownPromise = this.close();
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Database shutdown timeout')), timeoutMs);
    });

    try {
      await Promise.race([shutdownPromise, timeoutPromise]);
      logger.info('Database shutdown completed');
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : error }, 'Database shutdown failed');
      throw error;
    }
  }
}

/**
 * Parse DATABASE_URL into connection config
 */
function parseDatabaseUrl(url: string): Partial<DatabaseConfig> {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 5432,
      database: parsed.pathname.slice(1), // Remove leading slash
      user: parsed.username,
      password: parsed.password,
    };
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Create database client from environment variables
 */
export function createDatabaseClient(): DatabaseClient {
  let config: DatabaseConfig;

  // Support both DATABASE_URL and individual environment variables
  if (process.env.DATABASE_URL) {
    const urlConfig = parseDatabaseUrl(process.env.DATABASE_URL);
    config = {
      host: urlConfig.host || 'localhost',
      port: urlConfig.port || 5432,
      database: urlConfig.database || 'smaraa_bot',
      user: urlConfig.user || 'postgres',
      password: urlConfig.password || 'postgres',
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    };
  } else {
    config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'smaraa_bot',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    };
  }

  return new DatabaseClient(config);
}