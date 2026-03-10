const express = require("express");
const cors = require("cors");
const pool = require("./db");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ============================================
// DATABASE INITIALIZATION
// ============================================
async function initDB() {
  const sql = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
  await pool.query(sql);
  console.log("✅ Database tables initialized");
}

// ============================================
// 🔥 FIFO REALLOCATION (runs inside a transaction)
// ============================================
async function reallocateStock(client, productName) {
  // Get current available quantity
  const invRes = await client.query(
    "SELECT id, available_quantity FROM inventory WHERE item_name = $1",
    [productName]
  );
  if (invRes.rows.length === 0) return;

  const invRow = invRes.rows[0];

  // Get all pending orders for this product, ordered by created_at (FIFO)
  const ordersRes = await client.query(
    `SELECT id, ordered_quantity, shortage_quantity
     FROM orders
     WHERE product_name = $1 AND status = 'Pending'
     ORDER BY created_at ASC`,
    [productName]
  );

  // Build pool = available + already allocated to pending orders
  const alreadyAllocated = ordersRes.rows.reduce((sum, o) => {
    return sum + (o.ordered_quantity - o.shortage_quantity);
  }, 0);

  let pool_qty = invRow.available_quantity + alreadyAllocated;

  // FIFO distribute
  for (const order of ordersRes.rows) {
    const allocated = Math.min(pool_qty, order.ordered_quantity);
    const shortage = order.ordered_quantity - allocated;
    pool_qty -= allocated;

    await client.query(
      "UPDATE orders SET shortage_quantity = $1 WHERE id = $2",
      [shortage, order.id]
    );
  }

  // Remaining pool is new available
  await client.query(
    "UPDATE inventory SET available_quantity = $1 WHERE id = $2",
    [pool_qty, invRow.id]
  );
}

// ============================================
// GET /api/inventory
// ============================================
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, item_name, available_quantity FROM inventory ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// ============================================
// POST /api/inventory  { itemName, quantity }
// ============================================
app.post("/api/inventory", async (req, res) => {
  const { itemName, quantity } = req.body;
  const qty = Number(quantity);
  if (!itemName || !qty || qty <= 0) {
    return res.status(400).json({ error: "Invalid itemName or quantity" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Upsert inventory item
    const existing = await client.query(
      "SELECT id FROM inventory WHERE item_name = $1",
      [itemName]
    );

    if (existing.rows.length === 0) {
      await client.query(
        "INSERT INTO inventory (item_name, available_quantity) VALUES ($1, $2)",
        [itemName, qty]
      );
    } else {
      await client.query(
        "UPDATE inventory SET available_quantity = available_quantity + $1 WHERE item_name = $2",
        [qty, itemName]
      );
    }

    // Reallocate stock for this product
    await reallocateStock(client, itemName);

    await client.query("COMMIT");

    // Return updated state
    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to add inventory" });
  } finally {
    client.release();
  }
});

// ============================================
// GET /api/orders
// ============================================
app.get("/api/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ============================================
// POST /api/orders  { orderDate, customerName, productName, orderedQuantity }
// ============================================
app.post("/api/orders", async (req, res) => {
  const { orderDate, customerName, productName, orderedQuantity } = req.body;
  const qty = Number(orderedQuantity);
  if (!customerName || !productName || !qty || qty <= 0) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert with shortage = orderedQuantity (nothing allocated yet)
    await client.query(
      `INSERT INTO orders (order_date, customer_name, product_name, ordered_quantity, shortage_quantity, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')`,
      [orderDate || null, customerName, productName, qty, qty]
    );

    // Reallocate
    await reallocateStock(client, productName);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to place order" });
  } finally {
    client.release();
  }
});

// ============================================
// PUT /api/orders/:id/reject
// ============================================
app.put("/api/orders/:id/reject", async (req, res) => {
  const orderId = req.params.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get order before rejecting
    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];
    if (order.status !== "Pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Only pending orders can be rejected" });
    }

    // Restore only what was actually allocated
    const actuallyAllocated = order.ordered_quantity - order.shortage_quantity;
    await client.query(
      "UPDATE inventory SET available_quantity = available_quantity + $1 WHERE item_name = $2",
      [actuallyAllocated, order.product_name]
    );

    // Mark as rejected
    await client.query(
      "UPDATE orders SET status = 'Rejected', shortage_quantity = 0 WHERE id = $1",
      [orderId]
    );

    // Reallocate remaining pending orders
    await reallocateStock(client, order.product_name);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to reject order" });
  } finally {
    client.release();
  }
});

