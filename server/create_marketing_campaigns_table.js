require('dotenv').config();
const { pool } = require('./db');

async function createMarketingCampaignsTable() {
  const client = await pool.connect();
  try {
    console.log('Creating marketing_campaigns table...');
    const query = `
      CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        folder VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        sender_id VARCHAR(100),
        recipients JSONB DEFAULT '[]'::jsonb,
        subject TEXT,
        message TEXT,
        status VARCHAR(50) DEFAULT 'Bozza',
        stats JSONB DEFAULT '{"recipients": 0, "opens": 0, "clicks": 0, "unsubscribes": 0, "conversions": 0}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(query);
    console.log('Table marketing_campaigns created or already exists.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
    process.exit();
  }
}

createMarketingCampaignsTable();
