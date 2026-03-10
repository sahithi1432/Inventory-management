import React from "react";

function HomePage({ inventory, orders }) {
  const totalProducts = inventory.length;
  const totalStock = inventory.reduce((sum, i) => sum + i.availableQuantity, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const sentOrders = orders.filter((o) => o.status === "Sent").length;
  const rejectedOrders = orders.filter((o) => o.status === "Rejected").length;
  const totalShortage = orders
    .filter((o) => o.status === "Pending")
    .reduce((sum, o) => sum + o.shortageQuantity, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Real-time snapshot of your inventory and order pipeline.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent">📦</div>
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-label">Products</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon warning">⏳</div>
          <div className="stat-value">{pendingOrders}</div>
          <div className="stat-label">Pending Orders</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-icon danger">⚠️</div>
          <div className="stat-value">{totalShortage}</div>
          <div className="stat-label">Total Shortage</div>
        </div>
      </div>

      {/* Recent Orders Summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title">Order Summary</h3>
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge badge-pending" style={{ fontSize: 14, padding: "6px 16px" }}>Pending</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{pendingOrders}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge badge-sent" style={{ fontSize: 14, padding: "6px 16px" }}>Sent</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{sentOrders}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge badge-rejected" style={{ fontSize: 14, padding: "6px 16px" }}>Rejected</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{rejectedOrders}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{totalOrders}</span>
          </div>
        </div>
      </div>

      {/* Inventory Stock Levels */}
      {inventory.length > 0 && (
        <div>
          <h3 className="section-title">Stock Levels</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, idx) => {
                  const badgeClass =
                    item.availableQuantity === 0 ? "badge-out" :
                    item.availableQuantity <= 5 ? "badge-low-stock" : "badge-in-stock";
                  const label =
                    item.availableQuantity === 0 ? "Out of Stock" :
                    item.availableQuantity <= 5 ? "Low Stock" : "In Stock";
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.itemName}</td>
                      <td>{item.availableQuantity}</td>
                      <td><span className={`badge ${badgeClass}`}>{label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inventory.length === 0 && orders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No data yet. Add stock or place orders to get started.</p>
        </div>
      )}
    </div>
  );
}

export default HomePage;
