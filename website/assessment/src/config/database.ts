import { Pool, PoolConfig } from 'pg';
import { createClient, RedisClientType } from 'redis';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db?: number;
}

export class DatabaseConnection {
  private pool: Pool;
  private redisClient: RedisClientType;

  constructor(dbConfig: DatabaseConfig, redisConfig: RedisConfig) {
    // PostgreSQL connection pool
    const poolConfig: PoolConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl,
      max: dbConfig.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    this.pool = new Pool(poolConfig);

    // Redis connection
    this.redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
      },
      password: redisConfig.password || undefined,
      database: redisConfig.db || 0,
    });
  }

  async connect(): Promise<void> {
    try {
      // Test PostgreSQL connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      // Connect to Redis
      await this.redisClient.connect();

      console.log('Database connections established successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    await this.redisClient.disconnect();
  }

  getPool(): Pool {
    return this.pool;
  }

  getRedisClient(): RedisClientType {
    return this.redisClient;
  }

  async query(text: string, params?: unknown[]): Promise<unknown> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}