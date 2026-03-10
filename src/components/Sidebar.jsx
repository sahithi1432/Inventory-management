import React from "react";

function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "inventory", label: "Stock", icon: "📦" },
    { id: "orders", label: "Orders", icon: "🛒" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img
          src="/logo.png"
          alt="Juice N Power"
          style={{ width: "50%", maxWidth: 100, display: "block", margin: "0 auto" }}
        />
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-label"></div>
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        © Juice N Power
        <br />
        @Gopi krishna.Kotagiri
      </div>
    </aside>
  );
}

export default Sidebar;
