require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_vzgq7CVds3Yw@ep-holy-frog-agge0o8x-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function createMarketingTemplatesTable() {
  const client = await pool.connect();
  try {
    console.log('Creating marketing_templates table on Neon...');
    const query = `
      CREATE TABLE IF NOT EXISTS marketing_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL, -- email, sms, whatsapp
        content JSONB DEFAULT '[]'::jsonb, -- Array of blocks
        settings JSONB DEFAULT '{"fontFamily": "sans-serif", "backgroundColor": "#ffffff"}'::jsonb,
        thumbnail TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(query);
    console.log('Table marketing_templates created successfully on Neon.');
  } catch (err) {
    console.error('Error creating table on Neon:', err);
  } finally {
    client.release();
    process.exit();
  }
}

createMarketingTemplatesTable();
