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
// GET /api/categories
// ============================================
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ============================================
// POST /api/categories { name }
// ============================================
app.post("/api/categories", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name required" });

  try {
    await pool.query("INSERT INTO categories (name) VALUES ($1)", [name]);
    const cats = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(cats.rows);
  } catch (err) {
    console.error(err);
    // Ignore duplicate key errors gracefully by just returning the list
    if (err.code === '23505') {
       const cats = await pool.query("SELECT * FROM categories ORDER BY name ASC");
       return res.json(cats.rows);
    }
    res.status(500).json({ error: "Failed to add category" });
  }
});

// ============================================
// PUT /api/categories/:id  { name }
// ============================================
app.put("/api/categories/:id", async (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get old category name
    const existing = await client.query("SELECT * FROM categories WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Category not found" });
    }
    const oldName = existing.rows[0].name;

    // Rename category
    await client.query("UPDATE categories SET name = $1 WHERE id = $2", [name, id]);

    // Update all inventory items with old category name (case-insensitive)
    await client.query("UPDATE inventory SET category = $1 WHERE LOWER(category) = LOWER($2)", [name, oldName]);

    await client.query("COMMIT");

    const cats = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(cats.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to update category" });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE /api/categories/bulk
// ============================================
app.delete("/api/categories/bulk", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No category IDs provided" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const id of ids) {
      const existing = await client.query("SELECT * FROM categories WHERE id = $1", [id]);
      if (existing.rows.length > 0) {
        const catName = existing.rows[0].name;
        // Update orders for shortage
        await client.query(
          "UPDATE orders SET shortage_quantity = ordered_quantity - sent_quantity WHERE product_name IN (SELECT item_name FROM inventory WHERE LOWER(category) = LOWER($1)) AND (status = 'Pending' OR status = 'Partially Sent')",
          [catName]
        );
        // DELETE inventory items in this category
        await client.query("DELETE FROM inventory WHERE LOWER(category) = LOWER($1)", [catName]);
        // Delete the category
        await client.query("DELETE FROM categories WHERE id = $1", [id]);
      }
    }

    await client.query("COMMIT");
    const cats = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(cats.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to bulk delete categories" });
  } finally {
    client.release();
  }
});

// ============================================
// DELETE /api/categories/:id
// ============================================
app.delete("/api/categories/:id", async (req, res) => {
  const id = req.params.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT * FROM categories WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Category not found" });
    }
    const catName = existing.rows[0].name;

    // Update orders for any items in this category to reflect full shortage (since items are gone)
    await client.query(
      "UPDATE orders SET shortage_quantity = ordered_quantity - sent_quantity WHERE product_name IN (SELECT item_name FROM inventory WHERE LOWER(category) = LOWER($1)) AND (status = 'Pending' OR status = 'Partially Sent')",
      [catName]
    );

    // DELETE inventory items in this category
    await client.query("DELETE FROM inventory WHERE LOWER(category) = LOWER($1)", [catName]);

    // Delete the category
    await client.query("DELETE FROM categories WHERE id = $1", [id]);

    await client.query("COMMIT");

    const cats = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(cats.rows);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  } finally {
    client.release();
  }
});

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
  // Get current physical stock (available_quantity means physical stock)
  const invRes = await client.query(
    "SELECT available_quantity FROM inventory WHERE item_name = $1",
    [productName]
  );
  
  // If product not found in inventory, assume 0 physical stock
  let physicalStock = invRes.rows.length > 0 ? invRes.rows[0].available_quantity : 0;

  // Get all pending and partial orders for this product
  const ordersRes = await client.query(
    `SELECT id, ordered_quantity, sent_quantity
     FROM orders
     WHERE product_name = $1 AND (status = 'Pending' OR status = 'Partially Sent')
     ORDER BY created_at ASC`,
    [productName]
  );

  for (const order of ordersRes.rows) {
    const remainingToFill = order.ordered_quantity - order.sent_quantity;
    const fillable = Math.min(physicalStock, remainingToFill);
    const shortage = remainingToFill - fillable;
    
    physicalStock -= fillable;

    await client.query("UPDATE orders SET shortage_quantity = $1 WHERE id = $2", [shortage, order.id]);
  }
}

// ============================================
// GET /api/inventory
// ============================================
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
});

// ============================================
// POST /api/inventory  { itemName, quantity, category }
// ============================================
app.post("/api/inventory", async (req, res) => {
  const { itemName, quantity, category } = req.body;
  const qty = Number(quantity);
  if (!itemName || !qty || qty <= 0 || !category) {
    return res.status(400).json({ error: "Invalid itemName, quantity or category" });
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
        "INSERT INTO inventory (item_name, available_quantity, category) VALUES ($1, $2, $3)",
        [itemName, qty, category]
      );
    } else {
      await client.query(
        "UPDATE inventory SET available_quantity = available_quantity + $1, category = $2 WHERE item_name = $3",
        [qty, category, itemName]
      );
    }

    // Reallocate stock for this product
    await reallocateStock(client, itemName);

    await client.query("COMMIT");

    // Return updated state
    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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

    // Just insert the order as Pending
    await client.query(
      `INSERT INTO orders (order_date, customer_name, product_name, ordered_quantity, shortage_quantity, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')`,
      [orderDate || null, customerName, productName, qty, qty]
    );

    // Calculate initial shortages for this product
    await reallocateStock(client, productName);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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

    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];
    if (order.status !== "Pending" && order.status !== "Partially Sent") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Only Pending or Partially Sent orders can be rejected" });
    }

    // Just mark as rejected and zero out shortage
    await client.query(
      "UPDATE orders SET status = 'Rejected', shortage_quantity = 0 WHERE id = $1",
      [orderId]
    );

    // Recalculate shortages for others
    await reallocateStock(client, order.product_name);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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
