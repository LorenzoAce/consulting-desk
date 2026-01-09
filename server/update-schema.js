require('dotenv').config();
const { pool } = require('./db');

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('Creating app_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id SERIAL PRIMARY KEY,
        pdf_options JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Ensure default settings exist
    const result = await client.query('SELECT * FROM app_settings WHERE id = 1');
    if (result.rowCount === 0) {
        await client.query(`
            INSERT INTO app_settings (id, pdf_options) 
            VALUES (1, '{"anagrafica": true, "dettagli": false, "note": true, "assegnazione": true, "firma": true, "disclaimer": true}'::jsonb)
        `);
        console.log('Default settings inserted.');
    }
    
    console.log('Schema updated successfully!');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

updateSchema();
