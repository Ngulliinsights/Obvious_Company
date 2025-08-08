import { Router, Request, Response } from 'express';
import { AuditSystem } from './index';
import { body, query, validationResult } from 'express-validator';

export function createAuditRoutes(auditSystem: AuditSystem): Router {
  const router = Router();
  const auditLogger = auditSystem.getAuditLogger();
  const complianceMonitor = auditSystem.getComplianceMonitor();
  const dataAnonymizer = auditSystem.getDataAnonymizer();
  const securityTester = auditSystem.getSecurityTester();

  // Middleware to check if user has admin access
  const requireAdmin = (req: Request, res: Response, next: any) => {
    // In a real implementation, check user permissions
    // For now, allow access (should be restricted in production)
    next();
  };

  /**
   * Get audit logs with filtering
   */
  router.get('/logs', 
    requireAdmin,
    [
      query('eventType').optional().isString(),
      query('userId').optional().isString(),
      query('resource').optional().isString(),
      query('action').optional().isString(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
      query('limit').optional().isInt({ min: 1, max: 1000 }),
      query('offset').optional().isInt({ min: 0 })
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array()
          });
        }

        const query = {
          eventType: req.query.eventType as string,
          userId: req.query.userId as string,
          resource: req.query.resource as string,
          action: req.query.action as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
          severity: req.query.severity ? [req.query.severity as string] : undefined,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
          offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const logs = await auditLogger.queryLogs(query);

        res.json({
          success: true,
          data: logs,
          total: logs.length,
          query: query
        });
      } catch (error) {
        console.error('Failed to retrieve audit logs:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve audit logs'
        });
      }
    }
  );

  /**
   * Generate compliance report
   */
  router.post('/compliance/report',
    requireAdmin,
    [
      body('startDate').isISO8601(),
      body('endDate').isISO8601()
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array()
          });
        }

        const { startDate, endDate } = req.body;
        const report = await auditSystem.generateComplianceReport(
          new Date(startDate),
          new Date(endDate)
        );

        res.json({
          success: true,
          data: report
        });
      } catch (error) {
        console.error('Failed to generate compliance report:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate compliance report'
        });
      }
    }
  );

  /**
   * Get compliance metrics
   */
  router.get('/compliance/metrics',
    requireAdmin,
    [
      query('days').optional().isInt({ min: 1, max: 365 })
    ],
    async (req: Request, res: Response) => {
      try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const metrics = await complianceMonitor.getComplianceMetrics(days);

        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        console.error('Failed to get compliance metrics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get compliance metrics'
        });
      }
    }
  );

  /**
   * Run compliance check
   */
  router.post('/compliance/check',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const violations = await complianceMonitor.checkCompliance();

        res.json({
          success: true,
          data: {
            violationsFound: violations.length,
            violations: violations
          }
        });
      } catch (error) {
        console.error('Failed to run compliance check:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to run compliance check'
        });
      }
    }
  );

  /**
   * Resolve compliance violation
   */
  router.post('/compliance/violations/:violationId/resolve',
    requireAdmin,
    [
      body('resolvedBy').isString().notEmpty(),
      body('notes').optional().isString()
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array()
          });
        }

        const { violationId } = req.params;
        const { resolvedBy, notes } = req.body;

        await complianceMonitor.resolveViolation(violationId, resolvedBy, notes);

        res.json({
          success: true,
          message: 'Violation resolved successfully'
        });
      } catch (error) {
        console.error('Failed to resolve violation:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to resolve violation'
        });
      }
    }
  );

  /**
   * Get anonymized analytics data
   */
  router.get('/analytics/anonymized',
    requireAdmin,
    [
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601()
    ],
    async (req: Request, res: Response) => {
      try {
        const startDate = req.query.startDate 
          ? new Date(req.query.startDate as string)
          : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        
        const endDate = req.query.endDate 
          ? new Date(req.query.endDate as string)
          : new Date();

        const analyticsData = await dataAnonymizer.anonymizeForAnalytics(startDate, endDate);

        res.json({
          success: true,
          data: analyticsData,
          period: { startDate, endDate }
        });
      } catch (error) {
        console.error('Failed to get anonymized analytics:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get anonymized analytics'
        });
      }
    }
  );

  /**
   * Export anonymized assessment data
   */
  router.get('/data/assessment/export',
    requireAdmin,
    [
      query('assessmentType').optional().isString()
    ],
    async (req: Request, res: Response) => {
      try {
        const assessmentType = req.query.assessmentType as string;
        const anonymizedData = await dataAnonymizer.anonymizeAssessmentData(assessmentType);

        res.json({
          success: true,
          data: anonymizedData,
          recordCount: anonymizedData.length,
          assessmentType: assessmentType || 'all'
        });
      } catch (error) {
        console.error('Failed to export anonymized assessment data:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to export anonymized assessment data'
        });
      }
    }
  );

  /**
   * Create anonymized cohorts
   */
  router.post('/data/cohorts',
    requireAdmin,
    [
      body('startDate').optional().isISO8601(),
      body('endDate').optional().isISO8601(),
      body('criteria').optional().isObject()
    ],
    async (req: Request, res: Response) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            errors: errors.array()
          });
        }

        const cohortCriteria = {
          startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(),
          ...req.body.criteria
        };

        const cohorts = await dataAnonymizer.createAnonymizedCohorts(cohortCriteria);

        res.json({
          success: true,
          data: cohorts,
          cohortCount: cohorts.length
        });
      } catch (error) {
        console.error('Failed to create anonymized cohorts:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create anonymized cohorts'
        });
      }
    }
  );

  /**
   * Run security tests
   */
  router.post('/security/test',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const results = await securityTester.runAllTests();

        res.json({
          success: true,
          data: {
            testsRun: results.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            warnings: results.filter(r => r.status === 'warning').length,
            errors: results.filter(r => r.status === 'error').length,
            totalVulnerabilities: results.reduce((sum, r) => sum + r.vulnerabilities.length, 0),
            results: results
          }
        });
      } catch (error) {
        console.error('Failed to run security tests:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to run security tests'
        });
      }
    }
  );

  /**
   * Get security test history
   */
  router.get('/security/history',
    requireAdmin,
    [
      query('days').optional().isInt({ min: 1, max: 365 }),
      query('testId').optional().isString()
    ],
    async (req: Request, res: Response) => {
      try {
        const days = req.query.days ? parseInt(req.query.days as string) : 30;
        const testId = req.query.testId as string;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        let query = `
          SELECT * FROM security_test_results 
          WHERE timestamp >= $1
        `;
        const params: any[] = [startDate];

        if (testId) {
          query += ` AND test_id = $2`;
          params.push(testId);
        }

        query += ` ORDER BY timestamp DESC`;

        const result = await auditSystem['db'].query(query, params);

        res.json({
          success: true,
          data: result.rows,
          period: { startDate, endDate: new Date() }
        });
      } catch (error) {
        console.error('Failed to get security test history:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get security test history'
        });
      }
    }
  );

  /**
   * Get security vulnerabilities
   */
  router.get('/security/vulnerabilities',
    requireAdmin,
    [
      query('resolved').optional().isBoolean(),
      query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
      query('category').optional().isString()
    ],
    async (req: Request, res: Response) => {
      try {
        let query = `SELECT * FROM security_vulnerabilities WHERE 1=1`;
        const params: any[] = [];
        let paramCount = 0;

        if (req.query.resolved !== undefined) {
          query += ` AND resolved = $${++paramCount}`;
          params.push(req.query.resolved === 'true');
        }

        if (req.query.severity) {
          query += ` AND severity = $${++paramCount}`;
          params.push(req.query.severity);
        }

        if (req.query.category) {
          query += ` AND category = $${++paramCount}`;
          params.push(req.query.category);
        }

        query += ` ORDER BY detected_at DESC`;

        const result = await auditSystem['db'].query(query, params);

        res.json({
          success: true,
          data: result.rows,
          total: result.rows.length
        });
      } catch (error) {
        console.error('Failed to get security vulnerabilities:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get security vulnerabilities'
        });
      }
    }
  );

  /**
   * Get audit system status
   */
  router.get('/status',
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Get system status information
        const status = {
          auditSystem: {
            initialized: auditSystem['initialized'],
            uptime: process.uptime()
          },
          database: {
            connected: true // Would check actual DB connection
          },
          monitoring: {
            complianceMonitoring: true, // Would check if monitoring is active
            securityTesting: true // Would check if testing is active
          },
          metrics: {
            totalAuditLogs: await getTotalAuditLogs(auditSystem),
            recentViolations: await getRecentViolations(auditSystem),
            lastSecurityTest: await getLastSecurityTest(auditSystem)
          }
        };

        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        console.error('Failed to get audit system status:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get audit system status'
        });
      }
    }
  );

  return router;
}

/**
 * Helper functions
 */
async function getTotalAuditLogs(auditSystem: AuditSystem): Promise<number> {
  try {
    const result = await auditSystem['db'].query('SELECT COUNT(*) as count FROM audit_logs');
    return parseInt(result.rows[0].count);
  } catch (error) {
    return 0;
  }
}

async function getRecentViolations(auditSystem: AuditSystem): Promise<number> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await auditSystem['db'].query(
      'SELECT COUNT(*) as count FROM compliance_violations WHERE detected_at >= $1 AND resolved = false',
      [oneDayAgo]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    return 0;
  }
}

async function getLastSecurityTest(auditSystem: AuditSystem): Promise<string | null> {
  try {
    const result = await auditSystem['db'].query(
      'SELECT MAX(timestamp) as last_test FROM security_test_results'
    );
    return result.rows[0].last_test;
  } catch (error) {
    return null;
  }
}