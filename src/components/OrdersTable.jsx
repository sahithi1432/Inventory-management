import React, { useState } from "react";

function OrdersTable({ orders, rejectOrder, markSent, editOrder, deleteOrder, inventory = [] }) {
  const [editingId, setEditingId] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editProductName, setEditProductName] = useState("");
  const [editOrderedQuantity, setEditOrderedQuantity] = useState("");
  return (
    <div>
      <h3 className="section-title">All Orders</h3>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p>No orders yet. Place your first order above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Ordered</th>
                <th>Shortage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const statusClass =
                  order.status === "Pending" ? "badge-pending" :
                  order.status === "Sent" ? "badge-sent" : "badge-rejected";

                const isEditing = editingId === order.id;

                return (
                  <tr key={order.id}>
                    <td>{order.orderDate || "—"}</td>
                    
                    {/* Customer Name */}
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {isEditing ? (
                        <input
                          className="form-input"
                          style={{ padding: "4px 8px", width: "100%" }}
                          value={editCustomerName}
                          onChange={e => setEditCustomerName(e.target.value)}
                        />
                      ) : (
                        order.customerName
                      )}
                    </td>

                    {/* Product Name */}
                    <td>
                      {isEditing ? (
                        <select
                          className="form-select"
                          style={{ padding: "4px 8px", width: "100%" }}
                          value={editProductName}
                          onChange={e => setEditProductName(e.target.value)}
                        >
                          {/* If inventory isn't passed down perfectly, at least show current option + assume it exists */}
                          <option value={order.productName}>{order.productName}</option>
                          {inventory.filter(i => i.itemName !== order.productName).map((item, idx) => (
                            <option key={idx} value={item.itemName}>{item.itemName}</option>
                          ))}
                        </select>
                      ) : (
                        order.productName
                      )}
                    </td>

                    {/* Ordered Quantity */}
                    <td style={{ fontWeight: 600 }}>
                      {isEditing ? (
                        <input
                          className="form-input"
                          type="number"
                          style={{ padding: "4px 8px", width: "80px" }}
                          value={editOrderedQuantity}
                          onChange={e => setEditOrderedQuantity(e.target.value)}
                        />
                      ) : (
                        order.orderedQuantity
                      )}
                    </td>

                    <td className={order.shortageQuantity > 0 ? "shortage-cell" : ""}>
                      {order.shortageQuantity}
                    </td>

                    <td>
                      <span className={`badge ${statusClass}`}>{order.status}</span>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-success"
                              style={{ padding: "6px 10px" }}
                              onClick={() => {
                                editOrder(order.id, {
                                  customerName: editCustomerName,
                                  productName: editProductName,
                                  orderedQuantity: editOrderedQuantity
                                });
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
                            {order.status === "Pending" && (
                              <>
                                <button
                                  className="btn btn-success"
                                  style={{ padding: "6px 10px" }}
                                  onClick={() => markSent(order.id)}
                                  disabled={order.shortageQuantity > 0}
                                  title={order.shortageQuantity > 0 ? "Cannot send: stock shortage" : "Mark as sent"}
                                >
                                  ✓ Sent
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: "6px 10px" }}
                                  onClick={() => rejectOrder(order.id)}
                                >
                                  ✕ Reject
                                </button>
                                <button
                                  className="btn"
                                  style={{ padding: "6px 10px", background: "var(--info-bg)", color: "var(--info)" }}
                                  onClick={() => {
                                    setEditingId(order.id);
                                    setEditCustomerName(order.customerName);
                                    setEditProductName(order.productName);
                                    setEditOrderedQuantity(order.orderedQuantity);
                                  }}
                                >
                                  Edit
                                </button>
                              </>
                            )}
                            <button
                              className="btn btn-danger"
                              style={{ padding: "6px 10px", opacity: 0.8 }}
                              onClick={() => {
                                if(window.confirm(`Are you sure you want to delete this order for ${order.customerName}?`)) {
                                  deleteOrder(order.id);
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

export default OrdersTable;