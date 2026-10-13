import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const recipientTypes = ["Student", "Staff", "Department", "Other"];

export default function DistributeItems() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Search and filter for distribution history table
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  let currentUser = "Admin";
  try {
    const stored = JSON.parse(localStorage.getItem("user") || "null");
    if (stored?.name) currentUser = stored.name;
  } catch {
    currentUser = "Admin";
  }

  const [form, setForm] = useState({
    itemId: "",
    quantity: "",
    recipientName: "",
    recipientId: "",
    recipientType: "Student",
    department: "",
    reason: "",
    issuedBy: currentUser,
    issueDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });

  const loadData = async () => {
    try {
      const [itemsRes, distRes] = await Promise.allSettled([
        api.get("/stationery/items"),
        api.get("/stationery/distributions"),
      ]);

      if (itemsRes.status === "fulfilled") {
        setItems(itemsRes.value.data || []);
      }
      if (distRes.status === "fulfilled") {
        setHistory(distRes.value.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stationery data.");
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
  const isOutOfStock = selectedItem && selectedItem.currentStock === 0;
  const isInsufficient = selectedItem && enteredQty > selectedItem.currentStock;
  const projectedRemaining = selectedItem ? Math.max(0, selectedItem.currentStock - enteredQty) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.itemId) {
      setError("Please select a stationery item to issue.");
      return;
    }

    if (!selectedItem) {
      setError("Selected stationery item not found.");
      return;
    }

    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number (at least 1).");
      return;
    }

    if (qty > selectedItem.currentStock) {
      setError(
        `Insufficient stock! Cannot issue ${qty} ${selectedItem.unit}. Only ${selectedItem.currentStock} ${selectedItem.unit} currently available in inventory.`
      );
      return;
    }

    const trimmedRecipient = form.recipientName.trim();
    const trimmedReason = form.reason.trim();

    if (!trimmedRecipient) {
      setError("Recipient name is required.");
      return;
    }

    if (!trimmedReason) {
      setError("Reason for issue is required.");
      return;
    }

    if (!form.issueDate) {
      setError("Issue date is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/stationery/distribute", {
        itemId: form.itemId,
        quantity: qty,
        recipientName: trimmedRecipient,
        recipientId: form.recipientId.trim(),
        recipientType: form.recipientType,
        department: form.department.trim(),
        reason: trimmedReason,
        issuedBy: form.issuedBy.trim() || currentUser,
        issueDate: form.issueDate,
        remarks: form.remarks.trim(),
      });

      const remainingStock = response.data.currentStock;
      setMessage(
        `✓ Stationery successfully issued to ${trimmedRecipient} (${form.recipientType})! Distributed: ${qty} ${selectedItem.unit} of "${selectedItem.name}". Remaining stock: ${remainingStock} ${selectedItem.unit}.`
      );

      setForm({
        itemId: "",
        quantity: "",
        recipientName: "",
        recipientId: "",
        recipientType: "Student",
        department: "",
        reason: "",
        issuedBy: currentUser,
        issueDate: new Date().toISOString().slice(0, 10),
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to distribute stationery item.");
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter((record) => {
    const term = search.toLowerCase();
    const matchesSearch =
      record.recipientName?.toLowerCase().includes(term) ||
      record.recipientId?.toLowerCase().includes(term) ||
      record.itemName?.toLowerCase().includes(term) ||
      record.department?.toLowerCase().includes(term) ||
      record.reason?.toLowerCase().includes(term);

    const matchesType = !typeFilter || record.recipientType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Outward Issue
          </span>
          <h2>Distribute Items</h2>
          <p>Issue stationery supplies to students, faculty, staff, and departments</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/stationery" className="secondary-btn">
            ← Stationery Dashboard
          </Link>
          <Link to="/stationery/receive" className="secondary-btn">
            + Receive Stock
          </Link>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">⚠ {error}</div>}

      {items.length === 0 && !fetching && (
        <div className="error-message" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>No stationery items available in the catalogue. Register items and receive stock first.</span>
          <Link to="/stationery/add" className="primary-btn" style={{ minHeight: "32px", padding: "4px 12px", fontSize: "11px" }}>
            Add Stationery Item →
          </Link>
        </div>
      )}

      {/* Distribution Form */}
      <div className="form-card">
        <h3>Issue Stationery Form</h3>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="dist-item">Stationery Item *</label>
            <select
              id="dist-item"
              name="itemId"
              value={form.itemId}
              onChange={handleChange}
              required
            >
              <option value="">-- Select stationery item --</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Available: {item.currentStock} {item.unit}{" "}
                  {item.currentStock === 0 ? "(OUT OF STOCK)" : ""}
                </option>
              ))}
            </select>
            {selectedItem && (
              <small
                className="stock-badge-info"
                style={{
                  background: isOutOfStock ? "#ffe6e8" : isInsufficient ? "#fffbeb" : "#eef2ff",
                  color: isOutOfStock ? "#c83240" : isInsufficient ? "#d97706" : "#4f46e5",
                }}
              >
                Available in Stock: <strong>{selectedItem.currentStock} {selectedItem.unit}</strong>
                {isOutOfStock && " — Item is currently out of stock!"}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dist-quantity">Quantity to Issue *</label>
            <input
              id="dist-quantity"
              type="number"
              name="quantity"
              min="1"
              max={selectedItem?.currentStock || undefined}
              step="1"
              value={form.quantity}
              onChange={handleChange}
              placeholder="e.g. 3"
              required
            />
            {selectedItem && enteredQty > 0 && (
              <small
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: isInsufficient ? "#dc2626" : "#059669",
                }}
              >
                {isInsufficient
                  ? `⚠ Insufficient stock: requested ${enteredQty} exceeds available ${selectedItem.currentStock} ${selectedItem.unit}`
                  : `✓ Remaining stock after issue will be: ${projectedRemaining} ${selectedItem.unit}`}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="dist-recipient">Recipient Name *</label>
            <input
              id="dist-recipient"
              type="text"
              name="recipientName"
              value={form.recipientName}
              onChange={handleChange}
              placeholder="e.g. Rahul Sharma, Dr. Ananya Sen"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dist-recipient-id">Student / Staff ID</label>
            <input
              id="dist-recipient-id"
              type="text"
              name="recipientId"
              value={form.recipientId}
              onChange={handleChange}
              placeholder="e.g. STU-2026-104 or EMP-889"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dist-type">Recipient Type *</label>
            <select
              id="dist-type"
              name="recipientType"
              value={form.recipientType}
              onChange={handleChange}
              required
            >
              {recipientTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dist-dept">Department or Class</label>
            <input
              id="dist-dept"
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science / Class 10-A"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dist-date">Issue Date *</label>
            <input
              id="dist-date"
              type="date"
              name="issueDate"
              value={form.issueDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dist-issued-by">Issued By</label>
            <input
              id="dist-issued-by"
              type="text"
              name="issuedBy"
              value={form.issuedBy}
              onChange={handleChange}
              placeholder="Admin or Staff Member Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dist-reason">Reason for Issue *</label>
            <input
              id="dist-reason"
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="e.g. Midterm examinations, Practical lab session, Office administration"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dist-remarks">Remarks</label>
            <input
              id="dist-remarks"
              type="text"
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Optional notes or authorization reference"
            />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading || items.length === 0 || isInsufficient || isOutOfStock}
            >
              {loading ? "Issuing..." : "Issue Item"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                setForm({
                  itemId: "",
                  quantity: "",
                  recipientName: "",
                  recipientId: "",
                  recipientType: "Student",
                  department: "",
                  reason: "",
                  issuedBy: currentUser,
                  issueDate: new Date().toISOString().slice(0, 10),
                  remarks: "",
                })
              }
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Distribution History Table */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Stationery Distribution History</h3>
            <p>
              Showing {filteredHistory.length} of {history.length} records
            </p>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search recipient, item, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Recipient Types</option>
              {recipientTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Issue Date</th>
                <th>Recipient Name</th>
                <th>ID</th>
                <th>Recipient Type</th>
                <th>Stationery Item</th>
                <th>Quantity</th>
                <th>Department / Class</th>
                <th>Reason</th>
                <th>Issued By</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    {history.length === 0
                      ? "No items distributed yet. Use the form above to record an issue."
                      : "No distribution records match your filter."}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => (
                  <tr key={rec.id}>
                    <td>{rec.issueDate}</td>
                    <td>
                      <strong>{rec.recipientName}</strong>
                    </td>
                    <td>{rec.recipientId || "—"}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            rec.recipientType === "Student"
                              ? "#eff6ff"
                              : rec.recipientType === "Staff"
                              ? "#f5f3ff"
                              : "#ecfdf5",
                          color:
                            rec.recipientType === "Student"
                              ? "#2563eb"
                              : rec.recipientType === "Staff"
                              ? "#7c3aed"
                              : "#059669",
                        }}
                      >
                        {rec.recipientType}
                      </span>
                    </td>
                    <td>
                      <strong>{rec.itemName}</strong>
                    </td>
                    <td className="quantity-low">−{rec.quantity}</td>
                    <td>{rec.department || "—"}</td>
                    <td>{rec.reason}</td>
                    <td>{rec.issuedBy || "—"}</td>
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
