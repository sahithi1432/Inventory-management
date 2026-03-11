const pool = require("./db");

async function migrate() {
  try {
    await pool.query(
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS sent_quantity INTEGER DEFAULT 0`
    );
    console.log("✅ Migration successful: Added 'sent_quantity' column to 'orders' table.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
