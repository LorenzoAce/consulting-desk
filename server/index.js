require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*', // Allow all origins for now to fix connection issues
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
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

// Save a new consulting card
app.post('/api/cards', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      businessName,
      fullName,
      address,
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
      signatureData
    } = req.body;

    const query = `
      INSERT INTO consulting_cards (
        business_name, full_name, address, province, phone, email, source,
        availability, main_interest, betting_active, utilities_active,
        betting_partners, utility_partners, requests, notes, assigned_consultant, operator_name,
        signature_type, signature_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `;

    const values = [
      businessName, fullName, address, province, phone, email, source,
      availability, mainInterest, bettingActive, utilitiesActive,
      JSON.stringify(bettingPartners), JSON.stringify(utilityPartners),
      requests, notes, assignedConsultant, operatorName, signatureType, signatureData
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

// Start the server only if run directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
