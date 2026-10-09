const express = require("express");

const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");

const { adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getProducts);

router.get("/low-stock", getLowStockProducts);

router.post("/", adminOnly, addProduct);

router.put("/:id", adminOnly, updateProduct);

router.delete("/:id", adminOnly, deleteProduct);

module.exports = router;
