import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AssessmentError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const { statusCode = 500, message } = error;

  // Log error for monitoring
  console.error(`Error ${statusCode}: ${message}`, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack,
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  const errorMessage = error.isOperational || isDevelopment ? message : 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
      ...(isDevelopment && { stack: error.stack }),
    },
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
    },
  });
};