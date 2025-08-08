import crypto from 'crypto';
import bcrypt from 'bcrypt';

export interface CryptoConfig {
  encryptionKey: string;
  algorithm: string;
  keyDerivationRounds: number;
  saltLength: number;
}

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  salt?: string;
}

export class CryptoUtils {
  private config: CryptoConfig;

  constructor(config: CryptoConfig) {
    this.config = config;
  }

  // Password hashing using bcrypt
  async hashPassword(password: string, rounds: number = 12): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(rounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error}`);
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(`Password verification failed: ${error}`);
    }
  }

  // Data encryption using AES-256-GCM
  encryptData(data: string, key?: string): EncryptedData {
    try {
      const encryptionKey = key || this.config.encryptionKey;
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(32);
      
      // Derive key from password and salt
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, this.config.keyDerivationRounds, 32, 'sha256');
      
      const cipher = crypto.createCipher(this.config.algorithm, derivedKey);
      cipher.setAAD(Buffer.from('assessment-platform-aad'));
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        salt: salt.toString('hex')
      };
    } catch (error) {
      throw new Error(`Data encryption failed: ${error}`);
    }
  }

  decryptData(encryptedData: EncryptedData, key?: string): string {
    try {
      const encryptionKey = key || this.config.encryptionKey;
      const salt = Buffer.from(encryptedData.salt || '', 'hex');
      
      // Derive the same key
      const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, this.config.keyDerivationRounds, 32, 'sha256');
      
      const decipher = crypto.createDecipher(this.config.algorithm, derivedKey);
      decipher.setAAD(Buffer.from('assessment-platform-aad'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Data decryption failed: ${error}`);
    }
  }

  // Generate secure random tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateSecureId(): string {
    return crypto.randomUUID();
  }

  // Generate cryptographically secure random numbers
  generateSecureRandom(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValue = Math.pow(256, bytesNeeded);
    const randomBytes = crypto.randomBytes(bytesNeeded);
    
    let randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = (randomValue << 8) + randomBytes[i];
    }
    
    return min + (randomValue % range);
  }

  // Hash data using SHA-256
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Create HMAC signature
  createHMAC(data: string, secret?: string): string {
    const key = secret || this.config.encryptionKey;
    return crypto.createHmac('sha256', key).update(data).digest('hex');
  }

  // Verify HMAC signature
  verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const key = secret || this.config.encryptionKey;
    const expectedSignature = crypto.createHmac('sha256', key).update(data).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  // Generate key pair for asymmetric encryption
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    return { publicKey, privateKey };
  }

  // Encrypt with public key
  encryptWithPublicKey(data: string, publicKey: string): string {
    const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(data));
    return encrypted.toString('base64');
  }

  // Decrypt with private key
  decryptWithPrivateKey(encryptedData: string, privateKey: string): string {
    const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(encryptedData, 'base64'));
    return decrypted.toString('utf8');
  }

  // Create digital signature
  signData(data: string, privateKey: string): string {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'base64');
  }

  // Verify digital signature
  verifySignature(data: string, signature: string, publicKey: string): boolean {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  }

  // Secure data comparison (timing-safe)
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  // Generate salt for password hashing
  generateSalt(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Key derivation function
  deriveKey(password: string, salt: string, iterations: number = 100000, keyLength: number = 32): string {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256').toString('hex');
  }

  // Encrypt sensitive fields in objects
  encryptSensitiveFields(obj: any, sensitiveFields: string[]): any {
    const encrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encryptData(encrypted[field].toString());
      }
    }
    
    return encrypted;
  }

  // Decrypt sensitive fields in objects
  decryptSensitiveFields(obj: any, sensitiveFields: string[]): any {
    const decrypted = { ...obj };
    
    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'object') {
        decrypted[field] = this.decryptData(decrypted[field]);
      }
    }
    
    return decrypted;
  }
}

// Default crypto utilities instance
const defaultConfig: CryptoConfig = {
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production',
  algorithm: 'aes-256-gcm',
  keyDerivationRounds: 100000,
  saltLength: 32
};

export const cryptoUtils = new CryptoUtils(defaultConfig);

// Legacy exports for backward compatibility
export const hashPassword = cryptoUtils.hashPassword.bind(cryptoUtils);
export const verifyPassword = cryptoUtils.verifyPassword.bind(cryptoUtils);
export const encryptData = cryptoUtils.encryptData.bind(cryptoUtils);
export const decryptData = cryptoUtils.decryptData.bind(cryptoUtils);
export const generateSecureToken = cryptoUtils.generateSecureToken.bind(cryptoUtils);
export const generateSecureId = cryptoUtils.generateSecureId.bind(cryptoUtils);