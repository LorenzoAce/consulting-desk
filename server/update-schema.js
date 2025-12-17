require('dotenv').config();
const { pool } = require('./db');

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('Adding assigned_consultant column to consulting_cards table...');
    await client.query(`
      ALTER TABLE consulting_cards
      ADD COLUMN IF NOT EXISTS assigned_consultant VARCHAR(255);
    `);
    console.log('Column added successfully!');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateSchema();
