const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

connectDB();

// Movie schema (FIXED)
const MovieSchema = new Schema({
  title: { type: String, required: true, index: true },
  releaseDate: { type: Number, min: 1900, max: 2100 },
  genre: {
    type: String,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama',
      'Fantasy', 'Horror', 'Mystery', 'Thriller',
      'Western', 'Science Fiction'
    ]
  },
  actors: [{
    actorName: String,
    characterName: String
  }],
  imageUrl: { type: String }
});

module.exports = mongoose.model('Movie', MovieSchema);



//---------------------------

const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    expirationDate: { type: Date, required: true },
    dateAdded: { type: Date, default: Date.now },
    lowStockThreshold: { type: Number, default: 5 }
});

// Check if item is low stock
ItemSchema.methods.isLowStock = function() {
    return this.quantity <= this.lowStockThreshold;
};

// Check if item is expired or close to expiring (within 3 days)
ItemSchema.methods.isCloseToExpiring = function() {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    return this.expirationDate <= threeDaysFromNow;
};

module.exports = mongoose.model('Item', ItemSchema);