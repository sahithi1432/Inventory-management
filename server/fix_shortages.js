const { Pool } = require('pg');
const pool = new Pool({ 
  user: 'postgres', 
  host: 'localhost', 
  database: 'inventory_db', 
  password: 'postgres', 
  port: 5432 
});

async function fixShortages() {
  try {
    await pool.query("UPDATE orders SET shortage_quantity = 0 WHERE status = 'Sent'");
    console.log('Successfully cleared ghost shortages');
  } catch (err) {
    console.error('Error fixing shortages:', err);
  } finally {
    await pool.end();
  }
}

fixShortages();
