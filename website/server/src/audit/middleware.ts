import { Request, Response, NextFunction } from 'express';
import { AuditSystem } from './index';

export interface AuditMiddlewareConfig {
  auditSystem: AuditSystem;
  excludePaths?: string[];
  sensitiveFields?: string[];
  logLevel?: 'all' | 'sensitive_only' | 'errors_only';
}

/**
 * Middleware to automatically log user interactions and data access
 */
export function createAuditMiddleware(config: AuditMiddlewareConfig) {
  const { auditSystem, excludePaths = [], sensitiveFields = [], logLevel = 'all' } = config;
  const auditLogger = auditSystem.getAuditLogger();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip static files
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    const startTime = Date.now();
    const sessionId = req.session?.id || req.headers['x-session-id'] as string || 'anonymous';
    const userId = req.user?.id || req.body?.userId || req.query?.userId as string;

    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any;
    let responseLogged = false;

    // Override response methods to capture response data
    res.send = function(body: any) {
      if (!responseLogged) {
        responseBody = body;
        logResponse();
      }
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      if (!responseLogged) {
        responseBody = body;
        logResponse();
      }
      return originalJson.call(this, body);
    };

    // Log the request
    try {
      const shouldLog = logLevel === 'all' || 
                       (logLevel === 'sensitive_only' && containsSensitiveData(req)) ||
                       (logLevel === 'errors_only' && false); // Will be set to true for errors

      if (shouldLog) {
        await auditLogger.logEvent({
          eventType: 'http_request',
          userId,
          sessionId,
          resource: req.path,
          action: req.method.toLowerCase(),
          details: {
            method: req.method,
            path: req.path,
            query: sanitizeData(req.query, sensitiveFields),
            body: sanitizeData(req.body, sensitiveFields),
            headers: sanitizeHeaders(req.headers),
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer')
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: determineSeverity(req),
          complianceFlags: determineComplianceFlags(req)
        });
      }
    } catch (error) {
      console.error('Audit logging failed for request:', error);
    }

    // Function to log response
    const logResponse = async () => {
      if (responseLogged) return;
      responseLogged = true;

      try {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const isError = res.statusCode >= 400;

        const shouldLogResponse = logLevel === 'all' || 
                                 (logLevel === 'errors_only' && isError) ||
                                 (logLevel === 'sensitive_only' && containsSensitiveData(req));

        if (shouldLogResponse) {
          await auditLogger.logEvent({
            eventType: 'http_response',
            userId,
            sessionId,
            resource: req.path,
            action: `${req.method.toLowerCase()}_response`,
            details: {
              statusCode: res.statusCode,
              duration,
              responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
              success: res.statusCode < 400,
              errorDetails: isError ? sanitizeData(responseBody, sensitiveFields) : undefined
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            severity: isError ? 'medium' : 'low',
            complianceFlags: isError ? ['error_response'] : []
          });
        }

        // Log data access for specific endpoints
        if (req.path.startsWith('/api/') && req.method === 'GET' && res.statusCode === 200) {
          await auditLogger.logDataAccess(
            userId || 'anonymous',
            req.path,
            'read',
            {
              endpoint: req.path,
              query: req.query,
              responseSize: responseBody ? JSON.stringify(responseBody).length : 0
            },
            req
          );
        }

        // Log data modification for POST/PUT/DELETE
        if (['POST', 'PUT', 'DELETE'].includes(req.method) && res.statusCode < 400) {
          await auditLogger.logDataAccess(
            userId || 'anonymous',
            req.path,
            req.method.toLowerCase(),
            {
              endpoint: req.path,
              requestData: sanitizeData(req.body, sensitiveFields),
              success: true
            },
            req
          );
        }
      } catch (error) {
        console.error('Audit logging failed for response:', error);
      }
    };

    // Handle response end event as fallback
    res.on('finish', () => {
      if (!responseLogged) {
        logResponse();
      }
    });

    next();
  };
}

/**
 * Middleware specifically for assessment interactions
 */
export function createAssessmentAuditMiddleware(config: AuditMiddlewareConfig) {
  const auditLogger = config.auditSystem.getAuditLogger();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to assessment-related endpoints
    if (!req.path.startsWith('/api/assessment')) {
      return next();
    }

    const sessionId = req.session?.id || req.headers['x-session-id'] as string || `session_${Date.now()}`;
    const userId = req.user?.id || req.body?.userId || 'anonymous';

    try {
      // Log assessment interaction
      await auditLogger.logAssessmentInteraction(
        sessionId,
        userId,
        determineAssessmentAction(req),
        {
          assessmentType: req.body?.assessmentType || req.query?.type,
          questionId: req.body?.questionId,
          responseData: req.body?.response ? 'provided' : 'none',
          step: req.body?.step || req.query?.step,
          progress: req.body?.progress
        },
        req
      );
    } catch (error) {
      console.error('Assessment audit logging failed:', error);
    }

    next();
  };
}

