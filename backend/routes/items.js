const express = require("express");
const router = express.Router();
const Item = require("../models/item");
const { isAuthenticated } = require("../middleware/auth_jwt");


// ---------------- CREATE ITEM ----------------
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { name, quantity, expirationDate } = req.body;

    const expDate = new Date(expirationDate);
    const today = new Date();

    // BLOCK EXPIRED ITEMS
    if (expDate < today) {
      return res.status(400).json({
        error: "Cannot add expired item"
      });
    }

    let item = await Item.findOne({
      name,
      expirationDate: expDate
    });

    if (item) {
      item.quantity += quantity;
      await item.save();

      return res.json({
        message: "Existing batch updated",
        item
      });
    }

    const newItem = new Item({
      name,
      quantity,
      expirationDate: expDate
    });

    await newItem.save();

    res.status(201).json({
      message: "New item created",
      item: newItem
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- GET ALL ----------------
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();

    const result = items.map(i => ({
      ...i.toObject(),
      status: i.getStatus(),
      usageRate: i.getUsageRate()
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- UPDATE ITEM (ADD THIS) ----------------
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, quantity, expirationDate } = req.body;

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { name, quantity, expirationDate },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CONSUME ITEM ----------------
router.put("/:id/consume", isAuthenticated, async (req, res) => {
  try {
    const { quantity } = req.body;

    const item = await Item.findById(req.params.id);

    if (!item) return res.status(404).json({ message: "Not found" });

    item.quantity -= Number(quantity);

    if (!item.consumptionHistory) item.consumptionHistory = [];
    item.consumptionHistory.push({
      quantity: Number(quantity),
      date: new Date()
    });

    await item.save();

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DELETE ----------------
router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ALERTS: LOW STOCK ----------------
router.get("/alerts/low-stock", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();
    const lowStock = items.filter(i => i.isLowStock());
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- ALERTS: EXPIRING ----------------
router.get("/alerts/expiring", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();
    const expiring = items.filter(i => i.isCloseToExpiring());
    res.json(expiring);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- FAST MOVING ----------------
router.get("/analytics/fast-moving", isAuthenticated, async (req, res) => {
  try {
    const items = await Item.find();

    const ranked = items
      .map(i => ({
        ...i.toObject(),
        usageRate: i.getUsageRate()
      }))
      .sort((a, b) => b.usageRate - a.usageRate)
      .slice(0, 5);

    res.json(ranked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
