const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../data/db.json");

const getData = () => {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
};

const saveData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

const getSuppliers = (req, res) => {
  const data = getData();

  res.json(data.suppliers);
};

const addSupplier = (req, res) => {
  const { name, contactPerson, phone, email, address } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Supplier name is required",
    });
  }

  const data = getData();

  const duplicate = data.suppliers.find(
    (supplier) => supplier.name.toLowerCase() === name.toLowerCase(),
  );

  if (duplicate) {
    return res.status(400).json({
      message: "Supplier already exists",
    });
  }

  const supplier = {
    id: Date.now(),
    name,
    contactPerson: contactPerson || "",
    phone: phone || "",
    email: email || "",
    address: address || "",
    status: "active",
  };

  data.suppliers.push(supplier);

  saveData(data);

  res.status(201).json({
    message: "Supplier added successfully",
    supplier,
  });
};

const updateSupplier = (req, res) => {
  const { id } = req.params;

  const data = getData();

  const supplier = data.suppliers.find((item) => item.id == id);

  if (!supplier) {
    return res.status(404).json({
      message: "Supplier not found",
    });
  }

  Object.assign(supplier, req.body);

  saveData(data);

  res.json({
    message: "Supplier updated successfully",
    supplier,
  });
};

const deleteSupplier = (req, res) => {
  const { id } = req.params;

  const data = getData();

  const supplier = data.suppliers.find((item) => item.id == id);

  if (!supplier) {
    return res.status(404).json({
      message: "Supplier not found",
    });
  }

  supplier.status = "inactive";

  saveData(data);

  res.json({
    message: "Supplier deactivated successfully",
  });
};

module.exports = {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
};
