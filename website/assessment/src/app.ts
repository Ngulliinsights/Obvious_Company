import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { DatabaseConnection } from './config/database';
import { DatabaseMigrations } from './database/migrations';
import { DatabaseService } from './services/DatabaseService';
import { HealthController } from './controllers/HealthController';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

export class AssessmentApp {
  private app: express.Application;
  private database: DatabaseConnection;
  private databaseService: DatabaseService;

  constructor() {
    this.app = express();
    this.database = new DatabaseConnection(config.database, config.redis);
    this.databaseService = new DatabaseService(this.database.getPool());
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors(config.cors));

    // Rate limiting
    const limiter = rateLimit(config.rateLimit);
    this.app.use('/api/', limiter);

    // Body parsing and compression
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    const healthController = new HealthController(this.databaseService);
    this.app.get('/api/health', healthController.healthCheck);

    // API routes will be added here as we implement more controllers
    this.app.get('/api/assessment/status', (_req, res) => {
      res.json({
        success: true,
        message: 'AI Assessment Platform API is running',
        version: '1.0.0',
      });
    });

    // Serve static files for assessment UI (will be implemented later)
    this.app.use('/assessment', express.static('public'));
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  async initialize(): Promise<void> {
    try {
      // Connect to databases
      await this.database.connect();
      logger.info('Database connections established');

      // Run migrations
      const migrations = new DatabaseMigrations(this.database.getPool());
      await migrations.runMigrations();
      logger.info('Database migrations completed');

      logger.info('Assessment platform initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize assessment platform', { error });
      throw error;
    }
  }

  async start(): Promise<void> {
    await this.initialize();

    const server = this.app.listen(config.port, () => {
      logger.info(`Assessment platform server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await this.database.disconnect();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await this.database.disconnect();
        process.exit(0);
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }
}