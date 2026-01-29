require('dotenv').config();
const { pool } = require('./db');

async function addColumn() {
  try {
    console.log('Adding external_image column to consulting_cards...');
    await pool.query(`
      ALTER TABLE consulting_cards
      ADD COLUMN IF NOT EXISTS external_image TEXT;
    `);
    console.log('Added external_image column successfully');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    pool.end();
  }
}

addColumn();
