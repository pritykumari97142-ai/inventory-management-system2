const express = require("express");

const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getCategories);

router.post("/", adminOnly, addCategory);

router.put("/:id", adminOnly, updateCategory);

router.delete("/:id", adminOnly, deleteCategory);

module.exports = router;
