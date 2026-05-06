import { useEffect, useState } from "react";
import api from "../api/axiosConfig";

function Dashboard() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await api.get("/items");
    setItems(res.data);
  };

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Inventory Dashboard</h2>

      {/* search */}
      <input
        placeholder="Search item..."
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* item list */}
      <ul>
        {filtered.map(item => (
          <li key={item._id}>
            {item.name} - {item.quantity}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;
