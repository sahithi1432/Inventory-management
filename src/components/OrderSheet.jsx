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
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 100,
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              marginTop: "4px",
              minWidth: "180px",
              overflow: "hidden"
            }}>
              {categories.length === 0 ? (
                <div style={{ padding: "12px 14px", fontSize: "13px", color: "var(--text-muted)" }}>
                  No categories available
                </div>
              ) : (
                /* Mobile Drill-down Header */
                <>
                {hoveredCategory && window.innerWidth <= 768 && (
                  <div 
                    style={{ 
                      padding: "10px 14px", 
                      background: "var(--bg-input)", 
                      fontSize: "13px", 
                      fontWeight: 600, 
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-color)"
                     }}
                    onClick={handleBackToCategories}
                  >
                    ◀ Back to Categories
                  </div>
                )}
                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                {(!hoveredCategory || window.innerWidth > 768) ? (
                  /* Standard List (Categories) */
                  categories.map(cat => {
                    const items = getItemsForCategory(cat.name);
                    return (
                      <div
                        key={cat.id}
                        style={{ position: "relative" }}
                        onMouseEnter={() => { if(window.innerWidth > 768) setHoveredCategory(cat.name) }}
                        onMouseLeave={() => { if(window.innerWidth > 768) setHoveredCategory(null) }}
                        onClick={() => handleCategoryClick(cat.name)}
                      >
                        <div
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: hoveredCategory === cat.name ? "var(--bg-input)" : "transparent",
                            transition: "background 0.15s",
                          }}
                        >
                          <span>{cat.name}</span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>▶</span>
                        </div>

                        {/* DESKTOP Flyout submenu */}
                        {hoveredCategory === cat.name && window.innerWidth > 768 && (
                          <div style={{
                            position: "absolute",
                            top: 0,
                            left: "100%",
                            background: "var(--bg-card)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            minWidth: "200px",
                            maxHeight: "220px",
                            overflowY: "auto",
                            zIndex: 101,
                          }}>
                            {items.length === 0 ? (
                              <div style={{ padding: "12px 14px", fontSize: "13px", color: "var(--text-muted)" }}>
                                No items
                              </div>
                            ) : (
                              items.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "10px 14px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    transition: "background 0.15s",
                                  }}
                                  onClick={() => handleProductClick(item.itemName)}
                                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-input)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  {item.itemName}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  /* MOBILE Items View */
                  getItemsForCategory(hoveredCategory).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px 14px",
                        cursor: "pointer",
                        fontSize: "14px",
                        borderBottom: "1px solid var(--border-color)",
                      }}
                      onClick={() => handleProductClick(item.itemName)}
                    >
                      {item.itemName}
                    </div>
                  ))
                )}
                </div>
                </>
              )}
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