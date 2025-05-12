const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const [customers] = await db.query("SELECT * FROM customers");
    res.json(customers);
  } catch (error) {
    console.error("Error retrieving customers:", error.message);
    res.status(500).json({ error: "Failed to retrieve customers" });
  }
});

router.post("/add-customer", async (req, res) => {
  const { full_name, sector, package } = req.body;

  if (!full_name || !package) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO customers (full_name, sector, package)
       VALUES (?, ?, ?)`,
      [full_name, sector || null, package]
    );

    res.status(201).json({
      message: "Customer added successfully",
      customer_id: result.insertId,
      full_name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error", error: err.message });
  }
});

module.exports = router;
