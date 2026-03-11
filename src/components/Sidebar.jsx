import React from "react";

function Sidebar({ 
  activeTab, 
  setActiveTab, 
  categories = [], 
  isStockOpen, 
  setIsStockOpen, 
  isSidebarOpen, 
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) {

  const navItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { 
      id: "inventory", 
      label: "Stock", 
      icon: "📦",
      subItems: categories.map(cat => ({ 
        id: `inventory-${cat.name.toLowerCase()}`, 
        label: cat.name 
      }))
    },
    { id: "orders", label: "Orders", icon: "🛒" },
  ];

  const handleTabClick = (id, hasSubItems = false) => {
    if (hasSubItems) {
      setIsStockOpen(!isStockOpen);
      setActiveTab(id);
    } else {
      setActiveTab(id);
      setIsStockOpen(false);
      if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const handleSubTabClick = (e, id) => {
    e.stopPropagation();
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
        if (window.innerWidth > 768) setIsSidebarOpen(false);
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
            
            {item.subItems && isStockOpen && (isSidebarOpen || isMobileMenuOpen) && (
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
