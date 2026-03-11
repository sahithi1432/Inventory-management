import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import InventoryTable from "./components/InventoryTable";
import OrdersTable from "./components/OrdersTable";
import OrderSheet from "./components/OrderSheet";
import CategoriesPage from "./components/CategoriesPage";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function AppContent({ 
  inventory, orders, categories, 
  fetchData, applyResponse, 
  addCategory, editCategory, deleteCategory, bulkDeleteCategories,
  addInventory, editInventory, deleteInventory, bulkDeleteInventory,
  placeOrder, rejectOrder, markSent, editOrder, deleteOrder, bulkDeleteOrders,
  isSidebarOpen, setIsSidebarOpen,
  isStockOpen, setIsStockOpen,
  isMobileMenuOpen, setIsMobileMenuOpen,
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter
}) {
  const location = useLocation();
  const path = location.pathname;

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
              placeholder={`Search...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          <Route path="/home" element={
            <HomePage 
              inventory={inventory} 
              orders={orders} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              setStatusFilter={setStatusFilter}
            />
          } />

          <Route path="/categories" element={
            <CategoriesPage
              categories={categories}
              addCategory={addCategory}
              editCategory={editCategory}
              deleteCategory={deleteCategory}
              bulkDeleteCategories={bulkDeleteCategories}
              searchQuery={searchQuery}
            />
          } />

          <Route path="/inventory/:catSafeName" element={<InventoryRouteWrapper 
            categories={categories}
            inventory={inventory}
            addInventory={addInventory}
            editInventory={editInventory}
            deleteInventory={deleteInventory}
            bulkDeleteInventory={bulkDeleteInventory}
            searchQuery={searchQuery}
          />} />

          <Route path="/orders" element={
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
                bulkDeleteOrders={bulkDeleteOrders}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                clearStatusFilter={() => setStatusFilter("")}
              />
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

import { useParams } from "react-router-dom";
function InventoryRouteWrapper({ categories, inventory, addInventory, editInventory, deleteInventory, bulkDeleteInventory, searchQuery }) {
  const { catSafeName } = useParams();
  const actualCategory = categories.find(c => c.name.toLowerCase() === catSafeName.toLowerCase());
  
  return (
    <InventoryTable
      key={catSafeName}
      category={actualCategory ? actualCategory.name : catSafeName}
      inventory={inventory}
      addInventory={addInventory}
      editInventory={editInventory}
      deleteInventory={deleteInventory}
      bulkDeleteInventory={bulkDeleteInventory}
      searchQuery={searchQuery}
    />
  );
}

function App() {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isStockOpen, setIsStockOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`${API}/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
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

  const bulkDeleteCategories = async (ids) => {
    try {
      const res = await fetch(`${API}/categories/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) setCategories(data);
      else alert(data.error || "Bulk delete failed");
    } catch (err) {
      console.error(err);
    }
  };

  const bulkDeleteInventory = async (ids) => {
    try {
      const res = await fetch(`${API}/inventory/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else alert(data.error || "Bulk delete failed");
    } catch (err) {
      console.error(err);
    }
  };

  const bulkDeleteOrders = async (ids) => {
    try {
      const res = await fetch(`${API}/orders/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (res.ok) applyResponse(data);
      else alert(data.error || "Bulk delete failed");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <BrowserRouter>
      <AppContent 
        inventory={inventory} orders={orders} categories={categories}
        fetchData={fetchData} applyResponse={applyResponse}
        addCategory={addCategory} editCategory={editCategory} deleteCategory={deleteCategory} bulkDeleteCategories={bulkDeleteCategories}
        addInventory={addInventory} editInventory={editInventory} deleteInventory={deleteInventory} bulkDeleteInventory={bulkDeleteInventory}
        placeOrder={placeOrder} rejectOrder={rejectOrder} markSent={markSent} editOrder={editOrder} deleteOrder={deleteOrder} bulkDeleteOrders={bulkDeleteOrders}
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        isStockOpen={isStockOpen} setIsStockOpen={setIsStockOpen}
        isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
      />
    </BrowserRouter>
  );
}

export default App;