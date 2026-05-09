const mongoose = require("mongoose");

const ConsumptionSchema = new mongoose.Schema({
  quantity: Number,
  date: { type: Date, default: Date.now }
});

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expirationDate: { type: Date, required: true },
  dateAdded: { type: Date, default: Date.now },
  lowStockThreshold: { type: Number, default: 5 },

  //  NEW: track real usage
  consumptionHistory: [ConsumptionSchema]
});

// ---------------- STATUS HELPERS ----------------

ItemSchema.methods.isLowStock = function () {
  return this.quantity <= this.lowStockThreshold;
};

ItemSchema.methods.isCloseToExpiring = function () {
  const today = new Date();
  const limit = new Date();
  limit.setDate(today.getDate() + 3);

  return this.expirationDate <= limit;
};

ItemSchema.methods.getStatus = function () {
  const today = new Date();
  const limit = new Date();
  limit.setDate(today.getDate() + 3);

  if (this.expirationDate < today) return "expired";
  if (this.expirationDate <= limit) return "expiring";
  if (this.quantity <= this.lowStockThreshold) return "low stock";

  return "ok";
};

// NEW: real consumption rate
ItemSchema.methods.getUsageRate = function () {
  const totalConsumed =
    this.consumptionHistory?.reduce((sum, c) => sum + c.quantity, 0) || 0;

  const days =
    Math.max(1, (Date.now() - new Date(this.dateAdded)) / (1000 * 60 * 60 * 24));

  return totalConsumed / days;
};

module.exports = mongoose.model("Item", ItemSchema);