const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
// register admin
router.post("/register", async (req, res) => {
  try {
    const { name, username, password } = req.body;
    // check if there is the same username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // create new user
    const user = new User({ name, username, password });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;



