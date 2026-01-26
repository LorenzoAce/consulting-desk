require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*', // Allow all origins for now to fix connection issues
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 signatures

// Test connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Check for duplicates
app.post('/api/cards/check-duplicate', async (req, res) => {
  const { businessName, email, phone, id } = req.body;
  const client = await pool.connect();
  try {
    let query = `
      SELECT id, business_name, email, phone FROM consulting_cards 
      WHERE (business_name = $1 OR email = $2 OR phone = $3)
    `;
    let values = [businessName, email, phone];

    if (id) {
      query += ` AND id != $4`;
      values.push(id);
    }

    const result = await client.query(query, values);
    res.json({ duplicates: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check duplicates' });
  } finally {
    client.release();
  }
});

// Save a new consulting card
app.post('/api/cards', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      businessName,
      fullName,
      address,
      city,
      province,
      phone,
      email,
      source,
      availability,
      mainInterest,
      bettingActive,
      utilitiesActive,
      bettingPartners,
      utilityPartners,
      requests,
      notes,
      assignedConsultant,
      operatorName,
      signatureType,
      signatureData,
      logo,
      logoDimensions
    } = req.body;

    const query = `
      INSERT INTO consulting_cards (
        business_name, full_name, address, city, province, phone, email, source,
        availability, main_interest, betting_active, utilities_active,
        betting_partners, utility_partners, requests, notes, assigned_consultant, operator_name,
        signature_type, signature_data, logo, logo_dimensions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *;
    `;

    const values = [
      businessName, fullName, address, city, province, phone, email, source,
      availability, mainInterest, bettingActive, utilitiesActive,
      JSON.stringify(bettingPartners), JSON.stringify(utilityPartners),
      requests, notes, assignedConsultant, operatorName, signatureType, signatureData,
      logo, JSON.stringify(logoDimensions)
    ];

    const result = await client.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save card' });
  } finally {
    client.release();
  }
});

// Update a consulting card
app.put('/api/cards/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const {
      businessName,
      fullName,
      address,
      city,
      province,
      phone,
      email,
      source,
      availability,
      mainInterest,
      bettingActive,
      utilitiesActive,
      bettingPartners,
      utilityPartners,
      requests,
      notes,
      assignedConsultant,
      operatorName,
      signatureType,
      signatureData,
      logo,
      logoDimensions
    } = req.body;

    const query = `
      UPDATE consulting_cards SET
        business_name = $1, full_name = $2, address = $3, city = $4, province = $5, phone = $6, email = $7, source = $8,
        availability = $9, main_interest = $10, betting_active = $11, utilities_active = $12,
        betting_partners = $13, utility_partners = $14, requests = $15, notes = $16, assigned_consultant = $17, operator_name = $18,
        signature_type = $19, signature_data = $20, logo = $21, logo_dimensions = $22, updated_at = NOW()
      WHERE id = $23
      RETURNING *;
    `;

    const values = [
      businessName, fullName, address, city, province, phone, email, source,
      availability, mainInterest, bettingActive, utilitiesActive,
      JSON.stringify(bettingPartners), JSON.stringify(utilityPartners),
      requests, notes, assignedConsultant, operatorName, signatureType, signatureData,
      logo, JSON.stringify(logoDimensions),
      id
    ];

    const result = await client.query(query, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating card:', err);
    res.status(500).json({ error: 'Failed to update card', details: err.message });
  } finally {
    client.release();
  }
});

// Bulk update logo for all cards
app.post('/api/cards/bulk-logo', async (req, res) => {
  const client = await pool.connect();
  try {
    const { logo, logoDimensions } = req.body;
    
    if (!logo) {
      return res.status(400).json({ error: 'Logo data is required' });
    }

    const query = `
      UPDATE consulting_cards 
      SET logo = $1, logo_dimensions = $2, updated_at = NOW()
    `;

    const result = await client.query(query, [logo, JSON.stringify(logoDimensions)]);
    
    res.json({ 
      message: 'All cards updated successfully', 
      updatedCount: result.rowCount 
    });
  } catch (err) {
    console.error('Error updating all cards logo:', err);
    res.status(500).json({ error: 'Failed to update cards', details: err.message });
  } finally {
    client.release();
  }
});

// Bulk update consultant for selected cards
app.post('/api/cards/bulk-consultant', async (req, res) => {
  const client = await pool.connect();
  try {
    const { cardIds, consultantName } = req.body;
    
    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ error: 'Card IDs are required' });
    }

    const query = `
      UPDATE consulting_cards 
      SET assigned_consultant = $1, updated_at = NOW()
      WHERE id = ANY($2::int[])
    `;

    const result = await client.query(query, [consultantName, cardIds]);
    
    res.json({ 
      message: 'Consultant updated successfully', 
      updatedCount: result.rowCount 
    });
  } catch (err) {
    console.error('Error updating consultant:', err);
    res.status(500).json({ error: 'Failed to update consultant', details: err.message });
  } finally {
    client.release();
  }
});

