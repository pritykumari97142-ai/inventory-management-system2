const express = require("express");

const {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

const { adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getSuppliers);

router.post("/", adminOnly, addSupplier);

router.put("/:id", adminOnly, updateSupplier);

router.delete("/:id", adminOnly, deleteSupplier);

module.exports = router;
