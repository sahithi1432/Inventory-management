import React, { useState, useRef, useEffect } from "react";

function OrderSheet({ inventory, categories = [], placeOrder }) {
  const [orderDate, setOrderDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [orderedQuantity, setOrderedQuantity] = useState("");

  const [pickerOpen, setPickerOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const pickerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false);
        setHoveredCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getItemsForCategory = (catName) => {
    return inventory.filter(item => (item.category || "").toLowerCase() === catName.toLowerCase());
  };

  const handleCategoryClick = (catName) => {
    if (window.innerWidth <= 768) {
      setHoveredCategory(catName);
    }
  };

  const handleBackToCategories = (e) => {
    e.stopPropagation();
    setHoveredCategory(null);
  };

  const handleProductClick = (itemName) => {
    setProductName(itemName);
    setPickerOpen(false);
    setHoveredCategory(null);
  };

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

        {/* Flyout/Drill-down Product Picker */}
        <div className="form-group" style={{ position: "relative" }} ref={pickerRef}>
          <label>Product</label>
          <div
            className="form-input"
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: productName ? "var(--text-primary)" : "var(--text-muted)",
              userSelect: "none",
            }}
            onClick={() => {
              setPickerOpen(!pickerOpen);
              setHoveredCategory(null);
            }}
          >
            {productName || "Select Product"}
          </div>

          {pickerOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              left: 0,
              zIndex: 1000,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "10px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
              display: "flex",
              minWidth: "450px",
              maxHeight: "350px",
              overflow: "hidden",
              animation: "dropdownFade 0.2s ease-out",
            }}>
              {/* Left Pane: Categories */}
              <div style={{ 
                width: "180px", 
                borderRight: "1px solid var(--border-color)", 
                background: "var(--bg-input)",
                padding: "8px 0",
                overflowY: "auto"
              }}>
                {categories.length === 0 ? (
                  <div style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text-muted)" }}>
                    No categories
                  </div>
                ) : (
                  categories.map(cat => {
                    const isActive = hoveredCategory === cat.name;
                    return (
                      <div
                        key={cat.id}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: isActive ? 600 : 400,
                          background: isActive ? "var(--bg-card)" : "transparent",
                          color: isActive ? "var(--accent)" : "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={() => setHoveredCategory(cat.name)}
                        onClick={() => setHoveredCategory(cat.name)}
                      >
                        <span>{cat.name}</span>
                        <span style={{ fontSize: "12px", opacity: isActive ? 1 : 0.4 }}>›</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Pane: Items */}
              <div style={{ 
                flex: 1, 
                padding: "8px 0", 
                overflowY: "auto",
                background: "var(--bg-card)"
              }}>
                {!hoveredCategory ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    Select a category to view items
                  </div>
                ) : (
                  <>
                    {getItemsForCategory(hoveredCategory).length === 0 ? (
                      <div style={{ padding: "20px 16px", fontSize: "13px", color: "var(--text-muted)", fontStyle: "italic" }}>
                        No items found
                      </div>
                    ) : (
                      getItemsForCategory(hoveredCategory).map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: "10px 16px",
                            cursor: "pointer",
                            fontSize: "14px",
                            color: "var(--text-primary)",
                            transition: "all 0.1s",
                          }}
                          onClick={() => handleProductClick(item.itemName)}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--accent-glow)";
                            e.currentTarget.style.color = "var(--accent)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          {item.itemName}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}
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
              setProductName("");
            }}
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderSheet;