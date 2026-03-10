import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import InventoryTable from "./components/InventoryTable";
import OrdersTable from "./components/OrdersTable";
import OrderSheet from "./components/OrderSheet";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function App() {
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("home");

  // ==============================
  // LOAD DATA ON MOUNT
  // ==============================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, ordRes] = await Promise.all([
        fetch(`${API}/inventory`),
        fetch(`${API}/orders`),
      ]);
      const invData = await invRes.json();
      const ordData = await ordRes.json();
      setInventory(
        invData.map((r) => ({
          id: r.id,
          itemName: r.item_name,
          availableQuantity: r.available_quantity,
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
        status: r.status,
      }))
    );
  };

  // ==============================
  // ADD INVENTORY / ADD STOCK
  // ==============================
  const addInventory = async (itemName, quantity) => {
    try {
      const res = await fetch(`${API}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, quantity }),
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
  // MARK SENT
  // ==============================
  const markSent = async (orderId) => {
    try {
      const res = await fetch(`${API}/orders/${orderId}/send`, { method: "PUT" });
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
  const editInventory = async (id, itemName, quantity) => {
    try {
      const res = await fetch(`${API}/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, quantity }),
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
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === "home" && (
          <HomePage inventory={inventory} orders={orders} />
        )}

        {activeTab === "inventory" && (
          <InventoryTable
            inventory={inventory}
            addInventory={addInventory}
            editInventory={editInventory}
            deleteInventory={deleteInventory}
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
              placeOrder={placeOrder}
            />
            <OrdersTable
              orders={orders}
              rejectOrder={rejectOrder}
              markSent={markSent}
              editOrder={editOrder}
              deleteOrder={deleteOrder}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;