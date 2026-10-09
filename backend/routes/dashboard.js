const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dbPath = path.join(__dirname, "../data/db.json");

router.get("/", (req, res) => {
  const data = JSON.parse(
    fs.readFileSync(dbPath, "utf-8")
  );

  const totalStock = data.products.reduce(
    (total, product) => total + Number(product.quantity),
    0
  );

  const lowStock = data.products.filter(
    (product) => product.quantity <= product.minStock
  );

  const outOfStock = data.products.filter(
    (product) => product.quantity === 0
  );

  res.json({
    totalProducts: data.products.length,
    totalCategories: data.categories.length,
    totalSuppliers: data.suppliers.length,
    totalStock,
    lowStock: lowStock.length,
    outOfStock: outOfStock.length,
    recentTransactions: data.stockTransactions.slice(-5)
  });
});

module.exports = router;