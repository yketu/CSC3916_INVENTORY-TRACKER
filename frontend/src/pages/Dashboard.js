import { useEffect, useState } from "react";
import api from "../api/axiosConfig";

function Dashboard() {
  const [items, setItems] = useState([]);
  const [fastMoving, setFastMoving] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [selectedFastMovingItem, setSelectedFastMovingItem] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiring, setShowExpiring] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("name");

  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    expirationDate: ""
  });

  const LOW_STOCK_LIMIT = 5;

  // fetch
  const fetchItems = async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFastMoving = async () => {
    try {
      const res = await api.get("/items/analytics/fast-moving");
      setFastMoving(res.data);
    } catch (err) {
      console.error("Error fetching fast moving:", err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchFastMoving();

    const interval = setInterval(() => {
      fetchItems();
      fetchFastMoving();
    }, 30000);

    return () => clearInterval(interval);
  }, []);
  
  //actions
  const addItem = async (e) => {
    e.preventDefault();
    try {
      await api.post("/items", {
        ...newItem,
        dateAdded: new Date().toISOString()
      });

      setNewItem({ name: "", quantity: "", expirationDate: "" });
      setShowAddForm(false);
      fetchItems();
      fetchFastMoving();
      alert("Item added successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add item");
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Delete this item?")) {
      try {
        await api.delete(`/items/${id}`);
        fetchItems();
        fetchFastMoving();
        if (selectedInventoryItem?._id === id) setSelectedInventoryItem(null);
      } catch (err) {
        alert(err.response?.data?.error || "Failed to delete item");
      }
    }
  };
  
  const consumeItem = async (id) => {
    try {
      await api.put(`/items/${id}/consume`, { quantity: 1 });
      fetchItems();
      fetchFastMoving();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to consume item");
    }
  };

  const updateItem = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/items/${editItem._id}`, editItem);
      setEditItem(null);
      fetchItems();
      fetchFastMoving();
      alert("Item updated successfully!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update item");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  //helpers
  const getDaysInStock = (dateAdded) => {
    if (!dateAdded) return 1;
    return Math.max(1, Math.ceil((new Date() - new Date(dateAdded)) / (1000 * 60 * 60 * 24)));
  };
  
  const isExpired = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(date);
    exp.setHours(0, 0, 0, 0);
    return exp < today;
  };
//analytics
  const lowStockItems = items.filter(i => i.quantity <= LOW_STOCK_LIMIT);
  const expiringItems = items.filter(i => {
    const daysLeft = (new Date(i.expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft <= 3 && daysLeft >= 0;
  });
  const expiredItems = items.filter(i => isExpired(i.expirationDate));

  //search and sort
  let filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (sortType === "quantity") {
    filteredItems.sort((a, b) => b.quantity - a.quantity);
  } else if (sortType === "expiration") {
    filteredItems.sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  } else if (sortType === "name") {
    filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortType === "daysInStock") {
    filteredItems.sort((a, b) => getDaysInStock(b.dateAdded) - getDaysInStock(a.dateAdded));
  }

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 50 }}>Loading inventory...</div>;
  }

  // user interface part
  return (
    <div style={{ fontFamily: "Arial", maxWidth: 1200, margin: "auto", padding: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>FreshTrack Inventory</h2>
          <p>Welcome back, Admin</p>
        </div>
        <button onClick={handleLogout} style={{ background: "red", color: "white", padding: 10, border: "none", borderRadius: 5, cursor: "pointer" }}>
          Logout
        </button>
      </div>

      {/* ALERT CARDS */}
      <div style={{ display: "flex", gap: 10, margin: "20px 0", flexWrap: "wrap" }}>
        <div onClick={() => setShowLowStock(!showLowStock)} style={{ background: "#ffe0e0", padding: 15, borderRadius: 8, cursor: "pointer", minWidth: 150 }}>
          Low Stock: {lowStockItems.length}
        </div>
        <div onClick={() => setShowExpiring(!showExpiring)} style={{ background: "#fff3cd", padding: 15, borderRadius: 8, cursor: "pointer", minWidth: 150 }}>
          Expiring Soon: {expiringItems.length}
        </div>
        <div onClick={() => setShowExpired(!showExpired)} style={{ background: "#ffd6d6", padding: 15, borderRadius: 8, cursor: "pointer", minWidth: 150 }}>
          Expired: {expiredItems.length}
        </div>
      </div>

      {/* ALERT DETAILS SECTIONS */}
      {showLowStock && (
        <div style={{ marginBottom: 20, padding: 10, background: "#ffe0e0", borderRadius: 8 }}>
          <h4>Low Stock Items</h4>
          <ul>
            {lowStockItems.map(i => <li key={i._id}>{i.name} — Quantity: {i.quantity}</li>)}
          </ul>
        </div>
      )}

      {showExpiring && (
        <div style={{ marginBottom: 20, padding: 10, background: "#fff3cd", borderRadius: 8 }}>
          <h4>Expiring Soon (within 3 days)</h4>
          <ul>
            {expiringItems.map(i => <li key={i._id}>{i.name} — Expires: {new Date(i.expirationDate).toLocaleDateString()}</li>)}
          </ul>
        </div>
      )}

      {showExpired && (
        <div style={{ marginBottom: 20, padding: 10, background: "#ffd6d6", borderRadius: 8 }}>
          <h4>Expired Items</h4>
          <ul>
            {expiredItems.map(i => <li key={i._id}>{i.name} — Expired on: {new Date(i.expirationDate).toLocaleDateString()}</li>)}
          </ul>
        </div>
      )}

      {/* FAST MOVING */}
      {fastMoving.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Fast Moving Items</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {fastMoving.map(i => (
              <div
                key={i._id}
                style={{ background: "#e8f0ff", padding: 12, borderRadius: 8, cursor: "pointer" }}
                onClick={() => setSelectedFastMovingItem(selectedFastMovingItem?._id === i._id ? null : i)}
              >
                <strong>{i.name}</strong>
                {selectedFastMovingItem?._id === i._id && (
                  <div style={{ marginTop: 5 }}>
                    <small>Usage: {i.usageRate?.toFixed(2)}/day</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEARCH and SORT */}
      <div style={{ marginTop: 30, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: 10, width: 250, borderRadius: 5, border: "1px solid #ddd" }}
        />
        <select value={sortType} onChange={(e) => setSortType(e.target.value)} style={{ padding: 10, borderRadius: 5 }}>
          <option value="name">Sort by Name</option>
          <option value="quantity">Sort by Quantity</option>
          <option value="expiration">Sort by Expiration</option>
          <option value="daysInStock">Sort by Days in Stock</option>
        </select>
      </div>

      {/* ADD ITEM BUTTON */}
      <button onClick={() => setShowAddForm(!showAddForm)} style={{ marginTop: 20, padding: 10, cursor: "pointer" }}>
        {showAddForm ? "Close Form" : "+ Add Item"}
      </button>

      {/* ADD FORM */}
      {showAddForm && (
        <form onSubmit={addItem} style={{ marginTop: 15, display: "flex", gap: 10, flexWrap: "wrap", padding: 15, background: "#f4f4f4", borderRadius: 8 }}>
          <input placeholder="Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} style={{ padding: 8, borderRadius: 4 }} required />
          <input type="number" placeholder="Quantity" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })} style={{ padding: 8, borderRadius: 4 }} required />
          <input type="date" value={newItem.expirationDate} onChange={(e) => setNewItem({ ...newItem, expirationDate: e.target.value })} style={{ padding: 8, borderRadius: 4 }} required />
          <button type="submit" style={{ background: "#28a745", color: "white", border: "none", padding: "8px 15px", borderRadius: 4 }}>Save</button>
        </form>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: 20, borderRadius: 10, width: 350 }}>
            <h3>Edit Item</h3>
            <form onSubmit={updateItem}>
              <input value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} style={{ width: "100%", marginBottom: 10, padding: 8 }} required />
              <input type="number" value={editItem.quantity} onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })} style={{ width: "100%", marginBottom: 10, padding: 8 }} required />
              <input type="date" value={editItem.expirationDate?.split("T")[0]} onChange={(e) => setEditItem({ ...editItem, expirationDate: e.target.value })} style={{ width: "100%", marginBottom: 10, padding: 8 }} required />
              <button type="submit" style={{ background: "#007bff", color: "white", border: "none", padding: "8px 15px", borderRadius: 4 }}>Update</button>
              <button type="button" onClick={() => setEditItem(null)} style={{ marginLeft: 10, padding: "8px 15px", cursor: "pointer" }}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY LIST */}
      <div style={{ marginTop: 30 }}>
        <h3>Inventory Items ({filteredItems.length} total)</h3>
        {filteredItems.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 40, color: "gray" }}>No items found. Click "+ Add Item" to get started.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {filteredItems.map(item => (
              <li key={item._id} style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
                <div
                  onClick={() => setSelectedInventoryItem(selectedInventoryItem?._id === item._id ? null : item)}
                  style={{ fontWeight: "bold", cursor: "pointer" }}
                >
                  {item.name}
                  {isExpired(item.expirationDate) && <span style={{ color: "red", marginLeft: 10 }}>EXPIRED</span>}
                  {item.quantity <= LOW_STOCK_LIMIT && <span style={{ color: "orange", marginLeft: 10 }}>LOW STOCK</span>}
                </div>
                {selectedInventoryItem?._id === item._id && (
                  <div style={{ background: "#f9f9f9", padding: 10, marginTop: 10, borderRadius: 8 }}>
                    <p><strong>Quantity:</strong> {item.quantity}</p>
                    <p><strong>Expiration:</strong> {new Date(item.expirationDate).toLocaleDateString()}</p>
                    <p><strong>Days in Stock:</strong> {getDaysInStock(item.dateAdded)}</p>
                    <button onClick={() => consumeItem(item._id)} style={{ marginRight: 10, padding: "5px 10px", cursor: "pointer" }}>Consume</button>
                    <button onClick={() => setEditItem(item)} style={{ marginRight: 10, padding: "5px 10px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteItem(item._id)} style={{ padding: "5px 10px", cursor: "pointer" }}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SUMMARY STATS */}
      <div style={{ marginTop: 30, padding: 15, background: "#f8f9fa", borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div><strong>Total Items:</strong> {items.length}</div>
        <div><strong>Low Stock:</strong> {lowStockItems.length}</div>
        <div><strong>Expiring Soon:</strong> {expiringItems.length}</div>
        <div><strong>Expired:</strong> {expiredItems.length}</div>
        <div><strong>Fast Moving:</strong> {fastMoving.length}</div>
      </div>
    </div>
  );
}

export default Dashboard;
