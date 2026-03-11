import React, { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function Sidebar({ 
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
  const location = useLocation();
  const navigate = useNavigate();

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const navItems = [
    { id: "home", label: "Home", icon: "🏠", path: "/home" },
    { 
      id: "inventory", 
      label: "Stock", 
      icon: "📦",
      path: "/categories",
      subItems: filteredCategories.map(cat => ({ 
        id: `inventory-${cat.name.toLowerCase()}`, 
        label: cat.name,
        path: `/inventory/${cat.name.toLowerCase()}`
      }))
    },
    { id: "orders", label: "Orders", icon: "🛒", path: "/orders" },
  ];

  const handleTabClick = (e, item) => {
    if (clearStatusFilter) clearStatusFilter();
    
    if (item.id === "inventory") {
      e.preventDefault();
      setIsStockOpen(!isStockOpen);
      if (!isStockOpen && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      navigate(item.path);
    } else {
      setIsStockOpen(false);
      if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const handleSubTabClick = (e) => {
    e.stopPropagation();
    if (clearStatusFilter) clearStatusFilter();
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
            <NavLink
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive || (item.id === 'inventory' && location.pathname.startsWith('/inventory')) ? "active" : ""}`
              }
              onClick={(e) => handleTabClick(e, item)}
              title={!isSidebarOpen && !isMobileMenuOpen ? item.label : ""}
            >
              <span className="nav-icon">{item.icon}</span>
              {(isSidebarOpen || isMobileMenuOpen) && <span className="nav-label">{item.label}</span>}
            </NavLink>
            
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
                      <NavLink
                        key={subItem.id}
                        to={subItem.path}
                        className={({ isActive }) => `nav-item sub-nav-item ${isActive ? "active" : ""}`}
                        onClick={handleSubTabClick}
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        {subItem.label}
                      </NavLink>
                    ))
                  )}
                </div>
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
