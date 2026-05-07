const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors());
app.use(passport.initialize());
require("./middleware/auth_jwt");
// routes
const itemRoutes = require("./routes/items");
const authRoutes = require("./routes/auth");

app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
//data base connection 
mongoose.connect(process.env.DB)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("DB connection error:", err));
// test routes
app.get("/", (req, res) => {
  res.send("Inventory API is running...");
});
// start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

