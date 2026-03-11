import React, { useState } from "react";

function Sidebar({ 
  activeTab, 
  setActiveTab, 
  categories = [], 
  isStockOpen, 
  setIsStockOpen, 
  isSidebarOpen, 
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  clearStatusFilter
}) {
  const [sidebarSearch, setSidebarSearch] = useState("");

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const navItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { 
      id: "inventory", 
      label: "Stock", 
      icon: "📦",
      subItems: filteredCategories.map(cat => ({ 
        id: `inventory-${cat.name.toLowerCase()}`, 
        label: cat.name 
      }))
    },
    { id: "orders", label: "Orders", icon: "🛒" },
  ];

  const handleTabClick = (id, hasSubItems = false) => {
    if (clearStatusFilter) clearStatusFilter();
    if (hasSubItems) {
      setIsStockOpen(!isStockOpen);
      if (!isStockOpen && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    } else {
      setActiveTab(id);
      setIsStockOpen(false);
      if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const handleSubTabClick = (e, id) => {
    e.stopPropagation();
    if (clearStatusFilter) clearStatusFilter();
    setActiveTab(id);
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <aside 
      className={`sidebar ${!isSidebarOpen ? "collapsed" : ""} ${isMobileMenuOpen ? "mobile-open" : ""}`}
      onMouseEnter={() => {
        if (window.innerWidth > 768) setIsSidebarOpen(true);
      }}
      onMouseLeave={() => {
        if (window.innerWidth > 768) {
          setIsSidebarOpen(false);
          // Don't close stock menu here so search remains accessible
        }
      }}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img
            src="/logo.png"
            alt="Juice N Power"
            style={{ width: (isSidebarOpen || isMobileMenuOpen) ? "50%" : "35px", maxWidth: 100, display: "block", margin: "0 auto" }}
          />
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div key={item.id}>
            <div
              className={`nav-item ${activeTab === item.id || (item.subItems && activeTab.startsWith('inventory-')) ? "active" : ""}`}
              onClick={() => handleTabClick(item.id, !!item.subItems)}
              title={!isSidebarOpen && !isMobileMenuOpen ? item.label : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {(isSidebarOpen || isMobileMenuOpen) && <span className="nav-label">{item.label}</span>}
            </div>
            
            {item.id === "inventory" && isStockOpen && (isSidebarOpen || isMobileMenuOpen) && (
              <div style={{ padding: "4px 12px 0 12px" }}>
                <div style={{ position: "relative", marginBottom: "8px" }}>
                  <input
                    type="text"
                    placeholder="Search stock..."
                    style={{
                      width: "100%",
                      padding: "6px 8px 6px 24px",
                      fontSize: "12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      outline: "none"
                    }}
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", opacity: 0.5 }}>🔍</span>
                </div>
                
                <div 
                  className="sub-menu"
                  style={{ 
                    maxHeight: categories.length > 10 ? "280px" : "none",
                    overflowY: categories.length > 10 ? "auto" : "visible",
                    paddingLeft: "12px",
                    margin: 0
                  }}
                >
                  {item.subItems.length === 0 ? (
                    <div style={{ padding: "8px 12px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>
                      No categories found
                    </div>
                  ) : (
                    item.subItems.map(subItem => (
                      <div
                        key={subItem.id}
                        className={`nav-item sub-nav-item ${activeTab === subItem.id ? "active" : ""}`}
                        onClick={(e) => handleSubTabClick(e, subItem.id)}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {subItem.label}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {item.id !== "inventory" && item.subItems && isStockOpen && (isSidebarOpen || isMobileMenuOpen) && (
              <div className="sub-menu">
                {item.subItems.map(subItem => (
                  <div
                    key={subItem.id}
                    className={`nav-item sub-nav-item ${activeTab === subItem.id ? "active" : ""}`}
                    onClick={(e) => handleSubTabClick(e, subItem.id)}
                  >
                    {subItem.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {(isSidebarOpen || isMobileMenuOpen) ? (
          <>
            © Juice N Power
            <br />
            @Gopi krishna.Kotagiri
          </>
        ) : (
          "JP"
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
