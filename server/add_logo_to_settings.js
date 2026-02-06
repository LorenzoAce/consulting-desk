
const { pool } = require('./db');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Add logo columns to app_settings...');
    
    await client.query('BEGIN');

    // Add logo column
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE app_settings ADD COLUMN logo TEXT;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add logo_dimensions column
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE app_settings ADD COLUMN logo_dimensions JSONB;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
