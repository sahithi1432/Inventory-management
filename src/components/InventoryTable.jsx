import React, { useState } from "react";

function InventoryTable({ inventory, addInventory, editInventory, deleteInventory, category = "General" }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const filteredInventory = inventory.filter(item => (item.category || "").toLowerCase() === category.toLowerCase());

  return (
    <div>
      <div className="page-header">
        <h2>{category === "General" ? "Stock Management" : `${category} Stock Management`}</h2>
        <p>Add new {category === "General" ? "products" : category.toLowerCase()} or restock existing inventory.</p>
      </div>

      <div className="form-section">
        <h3>Add / Restock {category !== "General" ? category : "Item"}</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Item Name</label>
            <input
              className="form-input"
              placeholder="e.g. Widget Pro"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input
              className="form-input"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: "0 0 auto" }}>
            <label>&nbsp;</label>
            <button
              className="btn btn-primary"
              onClick={() => {
                addInventory(itemName, quantity, category);
                setItemName("");
                setQuantity("");
              }}
            >
              ➕ Add Stock
            </button>
          </div>
        </div>
      </div>

      <h3 className="section-title">Current {category !== "General" ? `${category} ` : ""}Inventory</h3>

      {filteredInventory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No {category === "General" ? "inventory items" : category.toLowerCase()} yet. Add your first product above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Available Quantity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, index) => {
                const badgeClass =
                  item.availableQuantity === 0 ? "badge-out" :
                    item.availableQuantity <= 300 ? "badge-low-stock" : "badge-in-stock";
                const label =
                  item.availableQuantity === 0 ? "Out of Stock" :
                    item.availableQuantity <= 300 ? "Low Stock" : "In Stock";

                const isEditing = editingId === item.id;

                return (
                  <tr key={index}>
                    <td style={{ color: "var(--text-muted)" }}>{index + 1}</td>

                    {/* Item Name Column */}
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {isEditing ? (
                        <input
                          className="form-input"
                          style={{ padding: "4px 8px", width: "100%" }}
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      ) : (
                        item.itemName
                      )}
                    </td>

                    {/* Quantity Column */}
                    <td style={{ fontWeight: 600, fontSize: 16 }}>
                      {isEditing ? (
                        <input
                          className="form-input"
                          type="number"
                          style={{ padding: "4px 8px", width: "80px" }}
                          value={editQty}
                          onChange={e => setEditQty(e.target.value)}
                        />
                      ) : (
                        item.availableQuantity
                      )}
                    </td>

                    {/* Status Column */}
                    <td><span className={`badge ${badgeClass}`}>{label}</span></td>

                    {/* Actions Column */}
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-success"
                              style={{ padding: "6px 10px" }}
                              onClick={() => {
                                editInventory(item.id, editName, editQty, category);
                                setEditingId(null);
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "6px 10px" }}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn"
                              style={{ padding: "6px 10px", background: "var(--info-bg)", color: "var(--info)" }}
                              onClick={() => {
                                setEditingId(item.id);
                                setEditName(item.itemName);
                                setEditQty(item.availableQuantity);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "6px 10px" }}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${item.itemName}?`)) {
                                  deleteInventory(item.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InventoryTable;