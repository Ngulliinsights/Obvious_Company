/**
 * Authorization Service
 * Handles role-based access control and permission management
 */

import { SecurityPermission, UserRole, SecurityContext, SecurityEventType } from './types';
import { SecurityConfig } from './SecurityConfig';

export class AuthorizationService {
  private static instance: AuthorizationService;
  private roles = new Map<string, UserRole>();
  private userRoles = new Map<string, string[]>();

  private constructor() {
    this.initializeDefaultRoles();
  }

  public static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService();
    }
    return AuthorizationService.instance;
  }

  /**
   * Initialize default roles for the assessment platform
   */
  private initializeDefaultRoles(): void {
    // Anonymous user role (for assessment takers)
    this.createRole('anonymous', [
      { resource: 'assessment', action: 'take' },
      { resource: 'assessment', action: 'view_results' },
      { resource: 'public_content', action: 'read' }
    ]);

    // Registered user role
    this.createRole('user', [
      { resource: 'assessment', action: 'take' },
      { resource: 'assessment', action: 'view_results' },
      { resource: 'assessment', action: 'save_progress' },
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update' },
      { resource: 'curriculum', action: 'access' }
    ]);

    // Assessment administrator role
    this.createRole('assessment_admin', [
      { resource: 'assessment', action: '*' },
      { resource: 'assessment_data', action: 'read' },
      { resource: 'assessment_data', action: 'export' },
      { resource: 'analytics', action: 'read' },
      { resource: 'user_data', action: 'read' }
    ]);

    // System administrator role
    this.createRole('system_admin', [
      { resource: '*', action: '*' }
    ]);

    // Data protection officer role
    this.createRole('dpo', [
      { resource: 'user_data', action: 'read' },
      { resource: 'user_data', action: 'delete' },
      { resource: 'user_data', action: 'anonymize' },
      { resource: 'audit_logs', action: 'read' },
      { resource: 'privacy_settings', action: 'manage' },
      { resource: 'data_retention', action: 'manage' }
    ]);

    // Analytics role
    this.createRole('analyst', [
      { resource: 'analytics', action: 'read' },
      { resource: 'assessment_data', action: 'read' },
      { resource: 'reports', action: 'generate' },
      { resource: 'insights', action: 'create' }
    ]);
  }

  /**
   * Create a new role
   */
  public createRole(name: string, permissions: SecurityPermission[]): UserRole {
    const role: UserRole = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      permissions,
      isActive: true
    };

    this.roles.set(name, role);
    return role;
  }

  /**
   * Assign role to user
   */
  public assignRole(userId: string, roleName: string): boolean {
    if (!this.roles.has(roleName)) {
      console.error(`Role ${roleName} does not exist`);
      return false;
    }

    const userRoles = this.userRoles.get(userId) || [];
    if (!userRoles.includes(roleName)) {
      userRoles.push(roleName);
      this.userRoles.set(userId, userRoles);
    }

    return true;
  }

  /**
   * Remove role from user
   */
  public removeRole(userId: string, roleName: string): boolean {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) {
      return false;
    }

    const index = userRoles.indexOf(roleName);
    if (index > -1) {
      userRoles.splice(index, 1);
      this.userRoles.set(userId, userRoles);
      return true;
    }

    return false;
  }

  /**
   * Check if user has permission
   */
  public hasPermission(userId: string, resource: string, action: string, context?: Record<string, any>): boolean {
    const userRoles = this.userRoles.get(userId) || ['anonymous'];
    
    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (!role || !role.isActive) {
        continue;
      }

      for (const permission of role.permissions) {
        if (this.matchesPermission(permission, resource, action, context)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if permission matches resource and action
   */
  private matchesPermission(permission: SecurityPermission, resource: string, action: string, context?: Record<string, any>): boolean {
    // Check resource match
    if (permission.resource !== '*' && permission.resource !== resource) {
      return false;
    }

    // Check action match
    if (permission.action !== '*' && permission.action !== action) {
      return false;
    }

    // Check conditions if specified
    if (permission.conditions && context) {
      for (const [key, value] of Object.entries(permission.conditions)) {
        if (context[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get user permissions
   */
  public getUserPermissions(userId: string): SecurityPermission[] {
    const userRoles = this.userRoles.get(userId) || ['anonymous'];
    const permissions: SecurityPermission[] = [];

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (role && role.isActive) {
        permissions.push(...role.permissions);
      }
    }

    return permissions;
  }

  /**
   * Get user roles
   */
  public getUserRoles(userId: string): string[] {
    return this.userRoles.get(userId) || ['anonymous'];
  }

  /**
   * Create security context for user
   */
  public createSecurityContext(userId: string, sessionId: string, ipAddress: string, userAgent: string): SecurityContext {
    const roles = this.getUserRoles(userId);
    const permissions = this.getUserPermissions(userId);

    return {
      userId,
      sessionId,
      roles,
      permissions,
      ipAddress,
      userAgent,
      timestamp: new Date()
    };
  }

  /**
   * Check assessment access permissions
   */
  public canAccessAssessment(userId: string, assessmentId: string, action: string): boolean {
    // Basic assessment access
    if (this.hasPermission(userId, 'assessment', action)) {
      return true;
    }

    // Check if user owns the assessment results
    if (action === 'view_results' && this.isAssessmentOwner(userId, assessmentId)) {
      return true;
    }

    return false;
  }

  /**
   * Check data access permissions with privacy considerations
   */
  public canAccessUserData(requesterId: string, targetUserId: string, dataType: string): boolean {
    // Users can always access their own data
    if (requesterId === targetUserId) {
      return true;
    }

    // Check if requester has admin permissions
    if (this.hasPermission(requesterId, 'user_data', 'read')) {
      return true;
    }

    // Check if requester is a DPO for privacy-related access
    if (dataType === 'privacy' && this.hasPermission(requesterId, 'user_data', 'read')) {
      return true;
    }

    return false;
  }

  /**
   * Check if user owns assessment
   */
  private isAssessmentOwner(userId: string, assessmentId: string): boolean {
    // In a real implementation, this would check the database
    // For now, we'll assume ownership based on session context
    return true; // Placeholder implementation
  }

  /**
   * Validate API access
   */
  public validateApiAccess(userId: string, endpoint: string, method: string): boolean {
    const resource = this.mapEndpointToResource(endpoint);
    const action = this.mapMethodToAction(method);

    return this.hasPermission(userId, resource, action);
  }

  /**
   * Map API endpoint to resource
   */
  private mapEndpointToResource(endpoint: string): string {
    const resourceMap: Record<string, string> = {
      '/api/assessment': 'assessment',
      '/api/assessment-results': 'assessment_data',
      '/api/user': 'user_data',
      '/api/analytics': 'analytics',
      '/api/admin': 'admin',
      '/api/privacy': 'privacy_settings'
    };

    for (const [path, resource] of Object.entries(resourceMap)) {
      if (endpoint.startsWith(path)) {
        return resource;
      }
    }

    return 'unknown';
  }

  /**
   * Map HTTP method to action
   */
  private mapMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      'GET': 'read',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };

    return actionMap[method.toUpperCase()] || 'unknown';
  }

  /**
   * Check rate limiting permissions
   */
  public getRateLimit(userId: string, resource: string): { requests: number; window: number } {
    const userRoles = this.getUserRoles(userId);
    
    // Higher limits for authenticated users
    if (userRoles.includes('system_admin')) {
      return { requests: 1000, window: 60000 }; // 1000 per minute
    }
    
    if (userRoles.includes('assessment_admin')) {
      return { requests: 500, window: 60000 }; // 500 per minute
    }
    
    if (userRoles.includes('user')) {
      return { requests: 100, window: 60000 }; // 100 per minute
    }
    
    // Default for anonymous users
    return { requests: 20, window: 60000 }; // 20 per minute
  }

  /**
   * Log authorization events
   */
  public logAuthorizationEvent(userId: string, resource: string, action: string, granted: boolean, context?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date(),
      userId,
      resource,
      action,
      granted,
      context: context || {},
      userRoles: this.getUserRoles(userId)
    };

    // In production, this would be stored in an audit log
    console.log('Authorization Event:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Get role by name
   */
  public getRole(name: string): UserRole | undefined {
    return this.roles.get(name);
  }

  /**
   * List all roles
   */
  public listRoles(): UserRole[] {
    return Array.from(this.roles.values());
  }

  /**
   * Update role permissions
   */
  public updateRolePermissions(roleName: string, permissions: SecurityPermission[]): boolean {
    const role = this.roles.get(roleName);
    if (!role) {
      return false;
    }

    role.permissions = permissions;
    this.roles.set(roleName, role);
    return true;
  }

  /**
   * Deactivate role
   */
  public deactivateRole(roleName: string): boolean {
    const role = this.roles.get(roleName);
    if (!role) {
      return false;
    }

    role.isActive = false;
    this.roles.set(roleName, role);
    return true;
  }
}