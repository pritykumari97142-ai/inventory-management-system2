import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const icons = {
  products: "▣",
  categories: "▦",
  suppliers: "♙",
  stock: "▤",
  low: "⚠",
  out: "⊘",
};

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [stats, productData, transactionData] = await Promise.all([
          api.get("/dashboard"),
          api.get("/products"),
          api.get("/transactions"),
        ]);

        setDashboard(stats.data);
        setProducts(productData.data);
        setTransactions(transactionData.data.slice().reverse());
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load dashboard. Check the backend.",
        );
      }
    };

    loadDashboard();
  }, []);

  const getProduct = (id) => products.find((p) => p.id == id);

  const getProductName = (id) => getProduct(id)?.name || "Unknown product";

  const lowStock = products.filter(
    (p) =>
      p.status === "active" &&
      Number(p.quantity) > 0 &&
      Number(p.quantity) <= Number(p.minStock),
  );

  const outOfStock = products.filter(
    (p) => p.status === "active" && Number(p.quantity) === 0,
  );

  const stats = dashboard
    ? [
        {
          label: "Total Products",
          value: dashboard.totalProducts,
          icon: icons.products,
          color: "blue",
          note: "Products registered",
        },
        {
          label: "Categories",
          value: dashboard.totalCategories,
          icon: icons.categories,
          color: "green",
          note: "Product categories",
        },
        {
          label: "Suppliers",
          value: dashboard.totalSuppliers,
          icon: icons.suppliers,
          color: "purple",
          note: "Registered suppliers",
        },
        {
          label: "Total Stock",
          value: dashboard.totalStock,
          icon: icons.stock,
          color: "cyan",
          note: "Units available",
        },
        {
          label: "Low Stock",
          value: lowStock.length,
          icon: icons.low,
          color: "orange",
          note: "Need restocking",
        },
        {
          label: "Out of Stock",
          value: outOfStock.length,
          icon: icons.out,
          color: "red",
          note: "Currently unavailable",
        },
      ]
    : [];

  if (!dashboard && !error) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Dashboard unavailable</h3>
        <p>{error}</p>
        <button
          className="primary-btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h2>Dashboard</h2>
          <p>Here's what's happening with your inventory.</p>
        </div>

        <div className="system-status">
          <span className="online-dot" />
          Inventory Overview
        </div>
      </div>

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

      <div className="dashboard-grid">
        <section className="table-card">
          <div className="section-heading">
            <div className="section-title-icon orange">⚠</div>
            <div>
              <h3>Low Stock Products</h3>
              <p>Products that need restocking</p>
            </div>
            <Link to="/products" className="view-all">
              View all ↗
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current</th>
                  <th>Minimum</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      <span className="empty-icon">✓</span>
                      <br />
                      All good! No low-stock products.
                    </td>
                  </tr>
                ) : (
                  lowStock.slice(0, 5).map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <small className="table-subtext">{product.code}</small>
                      </td>
                      <td className="quantity-low">{product.quantity}</td>
                      <td>{product.minStock}</td>
                      <td>
                        <span className="badge warning">Low Stock</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="table-card">
          <div className="section-heading">
            <div className="section-title-icon red">⊘</div>
            <div>
              <h3>Out of Stock</h3>
              <p>Products currently unavailable</p>
            </div>
            <Link to="/products" className="view-all">
              View all ↗
            </Link>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outOfStock.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="empty-state">
                      <span className="empty-icon">✓</span>
                      <br />
                      No out-of-stock products.
                    </td>
                  </tr>
                ) : (
                  outOfStock.slice(0, 5).map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                      </td>
                      <td>{product.code}</td>
                      <td>
                        <span className="badge danger">Out of Stock</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="table-card transactions-card">
        <div className="section-heading">
          <div className="section-title-icon blue">↕</div>
          <div>
            <h3>Recent Stock Transactions</h3>
            <p>Latest stock movements in your inventory</p>
          </div>
          <Link to="/history" className="view-all">
            View history ↗
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No transactions yet. Purchases and stock issues will appear
                    here.
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 6).map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <strong>{getProductName(transaction.productId)}</strong>
                    </td>
                    <td>#{transaction.id}</td>
                    <td>
                      <span
                        className={`badge ${
                          transaction.type === "IN" ? "success" : "danger"
                        }`}
                      >
                        {transaction.type === "IN" ? "Stock IN" : "Stock OUT"}
                      </span>
                    </td>
                    <td
                      className={
                        transaction.type === "IN"
                          ? "quantity-in"
                          : "quantity-low"
                      }
                    >
                      {transaction.type === "IN" ? "+" : "−"}
                      {transaction.quantity}
                    </td>
                    <td>
                      {transaction.date
                        ? new Date(transaction.date).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