// Get global settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json({ pdf_options: {
        anagrafica: true,
        dettagli: false,
        note: true,
        assegnazione: true,
        firma: true,
        disclaimer: true
      }});
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update global settings
app.put('/api/settings', async (req, res) => {
  const client = await pool.connect();
  try {
    const { pdfOptions } = req.body;

    const query = `
      INSERT INTO app_settings (id, pdf_options, updated_at)
      VALUES (1, $1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET pdf_options = EXCLUDED.pdf_options, updated_at = NOW()
      RETURNING *;
    `;

    const result = await client.query(query, [JSON.stringify(pdfOptions)]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/cards/global-logo', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT logo, logo_dimensions
      FROM consulting_cards
      WHERE logo IS NOT NULL AND logo <> ''
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      res.json({ logo: null, logo_dimensions: null });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching global logo:', err);
    res.status(500).json({ error: 'Failed to fetch global logo' });
  }
});

// Get all cards
app.get('/api/cards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consulting_cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// Delete a consulting card
app.delete('/api/cards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM consulting_cards WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json({ message: 'Card deleted successfully', deletedCard: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// --- Consultants Management ---

// Get all consultants
app.get('/api/consultants', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM consultants ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching consultants:', err);
    res.status(500).json({ error: 'Failed to fetch consultants' });
  }
});

// Add a new consultant
app.post('/api/consultants', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO consultants (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding consultant:', err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Consultant already exists' });
    }
    res.status(500).json({ error: 'Failed to add consultant' });
  }
});

// Update a consultant
app.put('/api/consultants/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE consultants SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, email, phone, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Consultant not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating consultant:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Consultant name already exists' });
    }
    res.status(500).json({ error: 'Failed to update consultant' });
  }
});

// Delete a consultant
app.delete('/api/consultants/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM consultants WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Consultant not found' });
    }
    res.json({ message: 'Consultant deleted successfully' });
  } catch (err) {
    console.error('Error deleting consultant:', err);
    res.status(500).json({ error: 'Failed to delete consultant' });
  }
});

// --- CRM Management ---

// Initialize CRM Table
app.post('/api/crm/init', async (req, res) => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS crm_leads (
        id SERIAL PRIMARY KEY,
        card_id INTEGER REFERENCES consulting_cards(id) ON DELETE SET NULL,
        business_name VARCHAR(255),
        contact_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        source VARCHAR(50),
        status VARCHAR(50) DEFAULT 'new',
        notes TEXT,
        last_contact_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    res.json({ message: 'CRM table initialized' });
  } catch (err) {
    console.error('Error initializing CRM table:', err);
    res.status(500).json({ error: 'Failed to initialize CRM table' });
  }
});

// Get all CRM leads
app.get('/api/crm/leads', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM crm_leads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching CRM leads:', err);
    res.status(500).json({ error: 'Failed to fetch CRM leads' });
  }
});

// Import from Archive
app.post('/api/crm/import-archive', async (req, res) => {
  const { cardIds } = req.body; // Array of IDs
  if (!cardIds || !Array.isArray(cardIds)) {
    return res.status(400).json({ error: 'Invalid cardIds' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let importedCount = 0;
    
    for (const id of cardIds) {
      // Check if already in CRM
      const check = await client.query('SELECT id FROM crm_leads WHERE card_id = $1', [id]);
      if (check.rows.length > 0) continue;
      
      // Get card data
      const cardRes = await client.query('SELECT * FROM consulting_cards WHERE id = $1', [id]);
      if (cardRes.rows.length === 0) continue;
      
      const card = cardRes.rows[0];
      
      // Insert into CRM
      await client.query(`
        INSERT INTO crm_leads (card_id, business_name, contact_name, email, phone, source, status, created_at)
        VALUES ($1, $2, $3, $4, $5, 'archive', 'new', NOW())
      `, [card.id, card.business_name, card.full_name, card.email, card.phone]);
      
      importedCount++;
    }
    
    await client.query('COMMIT');
    res.json({ message: `Imported ${importedCount} leads from archive` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error importing from archive:', err);
    res.status(500).json({ error: 'Failed to import from archive' });
  } finally {
    client.release();
  }
});

// Import from Excel (or manual add)
app.post('/api/crm/leads', async (req, res) => {
  const { businessName, contactName, email, phone, notes, source } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO crm_leads (business_name, contact_name, email, phone, notes, source, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'new', NOW())
      RETURNING *
    `, [businessName, contactName, email, phone, notes, source || 'excel']);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding CRM lead:', err);
    res.status(500).json({ error: 'Failed to add CRM lead' });
  }
});

// Start the server only if run directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

module.exports = app;
