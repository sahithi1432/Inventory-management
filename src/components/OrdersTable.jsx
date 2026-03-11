import React, { useState } from "react";

function OrdersTable({ orders, rejectOrder, markSent, editOrder, deleteOrder, inventory = [] }) {
  const [editingId, setEditingId] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editProductName, setEditProductName] = useState("");
  const [editOrderedQuantity, setEditOrderedQuantity] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [sendQty, setSendQty] = useState("");

  return (
    <div>
      <h3 className="section-title">All Orders</h3>

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
              {orders.map((order) => {
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
                        ) : isSending ? (
                          <>
                            <input
                              className="form-input"
                              type="number"
                              placeholder={`Max ${pendingQty}`}
                              style={{ padding: "4px 8px", width: "90px" }}
                              value={sendQty}
                              onChange={e => setSendQty(e.target.value)}
                              min="1"
                              max={pendingQty}
                            />
                            <button
                              className="btn btn-success"
                              style={{ padding: "6px 10px" }}
                              onClick={() => {
                                const qty = Number(sendQty);
                                if (qty > 0 && qty <= pendingQty) {
                                  markSent(order.id, qty);
                                  setSendingId(null);
                                  setSendQty("");
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
                        ) : (
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