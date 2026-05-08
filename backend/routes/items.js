const express = require("express");
const router = express.Router();
const Item = require("../models/item");
const { isAuthenticated } = require("../middleware/auth_jwt");
//add new item
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { name, quantity, expirationDate } = req.body;

    // 1. Look for EXACT batch match (name + expiration)
    let item = await Item.findOne({
      name: name,
      expirationDate: new Date(expirationDate)
    });

    if (item) {
      // SAME BATCH → update quantity
      item.quantity += quantity;
      await item.save();

      return res.status(200).json({
        message: "Existing batch updated (quantity increased)",
        item
      });
    }

    // 2. No exact match → create NEW batch
    const newItem = new Item({
      name,
      quantity,
      expirationDate
    });

    await newItem.save();

    return res.status(201).json({
      message: "New batch created",
      item: newItem
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// get all items
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();

    const result = items.map(item => ({
      ...item.toObject(),
      status: item.getStatus()
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// get one item
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({
      ...item.toObject(),
      status: item.getStatus()
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// update
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// low alert-
router.get("/alerts/low-stock", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();
    const lowStock = items.filter(item => item.isLowStock());
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// expiring alert
router.get("/alerts/expiring", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();
    const expiring = items.filter(item => item.isCloseToExpiring());
    res.json(expiring);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// sort by time 
router.get("/analytics/fast-moving", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find().sort({ dateAdded: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
