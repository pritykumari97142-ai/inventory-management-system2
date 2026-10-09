const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

const getData = () => {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

const saveData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const getIssues = (req, res) => {
  const data = getData();

  res.json(data.stockIssues);
};

const addIssue = (req, res) => {
  const { productId, quantity, issuedTo, purpose, issueDate, issuedBy } =
    req.body;

  if (!productId || !quantity || !issuedTo || !purpose) {
    return res.status(400).json({
      message: "Product, quantity, issued to and purpose are required",
    });
  }

  if (Number(quantity) <= 0) {
    return res.status(400).json({
      message: "Issue quantity must be greater than 0",
    });
  }

  const data = getData();

  const product = data.products.find((item) => item.id == productId);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  if (product.status !== "active") {
    return res.status(400).json({
      message: "Cannot issue an inactive product",
    });
  }

  if (product.quantity < Number(quantity)) {
    return res.status(400).json({
      message: "Insufficient stock",
    });
  }

  const issue = {
    id: Date.now(),
    productId,
    quantity: Number(quantity),
    issuedTo,
    purpose,
    issueDate: issueDate || new Date().toISOString(),
    issuedBy: issuedBy || "Staff",
  };

  data.stockIssues.push(issue);

  product.quantity -= Number(quantity);

  data.stockTransactions.push({
    id: Date.now() + 1,
    productId,
    type: "OUT",
    quantity: Number(quantity),
    referenceId: issue.id,
    date: issue.issueDate,
  });

  saveData(data);

  res.status(201).json({
    message: "Stock issued successfully",
    issue,
    currentStock: product.quantity,
  });
};

module.exports = {
  getIssues,
  addIssue,
};
