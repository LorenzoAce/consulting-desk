const { pool } = require('./db');

async function addPivaColumn() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add piva to consulting_cards
    console.log('Adding piva to consulting_cards...');
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE consulting_cards ADD COLUMN piva VARCHAR(50);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Add piva to crm_leads
    console.log('Adding piva to crm_leads...');
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE crm_leads ADD COLUMN piva VARCHAR(50);
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Successfully added piva columns!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding piva columns:', err);
  } finally {
    client.release();
    pool.end();
  }
}

addPivaColumn();