// PUT /api/orders/:id/send  { sendQuantity }
// ============================================
app.put("/api/orders/:id/send", async (req, res) => {
  const orderId = req.params.id;
  const { sendQuantity } = req.body;
  const sendQty = Number(sendQuantity);

  if (!sendQty || sendQty <= 0) {
    return res.status(400).json({ error: "Invalid send quantity" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    if (orderRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];
    if (order.status === "Rejected" || order.status === "Sent") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot send a rejected or fully sent order" });
    }

    const remainingToShip = order.ordered_quantity - order.sent_quantity;
    if (sendQty > remainingToShip) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Cannot send ${sendQty}. Only ${remainingToShip} remaining.` });
    }

    // DEDUCT PHYSICAL STOCK FROM INVENTORY
    const invRes = await client.query("SELECT available_quantity FROM inventory WHERE item_name = $1", [order.product_name]);
    const currentPhysical = invRes.rows[0]?.available_quantity || 0;
    
    if (sendQty > currentPhysical) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Insufficient physical stock (${currentPhysical}) to send ${sendQty}.` });
    }

    await client.query(
      "UPDATE inventory SET available_quantity = available_quantity - $1 WHERE item_name = $2",
      [sendQty, order.product_name]
    );

    // UPDATE ORDER
    const newSentQty = order.sent_quantity + sendQty;
    const newStatus = newSentQty >= order.ordered_quantity ? "Sent" : "Partially Sent";
    const finalShortage = newStatus === 'Sent' ? 0 : Math.max(0, order.shortage_quantity); // Shortage definitely 0 if fully sent

    await client.query(
      "UPDATE orders SET sent_quantity = $1, status = $2, shortage_quantity = $3 WHERE id = $4",
      [newSentQty, newStatus, finalShortage, orderId]
    );

    // Recalculate shortages for others now that stock is physically gone
    await reallocateStock(client, order.product_name);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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
  const { itemName, quantity, category } = req.body;
  const qty = Number(quantity);
  
  if (!itemName || isNaN(qty) || qty < 0 || !category) {
    return res.status(400).json({ error: "Invalid itemName, quantity or category" });
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
      "UPDATE inventory SET item_name = $1, available_quantity = $2, category = $3 WHERE id = $4",
      [itemName, qty, category, id]
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

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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
// DELETE /api/inventory/bulk
// ============================================
app.delete("/api/inventory/bulk", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No inventory IDs provided" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const id of ids) {
      const existing = await client.query("SELECT * FROM inventory WHERE id = $1", [id]);
      if (existing.rows.length > 0) {
        const itemName = existing.rows[0].item_name;
        await client.query("DELETE FROM inventory WHERE id = $1", [id]);
        await reallocateStock(client, itemName);
      }
    }

    await client.query("COMMIT");
    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to bulk delete inventory" });
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

    // Recalculate shortages for others (will now be 0 since item is gone)
    await reallocateStock(client, itemName);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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

    // Update order
    await client.query(
      "UPDATE orders SET customer_name = $1, product_name = $2, ordered_quantity = $3, shortage_quantity = $3 - sent_quantity WHERE id = $4",
      [customerName, productName, qty, id]
    );

    // Reallocate shortages for both old and new product
    if (order.product_name !== productName) {
       await reallocateStock(client, order.product_name);
    }
    await reallocateStock(client, productName);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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
// DELETE /api/orders/bulk
// ============================================
app.delete("/api/orders/bulk", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "No order IDs provided" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const affectedProducts = new Set();
    for (const id of ids) {
      const existingRes = await client.query("SELECT * FROM orders WHERE id = $1", [id]);
      if (existingRes.rows.length > 0) {
        const order = existingRes.rows[0];
        affectedProducts.add(order.product_name);
        await client.query("DELETE FROM orders WHERE id = $1", [id]);
      }
    }

    for (const productName of affectedProducts) {
      await reallocateStock(client, productName);
    }

    await client.query("COMMIT");
    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
    const ords = await pool.query("SELECT * FROM orders ORDER BY created_at ASC");
    res.json({ inventory: inv.rows, orders: ords.rows });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to bulk delete orders" });
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

    await client.query("DELETE FROM orders WHERE id = $1", [id]);

    // Update shortages for others now that this order is gone
    await reallocateStock(client, order.product_name);

    await client.query("COMMIT");

    const inv = await pool.query("SELECT id, item_name, available_quantity, category FROM inventory ORDER BY item_name ASC");
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
