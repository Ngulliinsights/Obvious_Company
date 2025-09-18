---
title: "Authenticationsystem"
type: "framework"
audience: "executives"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationSystem = void 0;
class AuthenticationSystem {
    constructor(config, db, redis, security, privacy) {
        this.requireAuthentication = async (req, res, next) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                const token = authHeader.substring(7);
                try {
                    const decoded = this.security.verifyAccessToken(token);
                    const session = await this.security.validateUserSession(decoded.sessionId);
                    if (!session) {
                        res.status(401).json({ error: 'Invalid session' });
                        return;
                    }
                    const isRestricted = await this.redis.get(`processing_restricted:${session.userId}`);
                    if (isRestricted) {
                        res.status(403).json({ error: 'Data processing restricted' });
                        return;
                    }
                    req.user = session;
                    req.sessionId = session.sessionId;
                    next();
                }
                catch (tokenError) {
                    res.status(401).json({ error: 'Invalid token' });
                    return;
                }
            }
            catch (error) {
                console.error('Authentication middleware error:', error);
                res.status(500).json({ error: 'Authentication error' });
            }
        };
        this.requirePermission = (permission) => {
            return async (req, res, next) => {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                if (!req.user.permissions.includes(permission)) {
                    res.status(403).json({ error: 'Insufficient permissions' });
                    return;
                }
                next();
            };
        };
        this.requireRole = (role) => {
            return async (req, res, next) => {
                if (!req.user) {
                    res.status(401).json({ error: 'Authentication required' });
                    return;
                }
                if (req.user.role !== role) {
                    res.status(403).json({ error: 'Insufficient role' });
                    return;
                }
                next();
            };
        };
        this.config = config;
        this.db = db;
        this.redis = redis;
        this.security = security;
        this.privacy = privacy;
    }
    async registerUser(registration, ipAddress, userAgent) {
        try {
            if (!this.validateRegistrationData(registration)) {
                return { success: false, error: 'Invalid registration data' };
            }
            const existingUser = await this.getUserByEmail(registration.email);
            if (existingUser) {
                return { success: false, error: 'User already exists' };
            }
            if (!this.validatePassword(registration.password)) {
                return { success: false, error: 'Password does not meet policy requirements' };
            }
            const hashedPassword = await this.security.hashPassword(registration.password);
            const userId = this.security.generateSecureId();
            const verificationToken = this.security.generateSecureToken();
            await this.db.query('BEGIN');
            try {
                await this.db.query(`INSERT INTO user_profiles (
            id, email, first_name, last_name, organization, 
            professional, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`, [
                    userId,
                    this.security.sanitizeEmail(registration.email),
                    this.security.sanitizeUserInput(registration.firstName),
                    this.security.sanitizeUserInput(registration.lastName),
                    registration.organization ? this.security.sanitizeUserInput(registration.organization) : null,
                    JSON.stringify({
                        role: registration.role,
                        industry: registration.industry
                    })
                ]);
                await this.db.query(`INSERT INTO user_auth (
            user_id, password_hash, email_verified, verification_token,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())`, [userId, hashedPassword, !this.config.requireEmailVerification, verificationToken]);
                if (registration.consentToProcessing) {
                    await this.privacy.recordConsent({
                        userId,
                        consentType: 'data_processing',
                        consentGiven: true,
                        consentDate: new Date(),
                        consentVersion: '1.0',
                        ipAddress,
                        userAgent
                    });
                }
                if (registration.consentToMarketing) {
                    await this.privacy.recordConsent({
                        userId,
                        consentType: 'marketing',
                        consentGiven: true,
                        consentDate: new Date(),
                        consentVersion: '1.0',
                        ipAddress,
                        userAgent
                    });
                }
                await this.db.query('COMMIT');
                await this.security.logSecurityEvent('user_registered', userId, {
                    email: registration.email,
                    requiresVerification: this.config.requireEmailVerification
                }, ipAddress);
                if (this.config.requireEmailVerification) {
                    await this.sendVerificationEmail(registration.email, verificationToken);
                    return {
                        success: true,
                        requiresVerification: true
                    };
                }
                const session = await this.security.createUserSession(userId, registration.email, 'user', ['assessment:take', 'profile:read', 'profile:update'], ipAddress, userAgent);
                const accessToken = this.security.generateAccessToken({
                    userId,
                    sessionId: session.sessionId,
                    email: registration.email,
                    role: 'user'
                });
                return {
                    success: true,
                    user: session,
                    accessToken
                };
            }
            catch (error) {
                await this.db.query('ROLLBACK');
                throw error;
            }
        }
        catch (error) {
            console.error('User registration error:', error);
            return { success: false, error: 'Registration failed' };
        }
    }
    async authenticateUser(credentials, ipAddress, userAgent) {
        try {
            const email = this.security.sanitizeEmail(credentials.email);
            const rateLimitCheck = await this.security.checkLoginAttempts(email);
            if (!rateLimitCheck.allowed) {
                return {
                    success: false,
                    error: `Too many login attempts. Try again after ${rateLimitCheck.lockoutExpires?.toLocaleString()}`
                };
            }
            const user = await this.getUserByEmail(email);
            if (!user) {
                await this.security.recordLoginAttempt(email, false);
                return { success: false, error: 'Invalid credentials' };
            }
            const passwordValid = await this.security.verifyPassword(credentials.password, user.passwordHash);
            if (!passwordValid) {
                await this.security.recordLoginAttempt(email, false);
                return { success: false, error: 'Invalid credentials' };
            }
            if (this.config.requireEmailVerification && !user.emailVerified) {
                return {
                    success: false,
                    requiresVerification: true,
                    error: 'Email verification required'
                };
            }
            if (user.accountLocked) {
                return { success: false, error: 'Account is locked' };
            }
            await this.security.recordLoginAttempt(email, true);
            await this.db.query(`UPDATE user_auth SET last_login = NOW() WHERE user_id = $1`, [user.id]);
            const session = await this.security.createUserSession(user.id, user.email, user.role || 'user', this.getUserPermissions(user.role || 'user'), ipAddress, userAgent);
            const accessToken = this.security.generateAccessToken({
                userId: user.id,
                sessionId: session.sessionId,
                email: user.email,
                role: user.role || 'user'
            });
            const refreshToken = credentials.rememberMe ?
                this.security.generateAccessToken({
                    userId: user.id,
                    type: 'refresh'
                }) : undefined;
            await this.security.logSecurityEvent('user_authenticated', user.id, {
                email: user.email,
                ipAddress,
                userAgent
            }, ipAddress);
            return {
                success: true,
                user: session,
                accessToken,
                refreshToken
            };
        }
        catch (error) {
            console.error('Authentication error:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }
    async verifyEmail(token) {
        try {
            const result = await this.db.query(`UPDATE user_auth 
         SET email_verified = TRUE, verification_token = NULL
         WHERE verification_token = $1 AND email_verified = FALSE`, [token]);
            return result.rowCount > 0;
        }
        catch (error) {
            console.error('Email verification error:', error);
            return false;
        }
    }
    async resendVerificationEmail(email) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user || user.emailVerified) {
                return false;
            }
            const newToken = this.security.generateSecureToken();
            await this.db.query(`UPDATE user_auth SET verification_token = $1 WHERE user_id = $2`, [newToken, user.id]);
            await this.sendVerificationEmail(email, newToken);
            return true;
        }
        catch (error) {
            console.error('Resend verification error:', error);
            return false;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const result = await this.db.query(`SELECT password_hash FROM user_auth WHERE user_id = $1`, [userId]);
            if (result.length === 0) {
                return false;
            }
            const currentHash = result[0].password_hash;
            const isValid = await this.security.verifyPassword(currentPassword, currentHash);
            if (!isValid) {
                return false;
            }
            if (!this.validatePassword(newPassword)) {
                return false;
            }
            if (await this.isPasswordReused(userId, newPassword)) {
                return false;
            }
            const newHash = await this.security.hashPassword(newPassword);
            await this.db.query(`UPDATE user_auth 
         SET password_hash = $1, password_changed_at = NOW()
         WHERE user_id = $2`, [newHash, userId]);
            await this.db.query(`INSERT INTO password_history (user_id, password_hash, created_at)
         VALUES ($1, $2, NOW())`, [userId, currentHash]);
            await this.security.invalidateAllUserSessions(userId);
            await this.security.logSecurityEvent('password_changed', userId);
            return true;
        }
        catch (error) {
            console.error('Password change error:', error);
            return false;
        }
    }
    async resetPassword(email) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                return false;
            }
            const resetToken = this.security.generateSecureToken();
            const expiresAt = new Date(Date.now() + 3600000);
            await this.db.query(`UPDATE user_auth 
         SET reset_token = $1, reset_token_expires = $2
         WHERE user_id = $3`, [resetToken, expiresAt, user.id]);
            await this.sendPasswordResetEmail(email, resetToken);
            await this.security.logSecurityEvent('password_reset_requested', user.id, {
                email
            });
            return true;
        }
        catch (error) {
            console.error('Password reset error:', error);
            return false;
        }
    }
    async confirmPasswordReset(token, newPassword) {
        try {
            if (!this.validatePassword(newPassword)) {
                return false;
            }
            const result = await this.db.query(`SELECT user_id FROM user_auth 
         WHERE reset_token = $1 AND reset_token_expires > NOW()`, [token]);
            if (result.length === 0) {
                return false;
            }
            const userId = result[0].user_id;
            if (await this.isPasswordReused(userId, newPassword)) {
                return false;
            }
            const newHash = await this.security.hashPassword(newPassword);
            await this.db.query(`UPDATE user_auth 
         SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL,
             password_changed_at = NOW()
         WHERE user_id = $2`, [newHash, userId]);
            await this.security.invalidateAllUserSessions(userId);
            await this.security.logSecurityEvent('password_reset_completed', userId);
            return true;
        }
        catch (error) {
            console.error('Password reset confirmation error:', error);
            return false;
        }
    }
    async getUserByEmail(email) {
        try {
            const result = await this.db.query(`SELECT up.id, up.email, up.first_name, up.last_name, up.professional,
                ua.password_hash, ua.email_verified, ua.account_locked, ua.role
         FROM user_profiles up
         JOIN user_auth ua ON up.id = ua.user_id
         WHERE up.email = $1`, [email]);
            return result.length > 0 ? result[0] : null;
        }
        catch (error) {
            console.error('Get user by email error:', error);
            return null;
        }
    }
    validateRegistrationData(registration) {
        return !!(registration.email &&
            registration.password &&
            registration.firstName &&
            registration.lastName &&
            registration.consentToProcessing);
    }
    validatePassword(password) {
        const policy = this.config.passwordPolicy;
        if (password.length < policy.minLength)
            return false;
        if (policy.requireUppercase && !/[A-Z]/.test(password))
            return false;
        if (policy.requireLowercase && !/[a-z]/.test(password))
            return false;
        if (policy.requireNumbers && !/\d/.test(password))
            return false;
        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password))
            return false;
        return true;
    }
    async isPasswordReused(userId, newPassword) {
        try {
            const result = await this.db.query(`SELECT password_hash FROM password_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`, [userId, this.config.passwordPolicy.preventReuse]);
            for (const row of result) {
                if (await this.security.verifyPassword(newPassword, row.password_hash)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            console.error('Password reuse check error:', error);
            return false;
        }
    }
    getUserPermissions(role) {
        const permissions = {
            'user': ['assessment:take', 'profile:read', 'profile:update'],
            'admin': ['assessment:take', 'assessment:manage', 'profile:read', 'profile:update', 'users:manage'],
            'analyst': ['assessment:take', 'assessment:view', 'analytics:read', 'profile:read', 'profile:update']
        };
        return permissions[role] || permissions['user'];
    }
    async sendVerificationEmail(email, token) {
        console.log(`Verification email sent to ${email} with token ${token}`);
    }
    async sendPasswordResetEmail(email, token) {
        console.log(`Password reset email sent to ${email} with token ${token}`);
    }
}
exports.AuthenticationSystem = AuthenticationSystem;
//# sourceMappingURL=AuthenticationSystem.js.map