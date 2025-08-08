/**
 * Database connection utilities for the AI Integration Assessment Platform
 * Supports both PostgreSQL (production) and SQLite (development/testing)
 */

import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Database configuration interface
interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Database connection class
export class DatabaseConnection {
  private pool: Pool | null = null;
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    this.config = config || this.getDefaultConfig();
  }

  private getDefaultConfig(): DatabaseConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'assessment_platform',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };
  }

  /**
   * Initialize the database connection pool
   */
  public async connect(): Promise<void> {
    try {
      this.pool = new Pool(this.config);
      
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Get a client from the connection pool
   */
  public async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return await this.pool.connect();
  }

  /**
   * Execute a query with automatic client management
   */
  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize database schema
   */
  public async initializeSchema(): Promise<void> {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await this.query(statement);
      }
      
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  /**
   * Close the database connection pool
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection closed');
    }
  }

  /**
   * Health check for the database connection
   */
  public async healthCheck(): Promise<{ status: string; timestamp: Date; latency: number }> {
    const startTime = Date.now();
    try {
      await this.query('SELECT 1');
      const latency = Date.now() - startTime;
      return {
        status: 'healthy',
        timestamp: new Date(),
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        latency: Date.now() - startTime
      };
    }
  }
}

// Singleton instance for application-wide use
let dbInstance: DatabaseConnection | null = null;

/**
 * Get the singleton database instance
 */
export function getDatabase(): DatabaseConnection {
  if (!dbInstance) {
    dbInstance = new DatabaseConnection();
  }
  return dbInstance;
}

/**
 * Initialize the database connection and schema
 */
export async function initializeDatabase(): Promise<DatabaseConnection> {
  const db = getDatabase();
  await db.connect();
  
  // Only initialize schema in development or if explicitly requested
  if (process.env.NODE_ENV !== 'production' || process.env.INIT_SCHEMA === 'true') {
    await db.initializeSchema();
  }
  
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}