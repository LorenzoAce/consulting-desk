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
      logoDimensions,
      externalImage,
      piva
    } = req.body;

    const query = `
      INSERT INTO consulting_cards (
        business_name, full_name, address, city, province, phone, email, source,
        availability, main_interest, betting_active, utilities_active,
        betting_partners, utility_partners, requests, notes, assigned_consultant, operator_name,
        signature_type, signature_data, logo, logo_dimensions, external_image, piva
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *;
    `;

    const values = [
      businessName, fullName, address, city, province, phone, email, source,
      availability, mainInterest, bettingActive, utilitiesActive,
      JSON.stringify(bettingPartners), JSON.stringify(utilityPartners),
      requests, notes, assignedConsultant, operatorName, signatureType, signatureData,
      logo, JSON.stringify(logoDimensions), externalImage, piva
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
    await client.query('BEGIN');

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
      logoDimensions,
      externalImage,
      piva
    } = req.body;

    const query = `
      UPDATE consulting_cards SET
        business_name = $1, full_name = $2, address = $3, city = $4, province = $5, phone = $6, email = $7, source = $8,
        availability = $9, main_interest = $10, betting_active = $11, utilities_active = $12,
        betting_partners = $13, utility_partners = $14, requests = $15, notes = $16, assigned_consultant = $17, operator_name = $18,
        signature_type = $19, signature_data = $20, logo = $21, logo_dimensions = $22, external_image = $23, piva = $25, updated_at = NOW()
      WHERE id = $24
      RETURNING *;
    `;

    const values = [
      businessName, fullName, address, city, province, phone, email, source,
      availability, mainInterest, bettingActive, utilitiesActive,
      JSON.stringify(bettingPartners), JSON.stringify(utilityPartners),
      requests, notes, assignedConsultant, operatorName, signatureType, signatureData,
      logo, JSON.stringify(logoDimensions), externalImage,
      id, piva
    ];

    const result = await client.query(query, values);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Card not found' });
    }

    // Sync changes to CRM Leads if linked
    const syncQuery = `
      UPDATE crm_leads
      SET business_name = $1, contact_name = $2, email = $3, phone = $4,
          address = $5, city = $6, province = $7, source = $8, notes = $9
      WHERE card_id = $10
    `;
    await client.query(syncQuery, [
      businessName, 
      fullName, 
      email, 
      phone, 
      address, 
      city, 
      province, 
      source,
      notes,
      id
    ]);

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
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
      res.json({ 
        pdf_options: {
          anagrafica: true,
          dettagli: false,
          note: true,
          assegnazione: true,
          firma: true,
          disclaimer: true
        },
        crm_options: {
            business_name: true,
            contact_name: true,
            address: true,
            city: true,
            province: true,
            phone: true,
            email: true,
            piva: true,
            main_interest: true,
            availability: true,
            services: true,
            status: true,
            source: true,
            notes: true,
            assigned_consultant: true
        },
        archive_options: {
            business_name: true,
            full_name: true,
            address: true,
            city: true,
            province: true,
            phone: true,
            email: true,
            piva: true,
            main_interest: true,
            availability: true,
            assigned_consultant: true,
            operator_name: true,
            created_at: true,
            updated_at: true
        },
        crm_statuses: [
          { id: 'new', label: 'Nuovo', color: 'green' },
          { id: 'contacted', label: 'Contattato', color: 'blue' },
          { id: 'interested', label: 'Interessato', color: 'yellow' },
          { id: 'client', label: 'Cliente', color: 'purple' },
          { id: 'closed', label: 'Chiuso', color: 'red' }
        ]
      });
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
    const { pdfOptions, crmOptions, crmStatuses, archiveOptions, logo, logoDimensions } = req.body;
    
    const pdfJson = pdfOptions ? JSON.stringify(pdfOptions) : null;
    const crmJson = crmOptions ? JSON.stringify(crmOptions) : null;
    const statusesJson = crmStatuses ? JSON.stringify(crmStatuses) : null;
    const archiveJson = archiveOptions ? JSON.stringify(archiveOptions) : null;
    const logoDimsJson = logoDimensions ? JSON.stringify(logoDimensions) : null;

    const query = `
      INSERT INTO app_settings (id, pdf_options, crm_options, crm_statuses, archive_options, logo, logo_dimensions, updated_at)
      VALUES (1, COALESCE($1, '{}'::jsonb), COALESCE($2, '{}'::jsonb), COALESCE($3, '[]'::jsonb), COALESCE($4, '{}'::jsonb), $5, $6::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE
      SET 
        pdf_options = CASE WHEN $1::jsonb IS NOT NULL THEN $1::jsonb ELSE app_settings.pdf_options END,
        crm_options = CASE WHEN $2::jsonb IS NOT NULL THEN $2::jsonb ELSE app_settings.crm_options END,
        crm_statuses = CASE WHEN $3::jsonb IS NOT NULL THEN $3::jsonb ELSE app_settings.crm_statuses END,
        archive_options = CASE WHEN $4::jsonb IS NOT NULL THEN $4::jsonb ELSE app_settings.archive_options END,
        logo = CASE WHEN $5 IS NOT NULL THEN $5 ELSE app_settings.logo END,
        logo_dimensions = CASE WHEN $6::jsonb IS NOT NULL THEN $6::jsonb ELSE app_settings.logo_dimensions END,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await client.query(query, [pdfJson, crmJson, statusesJson, archiveJson, logo, logoDimsJson]);
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

// Get all cards (Optimized for list view)
app.get('/api/cards', async (req, res) => {
  try {
    // Select only lightweight columns for the list view
    const query = `
      SELECT 
        id, business_name, full_name, address, city, province, phone, email, 
        source, availability, main_interest, betting_active, utilities_active,
        assigned_consultant, operator_name, created_at, updated_at, piva,
        (CASE WHEN external_image IS NOT NULL AND length(external_image) > 0 THEN true ELSE false END) as has_external_image
      FROM consulting_cards 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// Get single card by ID (Full details)
