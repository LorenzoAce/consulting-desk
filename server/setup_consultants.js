
const { pool } = require('./db');

async function setup() {
  try {
    const client = await pool.connect();
    console.log('Connected to database...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS consultants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Table "consultants" created or already exists.');
    client.release();
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    pool.end();
  }
}

setup();
