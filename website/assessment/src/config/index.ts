import dotenv from 'dotenv';
import { DatabaseConfig, RedisConfig } from './database';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env['ASSESSMENT_PORT'] || '3001', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  
  database: {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    database: process.env['DB_NAME'] || 'ai_assessment',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || '',
    ssl: process.env['NODE_ENV'] === 'production',
    maxConnections: parseInt(process.env['DB_MAX_CONNECTIONS'] || '20', 10),
  },

  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
    password: process.env['REDIS_PASSWORD'] || undefined,
    db: parseInt(process.env['REDIS_DB'] || '0', 10),
  },

  jwt: {
    secret: process.env['JWT_SECRET'] || 'your-secret-key',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
  },

  cors: {
    origin: process.env['CORS_ORIGINS']?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10), // limit each IP to 100 requests per windowMs
  },
};

export * from './database';