/**
 * Middleware for authentication events
 */
export function createAuthAuditMiddleware(config: AuditMiddlewareConfig) {
  const auditLogger = config.auditSystem.getAuditLogger();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to auth-related endpoints
    if (!req.path.startsWith('/api/auth') && !req.path.startsWith('/api/login')) {
      return next();
    }

    const originalSend = res.send;
    const originalJson = res.json;

    // Override response methods to capture auth results
    res.send = function(body: any) {
      logAuthEvent(body);
      return originalSend.call(this, body);
    };

    res.json = function(body: any) {
      logAuthEvent(body);
      return originalJson.call(this, body);
    };

    const logAuthEvent = async (responseBody: any) => {
      try {
        const success = res.statusCode === 200 && responseBody?.success !== false;
        const userId = success ? (responseBody?.userId || req.body?.email) : undefined;

        await auditLogger.logAuthentication(
          determineAuthAction(req),
          userId,
          {
            success,
            method: req.body?.method || 'password',
            endpoint: req.path,
            statusCode: res.statusCode,
            errorMessage: success ? undefined : responseBody?.message
          },
          req
        );
      } catch (error) {
        console.error('Auth audit logging failed:', error);
      }
    };

    next();
  };
}

/**
 * Helper functions
 */
function containsSensitiveData(req: Request): boolean {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'email', 'phone', 'ssn'];
  const requestData = JSON.stringify({ ...req.body, ...req.query }).toLowerCase();
  
  return sensitiveFields.some(field => requestData.includes(field));
}

function sanitizeData(data: any, sensitiveFields: string[]): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const defaultSensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];

  for (const field of allSensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Also check for nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, sensitiveFields);
    }
  }

  return sanitized;
}

function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

function determineSeverity(req: Request): 'low' | 'medium' | 'high' | 'critical' {
  if (req.method === 'DELETE') return 'high';
  if (req.method === 'POST' && req.path.includes('admin')) return 'high';
  if (containsSensitiveData(req)) return 'medium';
  return 'low';
}

function determineComplianceFlags(req: Request): string[] {
  const flags: string[] = [];
  
  if (containsSensitiveData(req)) flags.push('personal_data');
  if (req.body?.email || req.query?.email) flags.push('personal_identifier');
  if (req.path.includes('assessment')) flags.push('assessment_data');
  if (req.path.includes('export')) flags.push('data_export');
  
  return flags;
}

function determineAssessmentAction(req: Request): string {
  if (req.method === 'POST' && req.path.includes('start')) return 'start_assessment';
  if (req.method === 'POST' && req.path.includes('response')) return 'submit_response';
  if (req.method === 'POST' && req.path.includes('complete')) return 'complete_assessment';
  if (req.method === 'GET') return 'view_assessment';
  return 'assessment_interaction';
}

function determineAuthAction(req: Request): string {
  if (req.path.includes('login')) return 'login_attempt';
  if (req.path.includes('logout')) return 'logout';
  if (req.path.includes('register')) return 'registration_attempt';
  if (req.path.includes('reset')) return 'password_reset';
  return 'auth_interaction';
}