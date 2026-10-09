const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

const getData = () => {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

const saveData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const getPurchases = (req, res) => {
  const data = getData();

  res.json(data.purchases);
};

const addPurchase = (req, res) => {
  const { supplierId, productId, quantity, price, purchaseDate } = req.body;

  if (!supplierId || !productId || !quantity || price === undefined) {
    return res.status(400).json({
      message: "Supplier, product, quantity and price are required",
    });
  }

  if (Number(quantity) <= 0) {
    return res.status(400).json({
      message: "Quantity must be greater than 0",
    });
  }

  if (Number(price) < 0) {
    return res.status(400).json({
      message: "Price cannot be negative",
    });
  }

  const data = getData();

  const product = data.products.find((item) => item.id == productId);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const supplier = data.suppliers.find((item) => item.id == supplierId);

  if (!supplier) {
    return res.status(404).json({
      message: "Supplier not found",
    });
  }

  const totalAmount = Number(quantity) * Number(price);

  const purchase = {
    id: Date.now(),
    supplierId,
    productId,
    quantity: Number(quantity),
    price: Number(price),
    totalAmount,
    purchaseDate: purchaseDate || new Date().toISOString(),
  };

  data.purchases.push(purchase);

  product.quantity += Number(quantity);

  data.stockTransactions.push({
    id: Date.now() + 1,
    productId,
    type: "IN",
    quantity: Number(quantity),
    referenceId: purchase.id,
    date: purchase.purchaseDate,
  });

  saveData(data);

  res.status(201).json({
    message: "Purchase added and stock increased",
    purchase,
    currentStock: product.quantity,
  });
};

module.exports = {
  getPurchases,
  addPurchase,
};
