
const { pool } = require('./db');

async function addCrmSettingsColumn() {
  const client = await pool.connect();
  try {
    console.log('Adding crm_options column to app_settings...');
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE app_settings ADD COLUMN crm_options JSONB DEFAULT '{}'::jsonb;
        EXCEPTION
          WHEN duplicate_column THEN NULL;
        END;
      END $$;
    `);
    
    // Initialize default CRM options if empty
    const result = await client.query('SELECT crm_options FROM app_settings WHERE id = 1');
    if (result.rows.length > 0) {
        const currentOptions = result.rows[0].crm_options;
        if (!currentOptions || Object.keys(currentOptions).length === 0) {
             const defaultCrmOptions = {
                business_name: true,
                contact_name: true,
                address: true,
                city: true,
                province: true,
                phone: true,
                email: true,
                main_interest: true,
                availability: true,
                services: true,
                status: true,
                source: true,
                notes: true,
                assigned_consultant: true
            };
            await client.query('UPDATE app_settings SET crm_options = $1 WHERE id = 1', [JSON.stringify(defaultCrmOptions)]);
            console.log('Default CRM options initialized.');
        }
    }

    console.log('Schema updated successfully!');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    client.release();
    pool.end();
  }
}

addCrmSettingsColumn();
