const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

/**
 * Database Connection Manager
 * Handles PostgreSQL connections with connection pooling and error handling
 */

class DatabaseManager {
    constructor(config = {}) {
        this.config = {
            host: config.host || process.env.DB_HOST || 'localhost',
            port: config.port || parseInt(process.env.DB_PORT) || 5432,
            database: config.database || process.env.DB_NAME || 'obvious_company',
            user: config.user || process.env.DB_USER || 'postgres',
            password: config.password || process.env.DB_PASSWORD || 'password',
            // Connection pool settings
            max: config.max || 20, // Maximum number of clients in the pool
            idleTimeoutMillis: config.idleTimeoutMillis || 30000, // Close idle clients after 30 seconds
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000, // Return an error after 2 seconds if connection could not be established
            maxUses: config.maxUses || 7500, // Close (and replace) a connection after it has been used 7500 times
        };
        
        this.pool = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
    }
    
    /**
     * Initialize database connection
     */
    async initialize() {
        try {
            console.log('🔄 Initializing database connection...');
            
            // Create connection pool
            this.pool = new Pool(this.config);
            
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.isConnected = true;
            this.retryCount = 0;
            
            console.log('✅ Database connection established successfully');
            console.log(`📍 Connected to: ${this.config.host}:${this.config.port}/${this.config.database}`);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize schema if needed
            await this.initializeSchema();
            
            return true;
            
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            this.isConnected = false;
            
            // Retry connection
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`🔄 Retrying database connection (${this.retryCount}/${this.maxRetries})...`);
                
                // Wait before retry (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                return this.initialize();
            }
            
            console.error('💥 Database connection failed after maximum retries');
            return false;
        }
    }
    
    /**
     * Set up event listeners for connection monitoring
     */
    setupEventListeners() {
        if (!this.pool) return;
        
        this.pool.on('connect', (client) => {
            console.log('🔗 New database client connected');
        });
        
        this.pool.on('acquire', (client) => {
            console.log('📤 Database client acquired from pool');
        });
        
        this.pool.on('release', (client) => {
            console.log('📥 Database client released back to pool');
        });
        
        this.pool.on('remove', (client) => {
            console.log('🗑️  Database client removed from pool');
        });
        
        this.pool.on('error', (err, client) => {
            console.error('💥 Unexpected database pool error:', err);
            this.isConnected = false;
            
            // Attempt to reconnect
            setTimeout(() => {
                this.initialize();
            }, 5000);
        });
    }
    
    /**
     * Initialize database schema if it doesn't exist
     */
    async initializeSchema() {
        try {
            const schemaPath = path.join(__dirname, 'schema.sql');
            
            if (!fs.existsSync(schemaPath)) {
                console.log('⚠️  Schema file not found, skipping schema initialization');
                return;
            }
            
            // Check if tables exist
            const tablesExist = await this.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users'
                );
            `);
            
            if (!tablesExist.rows[0].exists) {
                console.log('🔄 Initializing database schema...');
                
                const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
                await this.query(schemaSQL);
                
                console.log('✅ Database schema initialized successfully');
            } else {
                console.log('✅ Database schema already exists');
            }
            
        } catch (error) {
            console.error('❌ Schema initialization failed:', error.message);
            // Don't throw error - app can continue without schema
        }
    }
    
    /**
     * Execute a query
     */
    async query(text, params = []) {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }
        
        const start = Date.now();
        
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            if (process.env.DETAILED_LOGGING === 'true') {
                console.log('📊 Query executed:', {
                    query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                    duration: `${duration}ms`,
                    rows: result.rowCount
                });
            }
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - start;
            console.error('💥 Query failed:', {
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * Execute a transaction
     */
    async transaction(callback) {
        if (!this.isConnected || !this.pool) {
            throw new Error('Database not connected');
        }
        
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const result = await callback(client);
            
            await client.query('COMMIT');
            return result;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    
    /**
     * Get connection pool status
     */
    getPoolStatus() {
        if (!this.pool) {
            return {
                connected: false,
                totalCount: 0,
                idleCount: 0,
                waitingCount: 0
            };
        }
        
        return {
            connected: this.isConnected,
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
        };
    }
    
    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.isConnected || !this.pool) {
                return {
                    status: 'disconnected',
                    message: 'Database not connected'
                };
            }
            
            const start = Date.now();
            const result = await this.query('SELECT 1 as health_check');
            const responseTime = Date.now() - start;
            
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                poolStatus: this.getPoolStatus()
            };
            
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                poolStatus: this.getPoolStatus()
            };
        }
    }
    
    /**
     * Close all connections
     */
    async close() {
        if (this.pool) {
            console.log('🔄 Closing database connections...');
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
            console.log('✅ Database connections closed');
        }
    }
    
    /**
     * Utility methods for common operations
     */
    
    // Insert with returning
    async insert(table, data, returning = '*') {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO ${table} (${keys.join(', ')})
            VALUES (${placeholders})
            RETURNING ${returning}
        `;
        
        const result = await this.query(query, values);
        return result.rows[0];
    }
    
    // Update with where clause
    async update(table, data, whereClause, whereParams = []) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        
        const setClause = keys.map((key, index) => 
            `${key} = $${index + 1}`
        ).join(', ');
        
        const query = `
            UPDATE ${table}
            SET ${setClause}
            WHERE ${whereClause}
            RETURNING *
        `;
        
        const result = await this.query(query, [...values, ...whereParams]);
        return result.rows;
    }
    
    // Select with optional conditions
    async select(table, columns = '*', whereClause = '', whereParams = [], orderBy = '') {
        let query = `SELECT ${columns} FROM ${table}`;
        
        if (whereClause) {
            query += ` WHERE ${whereClause}`;
        }
        
        if (orderBy) {
            query += ` ORDER BY ${orderBy}`;
        }
        
        const result = await this.query(query, whereParams);
        return result.rows;
    }
    
    // Delete with where clause
    async delete(table, whereClause, whereParams = []) {
        const query = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
        const result = await this.query(query, whereParams);
        return result.rows;
    }
}

// Create singleton instance
let dbManager = null;

function getDatabase(config = {}) {
    if (!dbManager) {
        dbManager = new DatabaseManager(config);
    }
    return dbManager;
}

module.exports = {
    DatabaseManager,
    getDatabase
};