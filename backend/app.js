const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const supplierRoutes = require("./routes/suppliers");
const purchaseRoutes = require("./routes/purchases");
const issueRoutes = require("./routes/issues");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");

const { auth } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Inventory Management API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/categories", auth, categoryRoutes);
app.use("/api/products", auth, productRoutes);
app.use("/api/suppliers", auth, supplierRoutes);
app.use("/api/purchases", auth, purchaseRoutes);
app.use("/api/issues", auth, issueRoutes);
app.use("/api/transactions", auth, transactionRoutes);
app.use("/api/dashboard", auth, dashboardRoutes);

module.exports = app;
