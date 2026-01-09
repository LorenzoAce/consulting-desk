require('dotenv').config();
const { pool } = require('./db');

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('Adding logo and logo_dimensions columns to consulting_cards table...');
    await client.query(`
      ALTER TABLE consulting_cards
      ADD COLUMN IF NOT EXISTS logo TEXT,
      ADD COLUMN IF NOT EXISTS logo_dimensions JSONB;
    `);
    console.log('Columns added successfully!');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateSchema();
