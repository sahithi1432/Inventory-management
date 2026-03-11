import React from "react";

function HomePage({ inventory, orders, searchQuery, setActiveTab, setSearchQuery, setStatusFilter }) {
  const q = searchQuery.toLowerCase();

  const filteredInventory = inventory.filter(item => 
    (item.itemName || "").toLowerCase().includes(q) ||
    String(item.availableQuantity || "").includes(q)
  );

  const filteredOrders = orders.filter(order => {
    const pendingQty = order.orderedQuantity - (order.sentQuantity || 0);
    return (
      (order.customerName || "").toLowerCase().includes(q) ||
      (order.productName || "").toLowerCase().includes(q) ||
      (order.orderDate || "").toLowerCase().includes(q) ||
      (order.status || "").toLowerCase().includes(q) ||
      String(order.orderedQuantity || "").includes(q) ||
      String(order.sentQuantity || 0).includes(q) ||
      String(order.shortageQuantity || 0).includes(q) ||
      String(pendingQty).includes(q)
    );
  });

  const totalProducts = filteredInventory.length;
  const totalStock = filteredInventory.reduce((sum, i) => sum + i.availableQuantity, 0);
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter((o) => o.status === "Pending" || o.status === "Partially Sent").length;
  const sentOrders = filteredOrders.filter((o) => o.status === "Sent").length;
  const rejectedOrders = filteredOrders.filter((o) => o.status === "Rejected").length;
  const totalShortage = filteredOrders
    .filter((o) => o.status === "Pending")
    .reduce((sum, o) => sum + o.shortageQuantity, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>

      </div>

      <div className="stats-grid">
        <div 
          className="stat-card accent"
          onClick={() => setActiveTab("inventory")}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-value">{totalProducts}</div>
          <div className="stat-label">Products</div>
        </div>

        <div 
          className="stat-card warning"
          onClick={() => {
            setActiveTab("orders");
            if (setStatusFilter) setStatusFilter("Pending");
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="stat-value">{pendingOrders}</div>
          <div className="stat-label">Pending Orders</div>
        </div>

        <div 
          className="stat-card danger"
          onClick={() => {
            setActiveTab("orders");
            if (setStatusFilter) setStatusFilter("Pending");
          }}
          style={{ cursor: "pointer" }}
        >
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
            <span style={{ fontSize: 22, fontWeight: 700 }}>{filteredOrders.filter(o => o.status === 'Pending').length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge badge-sent" style={{ fontSize: 14, padding: "6px 16px" }}>Sent</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{filteredOrders.filter(o => o.status === 'Sent').length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="badge badge-rejected" style={{ fontSize: 14, padding: "6px 16px" }}>Rejected</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{filteredOrders.filter(o => o.status === 'Rejected').length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{filteredOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Inventory Stock Levels */}
      {inventory.length > 0 && (
        <div>
          <h3 className="section-title">Stock Levels {searchQuery && <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--text-muted)' }}>(Results for "{searchQuery}")</span>}</h3>
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
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No matching products found.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item, idx) => {
                    const badgeClass =
                      item.availableQuantity === 0 ? "badge-out" :
                      item.availableQuantity <= 300 ? "badge-low-stock" : "badge-in-stock";
                    const label =
                      item.availableQuantity === 0 ? "Out of Stock" :
                      item.availableQuantity <= 300 ? "Low Stock" : "In Stock";
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.itemName}</td>
                        <td>{item.availableQuantity}</td>
                        <td><span className={`badge ${badgeClass}`}>{label}</span></td>
                      </tr>
                    );
                  })
                )}
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
