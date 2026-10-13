const express = require("express");
const router = express.Router();

const stationeryController = require("../controllers/stationeryController");

router.get("/dashboard", stationeryController.getDashboard);
router.get("/items", stationeryController.getItems);
router.post("/items", stationeryController.createItem);

router.post("/stock-in", stationeryController.receiveStock);

router.get("/receipts", stationeryController.getReceipts);
router.get("/distributions", stationeryController.getDistributions);
router.post("/distribute", stationeryController.distributeItem);

module.exports = router;
