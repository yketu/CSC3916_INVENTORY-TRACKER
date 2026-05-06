import { useState } from "react";
import api from "../api/axiosConfig";

function ItemForm({ onItemAdded }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    await api.post("/items", {
      name,
      quantity,
      expirationDate
    });

    onItemAdded();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Add Item</h3>

      <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Quantity" onChange={(e) => setQuantity(e.target.value)} />
      <input type="date" onChange={(e) => setExpirationDate(e.target.value)} />

      <button type="submit">Add</button>
    </form>
  );
}

export default ItemForm;
