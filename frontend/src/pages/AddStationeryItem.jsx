import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const suggestedCategories = [
  "Writing Instruments",
  "Notebooks & Registers",
  "Paper Products",
  "Filing & Folders",
  "Desk Accessories",
  "Art & Drawing",
  "General Stationery",
];

const unitOptions = ["Piece", "Box", "Packet", "Ream", "Set"];

export default function AddStationeryItem() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "Piece",
    minimumStock: "10",
  });

  const loadItems = async () => {
    try {
      const response = await api.get("/stationery/items");
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      // Non-blocking fetch for preview table
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const trimmedName = form.name.trim();
    const trimmedCategory = form.category.trim();
    const minStockVal = Number(form.minimumStock);

    if (!trimmedName || !trimmedCategory) {
      setError("Item name and category are required.");
      return;
    }

    if (!Number.isInteger(minStockVal) || minStockVal < 0) {
      setError("Minimum stock alert level must be a non-negative whole number (0 or greater).");
      return;
    }

    // Client-side duplicate check
    const isDuplicate = items.some(
      (item) => item.name.toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setError(`A stationery item named "${trimmedName}" already exists.`);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/stationery/items", {
        name: trimmedName,
        category: trimmedCategory,
        unit: form.unit,
        minimumStock: minStockVal,
      });

      setMessage(res.data.message || `Stationery item "${trimmedName}" registered successfully with 0 stock.`);
      setForm({
        name: "",
        category: "",
        unit: "Piece",
        minimumStock: "10",
      });
      await loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create stationery item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Catalogue Registration
          </span>
          <h2>Add Stationery Item</h2>
          <p>Register a new stationery item into the central inventory catalogue</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/stationery" className="secondary-btn">
            ← Stationery Dashboard
          </Link>
          <Link to="/stationery/receive" className="primary-btn">
            Stock Received Page
          </Link>
        </div>
      </div>

      {message && (
        <div className="success-message" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>✓ {message}</span>
          <button
            type="button"
            className="primary-btn"
            style={{ minHeight: "32px", padding: "4px 12px", fontSize: "11px", background: "#15803d" }}
            onClick={() => navigate("/stationery/receive")}
          >
            Receive Stock for this item →
          </button>
        </div>
      )}

      {error && <div className="error-message">⚠ {error}</div>}

      <div className="form-card">
        <h3>Stationery Item Details</h3>

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="stationery-name">Item Name *</label>
            <input
              id="stationery-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Ball Pen, Notebook, A4 Paper, Marker"
              required
            />
            <small style={{ color: "#8c9cb8", fontSize: "11px" }}>
              Case-insensitive unique name in inventory
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="stationery-category">Category *</label>
            <input
              id="stationery-category"
              type="text"
              list="category-suggestions"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="e.g. Writing Instruments, Paper Products"
              required
            />
            <datalist id="category-suggestions">
              {suggestedCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <small style={{ color: "#8c9cb8", fontSize: "11px" }}>
              Select a suggested category or type a custom one
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="stationery-unit">Unit of Measurement *</label>
            <select
              id="stationery-unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              required
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <small style={{ color: "#8c9cb8", fontSize: "11px" }}>
              Standard packaging unit for stock tracking
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="stationery-min-stock">Minimum Stock Alert Level *</label>
            <input
              id="stationery-min-stock"
              type="number"
              name="minimumStock"
              min="0"
              step="1"
              value={form.minimumStock}
              onChange={handleChange}
              placeholder="e.g. 10"
              required
            />
            <small style={{ color: "#8c9cb8", fontSize: "11px" }}>
              Low-stock alerts will trigger when stock falls to or below this level
            </small>
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", alignItems: "center" }}>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Registering..." : "Add Stationery Item"}
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                setForm({
                  name: "",
                  category: "",
                  unit: "Piece",
                  minimumStock: "10",
                })
              }
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* Existing Registered Items Preview */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Registered Stationery Catalogue</h3>
            <p>Recently registered stationery items and their current stock levels</p>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Total Items: <strong>{items.length}</strong>
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Stock</th>
                <th>Minimum Alert Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Loading registered items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No stationery items found. Register your first item using the form above.
                  </td>
                </tr>
              ) : (
                items.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    <td>
                      <strong>{item.currentStock}</strong> {item.unit}
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
