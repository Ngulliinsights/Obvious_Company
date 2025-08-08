/**
 * Encryption Service
 * Handles data encryption, decryption, and key management
 */

import * as crypto from 'crypto';
import { EncryptedData } from './types';
import { SecurityConfig } from './SecurityConfig';

export class EncryptionService {
  private static instance: EncryptionService;
  private config = SecurityConfig.getEncryptionConfig();

  private constructor() {}

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt sensitive data
   */
  public encrypt(data: string, masterKey?: string): EncryptedData {
    try {
      const key = masterKey || this.getMasterKey();
      const salt = crypto.randomBytes(this.config.saltLength);
      const iv = crypto.randomBytes(this.config.ivLength);
      
      // Derive key from master key and salt
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, this.config.keyLength, 'sha256');
      
      const cipher = crypto.createCipher(this.config.algorithm, derivedKey);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // For non-GCM modes, we'll simulate auth tag
      const authTag = Buffer.from('simulated-auth-tag');
      
      return {
        data: encrypted + ':' + authTag.toString('hex'),
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        algorithm: this.config.algorithm,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  public decrypt(encryptedData: EncryptedData, masterKey?: string): string {
    try {
      const key = masterKey || this.getMasterKey();
      const salt = Buffer.from(encryptedData.salt, 'hex');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      
      // Derive the same key
      const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, this.config.keyLength, 'sha256');
      
      // Split encrypted data and auth tag
      const [encryptedText, authTagHex] = encryptedData.data.split(':');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(encryptedData.algorithm, derivedKey);
      
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  public hash(data: string, salt?: string): { hash: string; salt: string } {
    const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(this.config.saltLength);
    const hash = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha256');
    
    return {
      hash: hash.toString('hex'),
      salt: saltBuffer.toString('hex')
    };
  }

  /**
   * Verify hashed data
   */
  public verifyHash(data: string, hash: string, salt: string): boolean {
    try {
      const { hash: computedHash } = this.hash(data, salt);
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate API key
   */
  public generateApiKey(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `ak_${timestamp}_${randomBytes}`;
  }

  /**
   * Encrypt database field
   */
  public encryptField(value: any): string {
    if (value === null || value === undefined) {
      return value;
    }
    
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const encrypted = this.encrypt(stringValue);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypt database field
   */
  public decryptField(encryptedValue: string): any {
    if (!encryptedValue) {
      return encryptedValue;
    }
    
    try {
      const encryptedData = JSON.parse(encryptedValue) as EncryptedData;
      const decrypted = this.decrypt(encryptedData);
      
      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Field decryption failed:', error);
      return null;
    }
  }

  /**
   * Encrypt assessment responses
   */
  public encryptAssessmentData(responses: Record<string, any>): string {
    const sensitiveFields = ['email', 'name', 'company', 'phone', 'personalInfo'];
    const encryptedResponses = { ...responses };
    
    for (const field of sensitiveFields) {
      if (encryptedResponses[field]) {
        encryptedResponses[field] = this.encryptField(encryptedResponses[field]);
      }
    }
    
    return JSON.stringify(encryptedResponses);
  }

  /**
   * Decrypt assessment responses
   */
  public decryptAssessmentData(encryptedData: string): Record<string, any> {
    try {
      const responses = JSON.parse(encryptedData);
      const sensitiveFields = ['email', 'name', 'company', 'phone', 'personalInfo'];
      
      for (const field of sensitiveFields) {
        if (responses[field] && typeof responses[field] === 'string') {
          try {
            responses[field] = this.decryptField(responses[field]);
          } catch (error) {
            console.warn(`Failed to decrypt field ${field}:`, error);
          }
        }
      }
      
      return responses;
    } catch (error) {
      console.error('Assessment data decryption failed:', error);
      return {};
    }
  }

  /**
   * Get or generate master encryption key
   */
  private getMasterKey(): string {
    let masterKey = process.env.MASTER_ENCRYPTION_KEY;
    
    if (!masterKey) {
      console.warn('MASTER_ENCRYPTION_KEY not set, generating temporary key');
      masterKey = crypto.randomBytes(32).toString('hex');
    }
    
    return masterKey;
  }

  /**
   * Rotate encryption keys (for key management)
   */
  public rotateKeys(): { oldKey: string; newKey: string } {
    const oldKey = this.getMasterKey();
    const newKey = crypto.randomBytes(32).toString('hex');
    
    // In production, this would update the environment variable
    // and re-encrypt all existing data with the new key
    console.log('Key rotation initiated - implement key rotation logic');
    
    return { oldKey, newKey };
  }

  /**
   * Validate encryption integrity
   */
  public validateEncryption(data: string): boolean {
    try {
      const encrypted = this.encrypt(data);
      const decrypted = this.decrypt(encrypted);
      return data === decrypted;
    } catch (error) {
      return false;
    }
  }
}