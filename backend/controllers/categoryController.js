const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

const getData = () => {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

const saveData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Get all categories
const getCategories = (req, res) => {
  const data = getData();

  res.json(data.categories);
};

// Add category
const addCategory = (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Category name is required",
    });
  }

  const data = getData();

  const category = {
    id: Date.now(),
    name,
  };

  data.categories.push(category);

  saveData(data);

  res.status(201).json({
    message: "Category added successfully",
    category,
  });
};

// Update category
const updateCategory = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const data = getData();

  const category = data.categories.find((item) => item.id == id);

  if (!category) {
    return res.status(404).json({
      message: "Category not found",
    });
  }

  category.name = name;

  saveData(data);

  res.json({
    message: "Category updated successfully",
    category,
  });
};

// Delete category
const deleteCategory = (req, res) => {
  const { id } = req.params;

  const data = getData();

  const categoryExists = data.categories.find((item) => item.id == id);

  if (!categoryExists) {
    return res.status(404).json({
      message: "Category not found",
    });
  }

  data.categories = data.categories.filter((item) => item.id != id);

  saveData(data);

  res.json({
    message: "Category deleted successfully",
  });
};

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
