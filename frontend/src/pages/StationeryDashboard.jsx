import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const icons = {
  items: "☷",
  received: "📥",
  distributed: "📤",
  available: "▤",
  low: "⚠",
};

export default function StationeryDashboard() {
  const [data, setData] = useState({
    totalItems: 0,
    totalReceived: 0,
    totalDistributed: 0,
    totalAvailable: 0,
    lowStockItems: [],
  });
  const [items, setItems] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const [dashRes, itemsRes, receiptsRes, distRes] = await Promise.allSettled([
        api.get("/stationery/dashboard"),
        api.get("/stationery/items"),
        api.get("/stationery/receipts"),
        api.get("/stationery/distributions"),
      ]);

      if (dashRes.status === "fulfilled") {
        setData(dashRes.value.data || {});
      }
      if (itemsRes.status === "fulfilled") {
        setItems(itemsRes.value.data || []);
      } else if (dashRes.status === "fulfilled" && dashRes.value.data?.items) {
        setItems(dashRes.value.data.items);
      }

      if (receiptsRes.status === "fulfilled") {
        setReceipts(receiptsRes.value.data || []);
      } else if (dashRes.status === "fulfilled" && dashRes.value.data?.recentReceipts) {
        setReceipts(dashRes.value.data.recentReceipts);
      }

      if (distRes.status === "fulfilled") {
        setDistributions(distRes.value.data || []);
      } else if (dashRes.status === "fulfilled" && dashRes.value.data?.recentDistributions) {
        setDistributions(dashRes.value.data.recentDistributions);
      }

      if (dashRes.status === "rejected" && itemsRes.status === "rejected") {
        const errorMsg =
          dashRes.reason?.response?.data?.message ||
          dashRes.reason?.message ||
          "Could not load stationery dashboard. Please verify the backend is running on port 5000.";
        setError(errorMsg);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not load stationery dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = [
    {
      label: "Total Item Types",
      value: data.totalItems ?? items.length,
      icon: icons.items,
      color: "blue",
      note: "Stationery varieties",
    },
    {
      label: "Total Units Received",
      value: data.totalReceived ?? 0,
      icon: icons.received,
      color: "green",
      note: "Received from suppliers",
    },
    {
      label: "Total Units Distributed",
      value: data.totalDistributed ?? 0,
      icon: icons.distributed,
      color: "purple",
      note: "Issued to staff & students",
    },
    {
      label: "Total Available Stock",
      value: data.totalAvailable ?? 0,
      icon: icons.available,
      color: "cyan",
      note: "Currently in stock",
    },
  ];

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  );

  const filteredItems = items.filter((item) => {
    const term = search.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term);
    const matchesCategory =
      !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockList = items.filter(
    (item) => Number(item.currentStock) <= Number(item.minimumStock)
  );

  const getStockStatusBadge = (item) => {
    if (Number(item.currentStock) === 0) {
      return <span className="badge danger">Out of Stock</span>;
    }
    if (Number(item.currentStock) <= Number(item.minimumStock)) {
      return <span className="badge warning">Low Stock</span>;
    }
    return <span className="badge success">In Stock</span>;
  };

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-loading" style={{ minHeight: "400px", display: "grid", placeContent: "center", textAlign: "center" }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: "12px", color: "#64748b" }}>Loading Stationery Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Stationery Overview
          </span>
          <h2>Stationery Dashboard</h2>
          <p>Real-time monitor of stock levels, receipts, and item distributions</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
          <Link to="/stationery/receive" className="primary-btn">
            + Receive Stock
          </Link>
          <Link to="/stationery/distribute" className="primary-btn" style={{ background: "linear-gradient(110deg, #059669, #047857)" }}>
            + Distribute Items
          </Link>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      <div className="stats-grid">
        {stats.map((item) => (
          <div className="stat-card" key={item.label}>
            <div className={`stat-icon ${item.color}`}>{item.icon}</div>
            <div className="stat-information">
              <span>{item.label}</span>
              <h3>{Number(item.value || 0).toLocaleString("en-IN")}</h3>
              <small>{item.note}</small>
            </div>
            <span className="stat-decoration" />
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#d97706" }}>⚠</span> Low Stock Alerts
            </h3>
            <p>Stationery items at or below their configured minimum threshold</p>
          </div>
          <Link to="/stationery/receive" className="view-all" style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
            Restock items ↗
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Minimum Level</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <span style={{ fontSize: "18px", color: "#059669" }}>✓</span>
                    <br />
                    All stationery stock is healthy! No low-stock items detected.
                  </td>
                </tr>
              ) : (
                lowStockList.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td className={item.currentStock === 0 ? "quantity-out" : "quantity-low"}>
                      {item.currentStock} {item.unit}
                    </td>
                    <td>{item.minimumStock} {item.unit}</td>
                    <td>{getStockStatusBadge(item)}</td>
                    <td>
                      <Link
                        to="/stationery/receive"
                        className="primary-btn"
                        style={{ minHeight: "30px", padding: "4px 10px", fontSize: "11px" }}
                      >
                        Restock
                      </Link>
                    </td>
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
            <h3>Current Stationery Inventory</h3>
            <p>
              Showing {filteredItems.length} of {items.length} items
            </p>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search item or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <Link to="/stationery/add" className="primary-btn" style={{ minHeight: "40px", padding: "8px 14px", fontSize: "11px" }}>
              + Add New Item
            </Link>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Available Stock</th>
                <th>Minimum Stock Level</th>
                <th>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {items.length === 0
                      ? "No stationery items registered yet. Click 'Add New Item' to get started."
                      : "No items match your search filter."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
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
                    <td>{getStockStatusBadge(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Grid for Recent Receipts & Distributions */}
      <div className="dashboard-grid">
        {/* Recent Stock Receipts */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h3>Recent Stock Receipts</h3>
              <p>Latest supplier deliveries received</p>
            </div>
            <Link to="/stationery/receive" className="view-all" style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
              Receive stock ↗
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Supplier</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No stock receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  receipts.slice(0, 6).map((receipt) => (
                    <tr key={receipt.id}>
                      <td>{receipt.receivedDate}</td>
                      <td>
                        <strong>{receipt.itemName}</strong>
                      </td>
                      <td>{receipt.supplierName}</td>
                      <td className="quantity-in">+{receipt.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Distributions */}
        <section className="table-card">
          <div className="table-header">
            <div>
              <h3>Recent Item Distributions</h3>
              <p>Latest supplies issued to students and staff</p>
            </div>
            <Link to="/stationery/distribute" className="view-all" style={{ fontSize: "11px", color: "#4f46e5", fontWeight: 600 }}>
              Issue items ↗
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Recipient</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {distributions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No distributions recorded yet.
                    </td>
                  </tr>
                ) : (
                  distributions.slice(0, 6).map((record) => (
                    <tr key={record.id}>
                      <td>{record.issueDate}</td>
                      <td>
                        <strong>{record.itemName}</strong>
                      </td>
                      <td>
                        {record.recipientName}
                        <br />
                        <small style={{ color: "#8c9cb8", fontSize: "10px" }}>
                          {record.recipientType}
                        </small>
                      </td>
                      <td className="quantity-low">−{record.quantity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
