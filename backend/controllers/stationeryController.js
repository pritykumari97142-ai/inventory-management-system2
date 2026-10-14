const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DB_PATH = path.join(__dirname, "../data/db.json");

function createId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

function syncStock(db) {
  db.stationeryItems ??= [];
  db.stockReceipts ??= [];
  db.itemDistributions ??= [];

  for (const item of db.stationeryItems) {
    const totalRec = db.stockReceipts
      .filter((r) => String(r.itemId) === String(item.id))
      .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
    const totalDist = db.itemDistributions
      .filter((d) => String(d.itemId) === String(item.id))
      .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
    item.currentStock = Math.max(0, totalRec - totalDist);
  }
}

function readDatabase() {
  const raw = fs.readFileSync(DB_PATH, "utf8");
  const db = JSON.parse(raw);

  syncStock(db);
  return db;
}

function saveDatabase(db) {
  syncStock(db);
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function getText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

// GET /api/stationery/dashboard
exports.getDashboard = (req, res) => {
  try {
    const db = readDatabase();

    const totalReceived = db.stockReceipts.reduce(
      (sum, receipt) => sum + (Number(receipt.quantity) || 0),
      0,
    );

    const totalDistributed = db.itemDistributions.reduce(
      (sum, record) => sum + (Number(record.quantity) || 0),
      0,
    );

    const totalAvailable = db.stationeryItems.reduce(
      (sum, item) => sum + (Number(item.currentStock) || 0),
      0,
    );

    const lowStockItems = db.stationeryItems.filter(
      (item) => Number(item.currentStock) <= Number(item.minimumStock),
    );

    const recentReceipts = [...db.stockReceipts]
      .sort((a, b) => new Date(b.receivedDate || b.createdAt) - new Date(a.receivedDate || a.createdAt))
      .slice(0, 10);

    const recentDistributions = [...db.itemDistributions]
      .sort((a, b) => new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt))
      .slice(0, 10);

    res.json({
      totalItems: db.stationeryItems.length,
      totalReceived,
      totalDistributed,
      totalAvailable,
      lowStockItems,
      items: db.stationeryItems,
      recentReceipts,
      recentDistributions,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load stationery dashboard." });
  }
};

// GET /api/stationery/items
exports.getItems = (req, res) => {
  try {
    const db = readDatabase();
    res.json(db.stationeryItems);
  } catch (error) {
    res.status(500).json({ message: "Could not load stationery items." });
  }
};

// POST /api/stationery/items
exports.createItem = (req, res) => {
  try {
    const name = getText(req.body.name);
    const category = getText(req.body.category);
    const unit = getText(req.body.unit) || "Piece";
    const minStockInput = req.body.minimumStock ?? 0;
    const minimumStock = getNumber(minStockInput);

    if (!name || !category) {
      return res.status(400).json({
        message: "Item name and category are required.",
      });
    }

    if (minimumStock === null || !Number.isInteger(minimumStock) || minimumStock < 0) {
      return res.status(400).json({
        message: "Minimum stock must be a non-negative whole number.",
      });
    }

    const db = readDatabase();

    const duplicate = db.stationeryItems.some(
      (item) => item.name.toLowerCase().trim() === name.toLowerCase(),
    );

    if (duplicate) {
      return res.status(409).json({
        message: "A stationery item with this name already exists.",
      });
    }

    const item = {
      id: createId("ITEM"),
      name,
      category,
      unit,
      currentStock: 0,
      minimumStock,
      createdAt: new Date().toISOString(),
    };

    db.stationeryItems.push(item);
    saveDatabase(db);

    res.status(201).json({
      message: "Stationery item created successfully.",
      item,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not create stationery item." });
  }
};

// POST /api/stationery/stock-in
exports.receiveStock = (req, res) => {
  try {
    const itemId = getText(req.body.itemId);
    const supplierName = getText(req.body.supplierName);
    const quantity = getNumber(req.body.quantity);
    const receivedDate = getText(req.body.receivedDate);
    const invoiceNumber = getText(req.body.invoiceNumber);
    const remarks = getText(req.body.remarks);

    if (!itemId || !supplierName || !receivedDate) {
      return res.status(400).json({
        message: "Stationery item, supplier name, and received date are required.",
      });
    }

    if (quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number.",
      });
    }

    const db = readDatabase();
    const item = db.stationeryItems.find((entry) => String(entry.id) === String(itemId));

    if (!item) {
      return res.status(404).json({ message: "Stationery item not found." });
    }

    const receipt = {
      id: createId("REC"),
      itemId: item.id,
      itemName: item.name,
      supplierName,
      quantity,
      receivedDate,
      invoiceNumber,
      remarks,
      createdAt: new Date().toISOString(),
    };

    db.stockReceipts.push(receipt);
    saveDatabase(db);

    // Re-fetch updated item with newly computed stock
    const updatedItem = db.stationeryItems.find((entry) => String(entry.id) === String(itemId));

    res.status(201).json({
      message: "Stock received and updated successfully.",
      receipt,
      currentStock: updatedItem.currentStock,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not record received stock." });
  }
};

// POST /api/stationery/distribute
exports.distributeItem = (req, res) => {
  try {
    const itemId = getText(req.body.itemId);
    // Accept both new field names (studentName/admissionNumber) and legacy names
    const recipientName = getText(req.body.studentName || req.body.recipientName);
    const recipientId = getText(req.body.admissionNumber || req.body.recipientId);
    const recipientType = getText(req.body.recipientType) || "Student";
    const department = getText(req.body.department);
    const reason = getText(req.body.reason) || "Distribution";
    const issuedBy = getText(req.body.issuedBy) || "Admin";
    const issueDate = getText(req.body.issueDate);
    const remarks = getText(req.body.remarks);
    const quantity = getNumber(req.body.quantity);

    if (!itemId || !recipientName || !issueDate) {
      return res.status(400).json({
        message: "Item, student name, and date are required.",
      });
    }

    if (quantity === null || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive whole number.",
      });
    }

    const allowedTypes = ["Student", "Staff", "Department", "Other"];
    if (!allowedTypes.includes(recipientType)) {
      return res.status(400).json({
        message: "Recipient type must be Student, Staff, Department, or Other.",
      });
    }

    const db = readDatabase();
    const item = db.stationeryItems.find((entry) => String(entry.id) === String(itemId));

    if (!item) {
      return res.status(404).json({ message: "Stationery item not found." });
    }

    if (item.currentStock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${item.currentStock} ${item.unit} available.`,
      });
    }

    const distribution = {
      id: createId("DIST"),
      itemId: item.id,
      itemName: item.name,
      quantity,
      recipientName,
      recipientId,
      recipientType,
      department,
      reason,
      issuedBy,
      issueDate,
      remarks,
      createdAt: new Date().toISOString(),
    };

    db.itemDistributions.push(distribution);
    saveDatabase(db);

    const updatedItem = db.stationeryItems.find((entry) => String(entry.id) === String(itemId));

    res.status(201).json({
      message: "Item distributed and stock updated successfully.",
      distribution,
      currentStock: updatedItem.currentStock,
    });
  } catch (error) {
    console.error("Distribute item error:", error);
    res.status(500).json({ message: "Could not distribute item.", error: error.message });
  }
};

// GET /api/stationery/receipts
exports.getReceipts = (req, res) => {
  try {
    const db = readDatabase();
    const receipts = [...db.stockReceipts].sort(
      (a, b) => new Date(b.receivedDate || b.createdAt) - new Date(a.receivedDate || a.createdAt),
    );
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: "Could not load stock receipts." });
  }
};

// GET /api/stationery/distributions
exports.getDistributions = (req, res) => {
  try {
    const db = readDatabase();
    const distributions = [...db.itemDistributions].sort(
      (a, b) => new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt),
    );
    res.json(distributions);
  } catch (error) {
    res.status(500).json({ message: "Could not load distribution history." });
  }
};

// DELETE /api/stationery/distributions/:id
exports.deleteDistribution = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.itemDistributions.findIndex((d) => String(d.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ message: "Distribution record not found." });
    }

    const removed = db.itemDistributions.splice(index, 1)[0];
    saveDatabase(db);

    res.json({
      message: `Distribution deleted. ${removed.quantity} unit(s) of "${removed.itemName}" restored to stock.`,
      restored: removed.quantity,
      itemName: removed.itemName,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not delete distribution record." });
  }
};

// DELETE /api/stationery/receipts/:id
exports.deleteReceipt = (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();

    const index = db.stockReceipts.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ message: "Stock receipt not found." });
    }

    const receipt = db.stockReceipts[index];

    // Safety check: ensure deleting this receipt won't make available stock negative
    const totalReceivedForItem = db.stockReceipts
      .filter((r) => String(r.itemId) === String(receipt.itemId))
      .reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    const totalDistributedForItem = db.itemDistributions
      .filter((d) => String(d.itemId) === String(receipt.itemId))
      .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

    const newTotalReceived = totalReceivedForItem - receipt.quantity;

    if (newTotalReceived < totalDistributedForItem) {
      return res.status(400).json({
        message: `Cannot delete this receipt. Deleting it would make the total received (${newTotalReceived}) less than already distributed (${totalDistributedForItem}) for "${receipt.itemName}". Delete some distributions first.`,
      });
    }

    db.stockReceipts.splice(index, 1);
    saveDatabase(db);

    res.json({
      message: `Stock receipt deleted. ${receipt.quantity} unit(s) of "${receipt.itemName}" removed from total received.`,
      itemName: receipt.itemName,
      quantity: receipt.quantity,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not delete stock receipt." });
  }
};
