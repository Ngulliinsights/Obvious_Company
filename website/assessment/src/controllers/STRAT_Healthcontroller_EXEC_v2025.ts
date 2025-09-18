---
title: "Healthcontroller"
type: "strategic"
audience: "executives"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { asyncHandler } from '../middleware/errorHandler';

export class HealthController {
  constructor(private databaseService: DatabaseService) {}

  healthCheck = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const dbHealthy = await this.databaseService.healthCheck();
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'up' : 'down',
        api: 'up',
      },
      version: process.env['npm_package_version'] || '1.0.0',
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  });
}