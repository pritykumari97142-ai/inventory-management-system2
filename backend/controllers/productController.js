const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

const getData = () => {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

const saveData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const getProducts = (req, res) => {
  const data = getData();

  res.json(data.products);
};

const addProduct = (req, res) => {
  const { name, code, categoryId, price, quantity, minStock, description } =
    req.body;

  if (!name || !code || !categoryId) {
    return res.status(400).json({
      message: "Name, code and category are required",
    });
  }

  if (Number(price) < 0) {
    return res.status(400).json({
      message: "Price cannot be negative",
    });
  }

  if (Number(quantity) < 0) {
    return res.status(400).json({
      message: "Quantity cannot be negative",
    });
  }

  if (Number(minStock) < 0) {
    return res.status(400).json({
      message: "Minimum stock cannot be negative",
    });
  }

  const data = getData();

  const duplicateCode = data.products.find(
    (product) => product.code.toLowerCase() === code.toLowerCase(),
  );

  if (duplicateCode) {
    return res.status(400).json({
      message: "Product code already exists",
    });
  }

  const category = data.categories.find((item) => item.id == categoryId);

  if (!category) {
    return res.status(400).json({
      message: "Invalid category",
    });
  }

  const product = {
    id: Date.now(),
    name,
    code,
    categoryId,
    price: Number(price) || 0,
    quantity: Number(quantity) || 0,
    minStock: Number(minStock) || 5,
    description: description || "",
    status: "active",
  };

  data.products.push(product);

  saveData(data);

  res.status(201).json({
    message: "Product added successfully",
    product,
  });
};

const updateProduct = (req, res) => {
  const { id } = req.params;

  const data = getData();

  const product = data.products.find((item) => item.id == id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  if (req.body.price !== undefined && Number(req.body.price) < 0) {
    return res.status(400).json({
      message: "Price cannot be negative",
    });
  }

  if (req.body.quantity !== undefined && Number(req.body.quantity) < 0) {
    return res.status(400).json({
      message: "Quantity cannot be negative",
    });
  }

  if (req.body.minStock !== undefined && Number(req.body.minStock) < 0) {
    return res.status(400).json({
      message: "Minimum stock cannot be negative",
    });
  }

  if (
    req.body.code &&
    req.body.code.toLowerCase() !== product.code.toLowerCase()
  ) {
    const duplicateCode = data.products.find(
      (item) =>
        item.id != id &&
        item.code.toLowerCase() === req.body.code.toLowerCase(),
    );

    if (duplicateCode) {
      return res.status(400).json({
        message: "Product code already exists",
      });
    }
  }

  Object.assign(product, req.body);

  saveData(data);

  res.json({
    message: "Product updated successfully",
    product,
  });
};

const deleteProduct = (req, res) => {
  const { id } = req.params;

  const data = getData();

  const product = data.products.find((item) => item.id == id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  product.status = "inactive";

  saveData(data);

  res.json({
    message: "Product deactivated successfully",
  });
};

const getLowStockProducts = (req, res) => {
  const data = getData();

  const products = data.products.filter(
    (product) => product.quantity <= product.minStock,
  );

  res.json(products);
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
