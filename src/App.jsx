import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import InventoryTable from "./components/InventoryTable";
import OrdersTable from "./components/OrdersTable";
import OrderSheet from "./components/OrderSheet";
import CategoriesPage from "./components/CategoriesPage";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("home");

  // ==============================
  // LOAD DATA ON MOUNT
  // ==============================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, ordRes, catRes] = await Promise.all([
        fetch(`${API}/inventory`),
        fetch(`${API}/orders`),
        fetch(`${API}/categories`),
      ]);
      const invData = await invRes.json();
      const ordData = await ordRes.json();
      const catData = await catRes.json();

      setCategories(catData || []);
      setInventory(
      invData.map((r) => ({
        id: r.id,
        itemName: r.item_name,
        availableQuantity: r.available_quantity,
        category: r.category,
      }))
      );
      setOrders(
        ordData.map((r) => ({
          id: r.id,
          orderDate: r.order_date ? r.order_date.substring(0, 10) : "",
          customerName: r.customer_name,
          productName: r.product_name,
          orderedQuantity: r.ordered_quantity,
          shortageQuantity: r.shortage_quantity,
          sentQuantity: r.sent_quantity,
          status: r.status,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  // Helper: apply API response (both inventory + orders come back)
  const applyResponse = (data) => {
    setInventory(
      data.inventory.map((r) => ({
        id: r.id,
        itemName: r.item_name,
        availableQuantity: r.available_quantity,
        category: r.category,
      }))
    );
    setOrders(
      data.orders.map((r) => ({
        id: r.id,
        orderDate: r.order_date ? r.order_date.substring(0, 10) : "",
        customerName: r.customer_name,
        productName: r.product_name,
        orderedQuantity: r.ordered_quantity,
        shortageQuantity: r.shortage_quantity,
        sentQuantity: r.sent_quantity,
        status: r.status,
      }))
    );
  };

  // ==============================
  // ADD CATEGORY
  // ==============================
  const addCategory = async (name) => {
    try {
      const res = await fetch(`${API}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) setCategories(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  // ==============================
  // EDIT CATEGORY
  // ==============================
  const editCategory = async (id, name) => {
    try {
      const res = await fetch(`${API}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
        // Re-fetch inventory since category names may have changed
        const invRes = await fetch(`${API}/inventory`);
        const invData = await invRes.json();
        setInventory(
          invData.map((r) => ({
            id: r.id,
            itemName: r.item_name,
            availableQuantity: r.available_quantity,
            category: r.category,
          }))
        );
      }
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to edit category:", err);
    }
  };

  // ==============================
  // DELETE CATEGORY
  // ==============================
  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API}/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
        // Re-fetch inventory since items may have moved to General
        const invRes = await fetch(`${API}/inventory`);
        const invData = await invRes.json();
        setInventory(
          invData.map((r) => ({
            id: r.id,
            itemName: r.item_name,
            availableQuantity: r.available_quantity,
            category: r.category,
          }))
        );
      }
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  // ==============================
  // ADD INVENTORY / ADD STOCK
  // ==============================
  const addInventory = async (itemName, quantity, category) => {
    try {
      const res = await fetch(`${API}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, quantity, category }),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to add inventory:", err);
    }
  };

  // ==============================
  // PLACE ORDER
  // ==============================
  const placeOrder = async ({ orderDate, customerName, productName, orderedQuantity }) => {
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderDate, customerName, productName, orderedQuantity }),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to place order:", err);
    }
  };

  // ==============================
  // REJECT ORDER
  // ==============================
  const rejectOrder = async (orderId) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/reject`, { method: "PUT" });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to reject order:", err);
    }
  };

  // ==============================
  // MARK SENT (partial)
  // ==============================
  const markSent = async (orderId, sendQuantity) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/send`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendQuantity }),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to mark sent:", err);
    }
  };

  // ==============================
  // EDIT INVENTORY
  // ==============================
  const editInventory = async (id, itemName, quantity, category) => {
    try {
      const res = await fetch(`${API}/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, quantity, category }),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to edit inventory:", err);
    }
  };

  // ==============================
  // DELETE INVENTORY
  // ==============================
  const deleteInventory = async (id) => {
    try {
      const res = await fetch(`${API}/inventory/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to delete inventory:", err);
    }
  };

  // ==============================
  // EDIT ORDER
  // ==============================
  const editOrder = async (id, updatedOrder) => {
    try {
      const res = await fetch(`${API}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedOrder),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to edit order:", err);
    }
  };

  // ==============================
  // DELETE ORDER
  // ==============================
  const deleteOrder = async (id) => {
    try {
      const res = await fetch(`${API}/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else console.error(data.error);
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  return (
    <div className={`app-layout ${!isSidebarOpen ? "sidebar-collapsed" : ""} ${isMobileMenuOpen ? "mobile-menu-open" : ""}`}>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className="mobile-logo-text">Juice N Power</div>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        categories={categories} 
        isStockOpen={isStockOpen}
        setIsStockOpen={setIsStockOpen}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        clearStatusFilter={() => setStatusFilter("")}
      />

      <main className="main-content">
        {/* Global Search Bar */}
        <div className="search-header">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder={`Search in ${activeTab === 'home' ? 'Dashboard' : activeTab === 'orders' ? 'Orders' : 'Stock'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>

        {activeTab === "home" && (
          <HomePage 
            inventory={inventory} 
            orders={orders} 
            searchQuery={searchQuery} 
            setActiveTab={setActiveTab}
            setSearchQuery={setSearchQuery}
            setStatusFilter={setStatusFilter}
          />
        )}

        {activeTab.startsWith("inventory-") && (
          <InventoryTable
            key={activeTab}
            category={activeTab.replace("inventory-", "").charAt(0).toUpperCase() + activeTab.replace("inventory-", "").slice(1)}
            inventory={inventory}
            addInventory={addInventory}
            editInventory={editInventory}
            deleteInventory={deleteInventory}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === "inventory" && (
          <CategoriesPage
            categories={categories}
            addCategory={addCategory}
            editCategory={editCategory}
            deleteCategory={deleteCategory}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
          />
        )}

        {activeTab === "orders" && (
          <div>
            <div className="page-header">
              <h2>Order Management</h2>
              <p>Place new orders and manage existing ones.</p>
            </div>

            <OrderSheet
              inventory={inventory}
              categories={categories}
              placeOrder={placeOrder}
            />
            <OrdersTable
              orders={orders}
              inventory={inventory}
              markSent={markSent}
              rejectOrder={rejectOrder}
              updateOrder={editOrder}
              deleteOrder={deleteOrder}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              clearStatusFilter={() => setStatusFilter("")}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;