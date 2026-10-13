import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function StockReceived() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    itemId: "",
    supplierName: "",
    quantity: "",
    receivedDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    remarks: "",
  });

  const loadData = async () => {
    try {
      const [itemsRes, receiptsRes] = await Promise.allSettled([
        api.get("/stationery/items"),
        api.get("/stationery/receipts"),
      ]);

      if (itemsRes.status === "fulfilled") {
        setItems(itemsRes.value.data || []);
      }
      if (receiptsRes.status === "fulfilled") {
        setReceipts(receiptsRes.value.data || []);
      }

      // Reusing existing suppliers safely without breaking suppliers module
      try {
        const suppliersRes = await api.get("/suppliers");
        setSuppliers(suppliersRes.data || []);
      } catch {
        setSuppliers([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stationery inventory.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectedItem = items.find((i) => String(i.id) === String(form.itemId));
  const enteredQty = Number(form.quantity) || 0;
  const projectedStock = selectedItem ? selectedItem.currentStock + enteredQty : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.itemId) {
      setError("Please select a stationery item to receive.");
      return;
    }

    const trimmedSupplier = form.supplierName.trim();
    if (!trimmedSupplier) {
      setError("Please enter or select a supplier name.");
      return;
    }

    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity received must be a positive whole number (at least 1).");
      return;
    }

    if (!form.receivedDate) {
      setError("Please specify the date of receipt.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/stationery/stock-in", {
        itemId: form.itemId,
        supplierName: trimmedSupplier,
        quantity: qty,
        receivedDate: form.receivedDate,
        invoiceNumber: form.invoiceNumber.trim(),
        remarks: form.remarks.trim(),
      });

      const updatedStock = response.data.currentStock;
      const itemName = selectedItem ? selectedItem.name : "Item";
      const unit = selectedItem ? selectedItem.unit : "units";

      setMessage(
        `✓ Stock received successfully! Received ${qty} ${unit} of "${itemName}" from "${trimmedSupplier}". Updated available stock: ${updatedStock} ${unit}.`
      );

      setForm({
        itemId: "",
        supplierName: "",
        quantity: "",
        receivedDate: new Date().toISOString().slice(0, 10),
        invoiceNumber: "",
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record received stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Inward Stock
          </span>
          <h2>Stock Received</h2>
          <p>Record stationery consignments received from suppliers and replenish inventory</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/stationery" className="secondary-btn">
            ← Stationery Dashboard
          </Link>
          <Link to="/stationery/add" className="secondary-btn">
            + New Stationery Item
          </Link>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">⚠ {error}</div>}

      {items.length === 0 && !fetching && (
        <div className="error-message" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>No stationery items found in inventory catalogue. Register an item first before receiving stock.</span>
          <Link to="/stationery/add" className="primary-btn" style={{ minHeight: "32px", padding: "4px 12px", fontSize: "11px" }}>
            Add Stationery Item →
          </Link>
        </div>
      )}

      {/* Stock In Form */}
      <div className="form-card">
        <h3>Receive Consignment from Supplier</h3>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="receive-item">Stationery Item *</label>
            <select
              id="receive-item"
              name="itemId"
              value={form.itemId}
              onChange={handleChange}
              required
            >
              <option value="">-- Choose stationery item --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) — Available: {item.currentStock} {item.unit}
                </option>
              ))}
            </select>
            {selectedItem && (
              <small className="stock-badge-info">
                Current Stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong> | Min Alert Level: {selectedItem.minimumStock} {selectedItem.unit}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="receive-supplier">Supplier Name *</label>
            <input
              id="receive-supplier"
              type="text"
              name="supplierName"
              list="existing-suppliers"
              value={form.supplierName}
              onChange={handleChange}
              placeholder="e.g. ABC Stationery Store, National Traders"
              required
            />
            <datalist id="existing-suppliers">
              {suppliers.map((s) => (
                <option key={s.id || s.name} value={s.name} />
              ))}
            </datalist>
            <small style={{ color: "#8c9cb8", fontSize: "11px" }}>
              Select an existing supplier or type a new supplier name
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="receive-qty">Quantity Received *</label>
            <input
              id="receive-qty"
              type="number"
              name="quantity"
              min="1"
              step="1"
              value={form.quantity}
              onChange={handleChange}
              placeholder="e.g. 50"
              required
            />
            {selectedItem && enteredQty > 0 && (
              <small style={{ color: "#059669", fontWeight: 600, fontSize: "11px" }}>
                ✓ New stock after receipt will be: {projectedStock} {selectedItem.unit}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="receive-date">Received Date *</label>
            <input
              id="receive-date"
              type="date"
              name="receivedDate"
              value={form.receivedDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="receive-invoice">Invoice / Delivery Challan Number</label>
            <input
              id="receive-invoice"
              type="text"
              name="invoiceNumber"
              value={form.invoiceNumber}
              onChange={handleChange}
              placeholder="e.g. INV-2026-908"
            />
          </div>

          <div className="form-group">
            <label htmlFor="receive-remarks">Remarks / Delivery Notes</label>
            <input
              id="receive-remarks"
              type="text"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="e.g. Batch #4, boxed packaging in good condition"
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading || items.length === 0}
            >
              {loading ? "Recording..." : "Record Received Stock"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                setForm({
                  itemId: "",
                  supplierName: "",
                  quantity: "",
                  receivedDate: new Date().toISOString().slice(0, 10),
                  invoiceNumber: "",
                  remarks: "",
                })
              }
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Recent Receipts Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Recent Stock Receipts</h3>
            <p>Chronological log of recent stationery receipts recorded in the system</p>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Total Receipts: <strong>{receipts.length}</strong>
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Received Date</th>
                <th>Item Name</th>
                <th>Supplier Name</th>
                <th>Quantity Received</th>
                <th>Invoice #</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No stock receipt transactions recorded yet. Use the form above to record delivery.
                  </td>
                </tr>
              ) : (
                receipts.slice(0, 10).map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <code style={{ fontSize: "11px", color: "#4f46e5" }}>#{rec.id}</code>
                    </td>
                    <td>{rec.receivedDate}</td>
                    <td>
                      <strong>{rec.itemName}</strong>
                    </td>
                    <td>{rec.supplierName}</td>
                    <td className="quantity-in">
                      +{rec.quantity}
                    </td>
                    <td>{rec.invoiceNumber || "—"}</td>
                    <td>{rec.remarks || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Inventory Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Current Inventory Status</h3>
            <p>Current stock levels across all registered stationery items</p>
          </div>
          <Link to="/stationery" className="view-all" style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
            View Full Dashboard ↗
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Available Stock</th>
                <th>Minimum Alert Level</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No stationery items found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    <td
                      style={{
                        fontWeight: 700,
                        color:
                          item.currentStock === 0
                            ? "#dc2626"
                            : item.currentStock <= item.minimumStock
                            ? "#d97706"
                            : "#059669",
                      }}
                    >
                      {item.currentStock} {item.unit}
                    </td>
                    <td>{item.minimumStock} {item.unit}</td>
                    <td>
                      {item.currentStock === 0 ? (
                        <span className="badge danger">Out of Stock</span>
                      ) : item.currentStock <= item.minimumStock ? (
                        <span className="badge warning">Low Stock</span>
                      ) : (
                        <span className="badge success">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
