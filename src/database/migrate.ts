import fs from 'fs';
import path from 'path';
import { pool } from './index.js';
import { logger } from '../utils/logger.js';

// Use process.cwd() instead of import.meta for CommonJS compatibility
const migrationsDir = path.join(process.cwd(), 'src', 'database', 'migrations');

async function runMigrations(): Promise<void> {
    // Create migrations tracking table
    await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

    // Get already executed migrations
    const executed = await pool.query<{ name: string }>('SELECT name FROM migrations');
    const executedNames = new Set(executed.rows.map((r) => r.name));

    // Get migration files
    const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        if (executedNames.has(file)) {
            logger.debug(`Migration ${file} already executed, skipping`);
            continue;
        }

        logger.info(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            logger.info(`Migration ${file} completed successfully`);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`Migration ${file} failed:`, error);
            throw error;
        } finally {
            client.release();
        }
    }

    logger.info('All migrations completed');
}

// Run if called directly
runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
        logger.error('Migration failed:', error);
        process.exit(1);
    });