app.get('/api/cards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM consulting_cards WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch card details' });
  }
});

// Get card external image
app.get('/api/cards/:id/image', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT external_image FROM consulting_cards WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json({ external_image: result.rows[0].external_image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch card image' });
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create table if not exists
      const query = `
        CREATE TABLE IF NOT EXISTS crm_leads (
          id SERIAL PRIMARY KEY,
          card_id INTEGER REFERENCES consulting_cards(id) ON DELETE SET NULL,
          business_name VARCHAR(255),
          contact_name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          address VARCHAR(255),
          city VARCHAR(100),
          province VARCHAR(100),
          source VARCHAR(50),
          status VARCHAR(50) DEFAULT 'new',
          notes TEXT,
          last_contact_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await client.query(query);

      // Add missing columns if table exists (migration)
      await client.query(`
        DO $$ 
        BEGIN 
          BEGIN
            ALTER TABLE crm_leads ADD COLUMN address VARCHAR(255);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          BEGIN
            ALTER TABLE crm_leads ADD COLUMN city VARCHAR(100);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          BEGIN
            ALTER TABLE crm_leads ADD COLUMN province VARCHAR(100);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
        END $$;
      `);
      
      await client.query('COMMIT');
      res.json({ message: 'CRM table initialized and updated' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error initializing CRM table:', err);
    res.status(500).json({ error: 'Failed to initialize CRM table' });
  }
});

// Get all CRM leads with Card details
app.get('/api/crm/leads', async (req, res) => {
  try {
    const query = `
      SELECT l.*, 
             c.main_interest, 
             c.assigned_consultant, 
             c.availability,
             c.betting_active,
             c.utilities_active
      FROM crm_leads l
      LEFT JOIN consulting_cards c ON l.card_id = c.id
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching CRM leads:', err);
    res.status(500).json({ error: 'Failed to fetch CRM leads' });
  }
});

// Get single card by ID
app.get('/api/cards/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM consulting_cards WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching card:', err);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// Update a CRM lead
app.put('/api/crm/leads/:id', async (req, res) => {
  const { id } = req.params;
  const { businessName, contactName, email, phone, address, city, province, notes, status, cardId, piva } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update CRM Lead
    const updateLeadQuery = `
      UPDATE crm_leads 
      SET business_name = $1, contact_name = $2, email = $3, phone = $4, 
          address = $5, city = $6, province = $7, notes = $8, status = $9, piva = $11
      WHERE id = $10
      RETURNING *
    `;
    const leadValues = [businessName, contactName, email, phone, address, city, province, notes, status, id, piva];
    const leadResult = await client.query(updateLeadQuery, leadValues);

    if (leadResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Sync with Card if linked
    if (cardId) {
      const updateCardQuery = `
        UPDATE consulting_cards
        SET business_name = $1, full_name = $2, email = $3, phone = $4,
            address = $5, city = $6, province = $7, notes = $8, piva = $10, updated_at = NOW()
        WHERE id = $9
      `;
      // Note: mapping contactName to full_name
      await client.query(updateCardQuery, [businessName, contactName, email, phone, address, city, province, notes, cardId, piva]);
    }

    await client.query('COMMIT');
    res.json(leadResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating CRM lead:', err);
    res.status(500).json({ error: 'Failed to update CRM lead' });
  } finally {
    client.release();
  }
});

// Delete a CRM lead
app.delete('/api/crm/leads/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM crm_leads WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json({ message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Error deleting CRM lead:', err);
    res.status(500).json({ error: 'Failed to delete CRM lead' });
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
        INSERT INTO crm_leads (card_id, business_name, contact_name, email, phone, address, city, province, source, status, piva, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'archive', 'new', $9, NOW())
      `, [card.id, card.business_name, card.full_name, card.email, card.phone, card.address, card.city, card.province, card.piva]);
      
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
  const { businessName, contactName, email, phone, address, city, province, notes, source, piva } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO crm_leads (business_name, contact_name, email, phone, address, city, province, notes, source, status, piva, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', $10, NOW())
      RETURNING *
    `, [businessName, contactName, email, phone, address, city, province, notes, source || 'excel', piva]);
    
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
