
const { pool } = require('./db');

const addCrmStatusesColumn = async () => {
  const client = await pool.connect();
  try {
    console.log('Adding crm_statuses column to app_settings table...');
    
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE app_settings ADD COLUMN crm_statuses JSONB DEFAULT '[]'::jsonb;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);

    // Initialize with default statuses if empty
    const check = await client.query('SELECT crm_statuses FROM app_settings WHERE id = 1');
    if (check.rows.length > 0) {
      const currentStatuses = check.rows[0].crm_statuses;
      if (!currentStatuses || currentStatuses.length === 0 || (Array.isArray(currentStatuses) && currentStatuses.length === 0)) {
        console.log('Initializing default CRM statuses...');
        const defaultStatuses = [
          { id: 'new', label: 'Nuovo', color: 'green' },
          { id: 'contacted', label: 'Contattato', color: 'blue' },
          { id: 'interested', label: 'Interessato', color: 'yellow' },
          { id: 'client', label: 'Cliente', color: 'purple' },
          { id: 'closed', label: 'Chiuso', color: 'red' }
        ];
        await client.query('UPDATE app_settings SET crm_statuses = $1 WHERE id = 1', [JSON.stringify(defaultStatuses)]);
      }
    } else {
        // Create row 1 if not exists (should exist from previous steps but just in case)
        const defaultStatuses = [
            { id: 'new', label: 'Nuovo', color: 'green' },
            { id: 'contacted', label: 'Contattato', color: 'blue' },
            { id: 'interested', label: 'Interessato', color: 'yellow' },
            { id: 'client', label: 'Cliente', color: 'purple' },
            { id: 'closed', label: 'Chiuso', color: 'red' }
        ];
        await client.query(`
            INSERT INTO app_settings (id, pdf_options, crm_options, crm_statuses, updated_at)
            VALUES (1, '{}'::jsonb, '{}'::jsonb, $1, NOW())
            ON CONFLICT (id) DO UPDATE SET crm_statuses = $1
        `, [JSON.stringify(defaultStatuses)]);
    }

    console.log('Successfully added crm_statuses column.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    client.release();
    process.exit();
  }
};

addCrmStatusesColumn();
