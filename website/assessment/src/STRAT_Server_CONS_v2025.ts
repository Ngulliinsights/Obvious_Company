---
title: "Server"
type: "strategic"
audience: "consultants"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { AssessmentApp } from './app';
import { logger } from './utils/logger';

async function startServer(): Promise<void> {
  try {
    const app = new AssessmentApp();
    await app.start();
  } catch (error) {
    logger.error('Failed to start assessment platform server', { error });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

startServer();