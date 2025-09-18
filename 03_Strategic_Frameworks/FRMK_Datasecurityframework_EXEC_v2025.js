---
title: "Datasecurityframework"
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSecurityFramework = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
class DataSecurityFramework {
    constructor(config, db, redis) {
        this.config = config;
        this.db = db;
        this.redis = redis;
    }
    async hashPassword(password) {
        try {
            const salt = await bcrypt_1.default.genSalt(this.config.bcryptRounds);
            return await bcrypt_1.default.hash(password, salt);
        }
        catch (error) {
            throw new Error(`Password hashing failed: ${error}`);
        }
    }
    async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt_1.default.compare(password, hashedPassword);
        }
        catch (error) {
            throw new Error(`Password verification failed: ${error}`);
        }
    }
    encryptSensitiveData(data) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipher('aes-256-gcm', this.config.encryptionKey);
            cipher.setAAD(Buffer.from('assessment-platform'));
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const authTag = cipher.getAuthTag();
            return {
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            };
        }
        catch (error) {
            throw new Error(`Data encryption failed: ${error}`);
        }
    }
    decryptSensitiveData(encryptedData) {
        try {
            const decipher = crypto_1.default.createDecipher('aes-256-gcm', this.config.encryptionKey);
            decipher.setAAD(Buffer.from('assessment-platform'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            throw new Error(`Data decryption failed: ${error}`);
        }
    }
    generateAccessToken(payload) {
        try {
            return jsonwebtoken_1.default.sign(payload, this.config.jwtSecret, {
                expiresIn: this.config.jwtExpiresIn,
                issuer: 'ai-assessment-platform',
                audience: 'assessment-users'
            });
        }
        catch (error) {
            throw new Error(`Token generation failed: ${error}`);
        }
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.config.jwtSecret, {
                issuer: 'ai-assessment-platform',
                audience: 'assessment-users'
            });
        }
        catch (error) {
            throw new Error(`Token verification failed: ${error}`);
        }
    }
    async createUserSession(userId, email, role, permissions, ipAddress, userAgent) {
        try {
            const sessionId = crypto_1.default.randomUUID();
            const createdAt = new Date();
            const expiresAt = new Date(createdAt.getTime() + this.config.sessionTimeout * 1000);
            const session = {
                userId,
                sessionId,
                email,
                role,
                permissions,
                createdAt,
                expiresAt,
                ipAddress,
                userAgent
            };
            await this.redis.setEx(`session:${sessionId}`, this.config.sessionTimeout, JSON.stringify(session));
            await this.db.query(`INSERT INTO user_sessions (session_id, user_id, created_at, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`, [sessionId, userId, createdAt, expiresAt, ipAddress, userAgent]);
            return session;
        }
        catch (error) {
            throw new Error(`Session creation failed: ${error}`);
        }
    }
    async validateUserSession(sessionId) {
        try {
            const sessionData = await this.redis.get(`session:${sessionId}`);
            if (!sessionData) {
                return null;
            }
            const session = JSON.parse(sessionData);
            if (new Date() > session.expiresAt) {
                await this.invalidateSession(sessionId);
                return null;
            }
            return session;
        }
        catch (error) {
            console.error('Session validation error:', error);
            return null;
        }
    }
    async invalidateSession(sessionId) {
        try {
            await this.redis.del(`session:${sessionId}`);
            await this.db.query(`UPDATE user_sessions SET invalidated_at = NOW() WHERE session_id = $1`, [sessionId]);
        }
        catch (error) {
            throw new Error(`Session invalidation failed: ${error}`);
        }
    }
    async invalidateAllUserSessions(userId) {
        try {
            const result = await this.db.query(`SELECT session_id FROM user_sessions 
         WHERE user_id = $1 AND invalidated_at IS NULL AND expires_at > NOW()`, [userId]);
            const sessions = result;
            for (const session of sessions) {
                await this.invalidateSession(session.session_id);
            }
        }
        catch (error) {
            throw new Error(`Bulk session invalidation failed: ${error}`);
        }
    }
    async checkLoginAttempts(identifier) {
        try {
            const key = `login_attempts:${identifier}`;
            const attempts = await this.redis.get(key);
            if (!attempts) {
                return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
            }
            const attemptData = JSON.parse(attempts);
            const now = new Date();
            if (attemptData.lockoutExpires && new Date(attemptData.lockoutExpires) > now) {
                return {
                    allowed: false,
                    remainingAttempts: 0,
                    lockoutExpires: new Date(attemptData.lockoutExpires)
                };
            }
            if (attemptData.lockoutExpires && new Date(attemptData.lockoutExpires) <= now) {
                await this.redis.del(key);
                return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
            }
            const remainingAttempts = this.config.maxLoginAttempts - attemptData.count;
            return {
                allowed: remainingAttempts > 0,
                remainingAttempts: Math.max(0, remainingAttempts)
            };
        }
        catch (error) {
            console.error('Login attempt check error:', error);
            return { allowed: true, remainingAttempts: this.config.maxLoginAttempts };
        }
    }
    async recordLoginAttempt(identifier, success) {
        try {
            const key = `login_attempts:${identifier}`;
            if (success) {
                await this.redis.del(key);
                return;
            }
            const attempts = await this.redis.get(key);
            let attemptData = attempts ? JSON.parse(attempts) : { count: 0 };
            attemptData.count += 1;
            attemptData.lastAttempt = new Date().toISOString();
            if (attemptData.count >= this.config.maxLoginAttempts) {
                attemptData.lockoutExpires = new Date(Date.now() + this.config.lockoutDuration * 1000).toISOString();
            }
            await this.redis.setEx(key, this.config.lockoutDuration, JSON.stringify(attemptData));
        }
        catch (error) {
            console.error('Login attempt recording error:', error);
        }
    }
    sanitizeUserInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .replace(/[;&|`$]/g, '')
            .substring(0, 1000);
    }
    sanitizeEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitized = this.sanitizeUserInput(email.toLowerCase());
        if (!emailRegex.test(sanitized)) {
            throw new Error('Invalid email format');
        }
        return sanitized;
    }
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    generateSecureId() {
        return crypto_1.default.randomUUID();
    }
    validateAssessmentData(data) {
        try {
            if (!data || typeof data !== 'object') {
                return false;
            }
            const requiredFields = ['sessionId', 'responses'];
            for (const field of requiredFields) {
                if (!(field in data)) {
                    return false;
                }
            }
            if (!this.isValidUUID(data.sessionId)) {
                return false;
            }
            if (!Array.isArray(data.responses)) {
                return false;
            }
            for (const response of data.responses) {
                if (!this.validateResponseStructure(response)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error('Assessment data validation error:', error);
            return false;
        }
    }
    validateResponseStructure(response) {
        return (response &&
            typeof response === 'object' &&
            'questionId' in response &&
            'value' in response &&
            typeof response.questionId === 'string' &&
            response.questionId.length > 0);
    }
    isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
        };
    }
    async logSecurityEvent(event, userId, details, ipAddress) {
        try {
            await this.db.query(`INSERT INTO security_audit_log (event_type, user_id, event_details, ip_address, created_at)
         VALUES ($1, $2, $3, $4, NOW())`, [event, userId, JSON.stringify(details), ipAddress]);
        }
        catch (error) {
            console.error('Security event logging error:', error);
        }
    }
}
exports.DataSecurityFramework = DataSecurityFramework;
//# sourceMappingURL=DataSecurityFramework.js.map