const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dbPath = path.join(__dirname, "../data/db.json");

router.get("/", (req, res) => {
  const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

  res.json(data.stockTransactions);
});

module.exports = router;
