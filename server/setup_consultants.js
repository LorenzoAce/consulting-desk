
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

    // Migrate existing consultants from consulting_cards
    console.log('Migrating existing consultants from cards...');
    
    const res = await client.query(`
      SELECT DISTINCT assigned_consultant 
      FROM consulting_cards 
      WHERE assigned_consultant IS NOT NULL 
      AND assigned_consultant != ''
    `);

    const existingConsultants = res.rows.map(r => r.assigned_consultant);
    console.log(`Found ${existingConsultants.length} unique consultants in cards.`);

    let addedCount = 0;
    for (const name of existingConsultants) {
      const insertRes = await client.query(`
        INSERT INTO consultants (name) 
        VALUES ($1) 
        ON CONFLICT (name) DO NOTHING
        RETURNING id
      `, [name]);
      
      if (insertRes.rowCount > 0) {
        addedCount++;
      }
    }

    console.log(`Successfully added ${addedCount} new consultants to the registry.`);

    client.release();
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    pool.end();
  }
}

setup();
