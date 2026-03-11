const pool = require("./db");

async function migrate() {
  try {
    await pool.query(
      `ALTER TABLE inventory ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'General'`
    );
    console.log("✅ Migration successful: Added 'category' column to 'inventory' table.");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