// ============================================
// PUT /api/orders/:id/send
// ============================================
app.put("/api/orders/:id/send", async (req, res) => {
  const orderId = req.params.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];
    if (order.status !== "Pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Only pending orders can be sent" });
    }
    if (order.shortage_quantity > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot send order with shortage" });
    }

    await client.query(
      "UPDATE orders SET status = 'Sent' WHERE id = $1",
      [orderId]
    );

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to send order" });
  } finally {
    client.release();
  }
});
// ============================================
// PUT /api/inventory/:id
// ============================================
app.put("/api/inventory/:id", async (req, res) => {
  const id = req.params.id;
  const { itemName, quantity } = req.body;
  const qty = Number(quantity);
  
  if (!itemName || isNaN(qty) || qty < 0) {
    return res.status(400).json({ error: "Invalid itemName or quantity" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT * FROM inventory WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Item not found" });
    }
    const oldName = existing.rows[0].item_name;

    // Update the item
    await client.query(
      "UPDATE inventory SET item_name = $1, available_quantity = $2 WHERE id = $3",
      [itemName, qty, id]
    );

    // If name changed, update orders too to maintain link
    if (oldName !== itemName) {
      await client.query(
        "UPDATE orders SET product_name = $1 WHERE product_name = $2",
        [itemName, oldName]
      );
    }

    // Reallocate
    await reallocateStock(client, itemName);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to update inventory" });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE /api/inventory/:id
// ============================================
app.delete("/api/inventory/:id", async (req, res) => {
  const id = req.params.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT * FROM inventory WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Item not found" });
    }
    
    const itemName = existing.rows[0].item_name;
    
    // Delete item
    await client.query("DELETE FROM inventory WHERE id = $1", [id]);

    // Pending orders for this item now have 0 pool_qty. Set shortage to ordered qty.
    await client.query(
      "UPDATE orders SET shortage_quantity = ordered_quantity WHERE product_name = $1 AND status = 'Pending'",
      [itemName]
    );

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to delete inventory" });
  } finally {
    client.release();
  }
});

// ============================================
// PUT /api/orders/:id
// ============================================
app.put("/api/orders/:id", async (req, res) => {
  const id = req.params.id;
  const { customerName, productName, orderedQuantity } = req.body;
  const qty = Number(orderedQuantity);

  if (!customerName || !productName || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existingRes = await client.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    const order = existingRes.rows[0];

    // If order was pending, restore its allocated stock to the pool before recreating it
    if (order.status === 'Pending') {
      const actuallyAllocated = order.ordered_quantity - order.shortage_quantity;
      await client.query(
        "UPDATE inventory SET available_quantity = available_quantity + $1 WHERE item_name = $2",
        [actuallyAllocated, order.product_name]
      );
    }

    // Update order (reset shortage_quantity as if it's a new pending state)
    let newShortage = order.status === 'Pending' ? qty : order.shortage_quantity;
    await client.query(
      "UPDATE orders SET customer_name = $1, product_name = $2, ordered_quantity = $3, shortage_quantity = $4 WHERE id = $5",
      [customerName, productName, qty, newShortage, id]
    );

    // Reallocate
    if (order.status === 'Pending') {
      if (order.product_name !== productName) {
         await reallocateStock(client, order.product_name);
      }
      await reallocateStock(client, productName);
    }

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to update order" });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE /api/orders/:id
// ============================================
app.delete("/api/orders/:id", async (req, res) => {
  const id = req.params.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const existingRes = await client.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (existingRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    const order = existingRes.rows[0];

    // Restore stock if pending
    if (order.status === 'Pending') {
      const actuallyAllocated = order.ordered_quantity - order.shortage_quantity;
      await client.query(
        "UPDATE inventory SET available_quantity = available_quantity + $1 WHERE item_name = $2",
        [actuallyAllocated, order.product_name]
      );
    }

    await client.query("DELETE FROM orders WHERE id = $1", [id]);

    if (order.status === 'Pending') {
      await reallocateStock(client, order.product_name);
    }

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity FROM inventory ORDER BY id");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to delete order" });
  } finally {
    client.release();
  }
});
// ============================================
// START SERVER
// ============================================
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
