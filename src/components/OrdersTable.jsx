import React, { useState } from "react";

function OrdersTable({ orders, rejectOrder, markSent, updateOrder, deleteOrder, inventory = [], searchQuery, statusFilter, clearStatusFilter }) {
  const [editingId, setEditingId] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editProductName, setEditProductName] = useState("");
  const [editOrderedQuantity, setEditOrderedQuantity] = useState("");
  const [editOrderDate, setEditOrderDate] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [sendQty, setSendQty] = useState("");

  const filteredOrders = orders.filter(order => {
    // Apply Status Filter first (from Dashboard cards)
    if (statusFilter && order.status !== statusFilter) {
      // Small exception: if statusFilter is "Pending", also include "Partially Sent"
      if (statusFilter === "Pending" && order.status === "Partially Sent") {
        // Carry on
      } else {
        return false;
      }
    }

    // Then apply Search Query
    const q = searchQuery.toLowerCase();
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="section-title" style={{ margin: 0 }}>
          {statusFilter ? `${statusFilter} Orders` : "All Orders"} 
          {searchQuery && <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--text-muted)', marginLeft: 8 }}>(Results for "{searchQuery}")</span>}
        </h3>
        {statusFilter && (
          <button 
            className="btn" 
            style={{ fontSize: 12, padding: "4px 12px", background: "var(--bg-input)" }}
            onClick={clearStatusFilter}
          >
            Show All Orders
          </button>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
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
                <th>Sent</th>
                <th>Pending</th>
                <th>Shortage</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const pendingQty = order.orderedQuantity - order.sentQuantity;
                  const statusClass =
                    order.status === "Pending" ? "badge-pending" :
                    order.status === "Sent" ? "badge-sent" :
                    order.status === "Partially Sent" ? "badge-partial" :
                    "badge-rejected";

                  const isEditing = editingId === order.id;
                  const isSending = sendingId === order.id;
                  const canSend = (order.status === "Pending" || order.status === "Partially Sent") && pendingQty > 0;

                  return (
                    <tr key={order.id}>
                      <td>
                        {isEditing ? (
                          <input
                            className="form-input"
                            type="date"
                            min="2000-01-01"
                            max="2099-12-31"
                            style={{ padding: "4px 8px", width: "130px", fontSize: "12px" }}
                            value={editOrderDate}
                            onChange={e => setEditOrderDate(e.target.value)}
                          />
                        ) : (
                          order.orderDate || "—"
                        )}
                      </td>

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
                          <>
                            <input
                              className="form-input"
                              list={`products-list-${order.id}`}
                              style={{ padding: "4px 8px", width: "100%" }}
                              value={editProductName}
                              onChange={e => setEditProductName(e.target.value)}
                              placeholder="Type or select..."
                            />
                            <datalist id={`products-list-${order.id}`}>
                              {inventory.map((item, idx) => (
                                <option key={idx} value={item.itemName} />
                              ))}
                            </datalist>
                          </>
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

                      {/* Sent Quantity */}
                      <td style={{ fontWeight: 600, color: "var(--success)" }}>
                        {order.sentQuantity || 0}
                      </td>

                      {/* Pending Quantity */}
                      <td style={{ fontWeight: 600, color: pendingQty > 0 ? "var(--warning)" : "var(--text-muted)" }}>
                        {pendingQty}
                      </td>

                      {/* Shortage */}
                      <td className={order.shortageQuantity > 0 ? "shortage-cell" : ""}>
                        {order.shortageQuantity}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${statusClass}`}>{order.status}</span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                          {isEditing ? (
                            <>
                              <button
                                className="btn btn-success"
                                style={{ padding: "6px 10px" }}
                                onClick={() => {
                                  if (editOrderDate) {
                                    const year = new Date(editOrderDate).getFullYear();
                                    if (year < 2000 || year > 2099) {
                                      alert("Please enter a valid year (2000-2099).");
                                      return;
                                    }
                                  }
                                  updateOrder(order.id, {
                                    customerName: editCustomerName,
                                    productName: editProductName,
                                    orderedQuantity: Number(editOrderedQuantity),
                                    orderDate: editOrderDate
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
                          ) : isSending ? (() => {
                            const physicalStock = inventory.find(i => i.itemName === order.productName)?.availableQuantity || 0;
                            const maxPossible = Math.min(pendingQty, physicalStock);
                            
                            return (
                              <>
                                <input
                                  className="form-input"
                                  type="number"
                                  placeholder={`Max ${maxPossible}`}
                                  style={{ padding: "4px 8px", width: "90px" }}
                                  value={sendQty}
                                  onChange={e => setSendQty(e.target.value)}
                                  min="1"
                                  max={maxPossible}
                                />
                                <button
                                  className="btn btn-success"
                                  style={{ padding: "6px 10px" }}
                                  onClick={() => {
                                    const qty = Number(sendQty);
                                    if (qty > 0 && qty <= maxPossible) {
                                      markSent(order.id, qty);
                                      setSendingId(null);
                                      setSendQty("");
                                    } else if (qty > maxPossible) {
                                      alert(`Cannot send more than available physical stock (${physicalStock}) or pending quantity (${pendingQty}).`);
                                    }
                                  }}
                                >
                                  Confirm
                                </button>
                                <button
                                  className="btn btn-danger"
                                  style={{ padding: "6px 10px" }}
                                  onClick={() => { setSendingId(null); setSendQty(""); }}
                                >
                                  Cancel
                                </button>
                              </>
                            );
                          })() : (
                            <>
                              {canSend && (
                                <button
                                  className="btn btn-success"
                                  style={{ padding: "6px 10px" }}
                                  onClick={() => {
                                    setSendingId(order.id);
                                    setSendQty("");
                                  }}
                                >
                                  Send
                                </button>
                              )}
                              {(order.status === "Pending" || order.status === "Partially Sent") && (
                                <>
                                  <button
                                    className="btn btn-danger"
                                    style={{ padding: "6px 10px" }}
                                    onClick={() => rejectOrder(order.id)}
                                  >
                                    Reject
                                  </button>
                                  <button
                                    className="btn"
                                    style={{ padding: "6px 10px", background: "var(--info-bg)", color: "var(--info)" }}
                                    onClick={() => {
                                      setEditingId(order.id);
                                      setEditCustomerName(order.customerName);
                                      setEditProductName(order.productName);
                                      setEditOrderedQuantity(order.orderedQuantity);
                                      setEditOrderDate(order.orderDate || "");
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
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrdersTable;