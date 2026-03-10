import React, { useState } from "react";

function OrderSheet({ inventory, placeOrder }) {
  const [orderDate, setOrderDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [orderedQuantity, setOrderedQuantity] = useState("");

  return (
    <div className="form-section">
      <h3>Place New Order</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Order Date</label>
          <input
            className="form-input"
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Customer Name</label>
          <input
            className="form-input"
            placeholder="e.g. John Doe"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Product</label>
          <select
            className="form-select"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          >
            <option value="">Select Product</option>
            {inventory.map((item, index) => (
              <option key={index} value={item.itemName}>
                {item.itemName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input
            className="form-input"
            type="number"
            placeholder="0"
            value={orderedQuantity}
            onChange={(e) => setOrderedQuantity(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ flex: "0 0 auto" }}>
          <label>&nbsp;</label>
          <button
            className="btn btn-primary"
            onClick={() => {
              placeOrder({
                orderDate,
                customerName,
                productName,
                orderedQuantity,
              });
              setOrderedQuantity("");
            }}
          >
            🛒 Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSheet;