const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  expirationDate: { type: Date, required: true },
  dateAdded: { type: Date, default: Date.now },
  lowStockThreshold: { type: Number, default: 5 }
});

// Checking item is low 
ItemSchema.methods.isLowStock = function () {
  return this.quantity <= this.lowStockThreshold;
};

// Check if item is close to expiring
ItemSchema.methods.isCloseToExpiring = function () {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  return this.expirationDate <= threeDaysFromNow;
};

ItemSchema.methods.getStatus = function () {
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  if (this.expirationDate < today) return "expired";
  if (this.expirationDate <= threeDaysFromNow) return "expiring";
  if (this.quantity <= this.lowStockThreshold) return "low stock";

  return "ok";
};

module.exports = mongoose.model("Item", ItemSchema);

