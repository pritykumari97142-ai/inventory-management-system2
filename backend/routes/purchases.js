const express = require("express");

const {
  getPurchases,
  addPurchase,
} = require("../controllers/purchaseController");

const { adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", adminOnly, getPurchases);

router.post("/", adminOnly, addPurchase);

module.exports = router;
