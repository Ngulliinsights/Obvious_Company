import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

export class DatabaseMigrations {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async runMigrations(): Promise<void> {
    try {
      // Create migrations tracking table if it doesn't exist
      await this.createMigrationsTable();

      // Run schema migration
      await this.runSchemaMigration();

      // Seed initial data
      await this.seedInitialData();

      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await this.pool.query(query);
  }

  private async runSchemaMigration(): Promise<void> {
    const migrationName = 'initial_schema';
    
    // Check if migration already ran
    const existingMigration = await this.pool.query(
      'SELECT id FROM migrations WHERE name = $1',
      [migrationName]
    );

    if (existingMigration.rows.length > 0) {
      console.log('Schema migration already executed, skipping...');
      return;
    }

    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    await this.pool.query(schema);
    
    // Record migration
    await this.pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [migrationName]
    );

    console.log('Schema migration executed successfully');
  }

  private async seedInitialData(): Promise<void> {
    const seedName = 'initial_seed_data';
    
    // Check if seed already ran
    const existingSeed = await this.pool.query(
      'SELECT id FROM migrations WHERE name = $1',
      [seedName]
    );

    if (existingSeed.rows.length > 0) {
      console.log('Seed data already exists, skipping...');
      return;
    }

    // Insert industry configurations
    const industries = [
      {
        name: 'Financial Services',
        questionSets: {
          regulatory: ['compliance_framework', 'risk_management', 'data_privacy'],
          operational: ['customer_analytics', 'fraud_detection', 'process_automation']
        },
        scoringWeights: {
          strategic_authority: 0.25,
          organizational_influence: 0.20,
          resource_availability: 0.25,
          implementation_readiness: 0.20,
          cultural_alignment: 0.10
        }
      },
      {
        name: 'Manufacturing',
        questionSets: {
          operational: ['supply_chain', 'predictive_maintenance', 'quality_control'],
          strategic: ['process_optimization', 'workforce_planning', 'sustainability']
        },
        scoringWeights: {
          strategic_authority: 0.20,
          organizational_influence: 0.25,
          resource_availability: 0.25,
          implementation_readiness: 0.25,
          cultural_alignment: 0.05
        }
      },
      {
        name: 'Healthcare',
        questionSets: {
          clinical: ['patient_outcomes', 'diagnostic_support', 'treatment_optimization'],
          operational: ['workflow_efficiency', 'resource_allocation', 'compliance']
        },
        scoringWeights: {
          strategic_authority: 0.20,
          organizational_influence: 0.20,
          resource_availability: 0.20,
          implementation_readiness: 0.20,
          cultural_alignment: 0.20
        }
      },
      {
        name: 'Government',
        questionSets: {
          service_delivery: ['citizen_engagement', 'process_efficiency', 'transparency'],
          governance: ['policy_analysis', 'resource_optimization', 'accountability']
        },
        scoringWeights: {
          strategic_authority: 0.15,
          organizational_influence: 0.25,
          resource_availability: 0.15,
          implementation_readiness: 0.25,
          cultural_alignment: 0.20
        }
      }
    ];

    for (const industry of industries) {
      await this.pool.query(`
        INSERT INTO industry_configurations (
          industry_name, 
          question_sets, 
          scoring_weights,
          cultural_considerations,
          regulatory_frameworks
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        industry.name,
        JSON.stringify(industry.questionSets),
        JSON.stringify(industry.scoringWeights),
        JSON.stringify({}), // Will be populated later
        [] // Will be populated later
      ]);
    }

    // Record seed migration
    await this.pool.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [seedName]
    );

    console.log('Initial seed data inserted successfully');
  }

  async rollbackLastMigration(): Promise<void> {
    // Get last migration
    const lastMigration = await this.pool.query(
      'SELECT name FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );

    if (lastMigration.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const migrationName = lastMigration.rows[0]?.name;
    
    // For now, we'll just remove the migration record
    // In a production system, you'd want proper rollback scripts
    await this.pool.query(
      'DELETE FROM migrations WHERE name = $1',
      [migrationName]
    );

    console.log(`Rolled back migration: ${migrationName}`);
  }
}