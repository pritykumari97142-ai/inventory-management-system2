import { useEffect, useState } from "react";
import api from "../services/api";

function Issues() {
  const [issues, setIssues] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    productId: "",
    quantity: "",
    issuedTo: "",
    purpose: "",
    issueDate: new Date().toISOString().split("T")[0],
    issuedBy: "Admin",
  });

  const loadData = async () => {
    try {
      const [issueRes, productRes] = await Promise.all([
        api.get("/issues"),
        api.get("/products"),
      ]);

      setIssues(issueRes.data);
      setProducts(productRes.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addIssue = async (e) => {
    e.preventDefault();

    if (!form.productId || !form.quantity || !form.issuedTo || !form.purpose) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await api.post("/issues", {
        ...form,
        productId: Number(form.productId),
        quantity: Number(form.quantity),
      });

      alert("Stock issued successfully");

      setForm({
        productId: "",
        quantity: "",
        issuedTo: "",
        purpose: "",
        issueDate: new Date().toISOString().split("T")[0],
        issuedBy: "Admin",
      });

      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to issue stock");
    }
  };

  const getProductName = (id) => {
    const product = products.find((item) => item.id == id);

    return product?.name || "Unknown";
  };

  const getProductStock = (id) => {
    const product = products.find((item) => item.id == id);

    return product?.quantity ?? 0;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Stock Issues</h1>
          <p>Issue products and manage outgoing stock</p>
        </div>
      </div>

      <div className="module-card">
        <h2>Issue Stock</h2>

        <form onSubmit={addIssue}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product</label>

              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                required
              >
                <option value="">Select product</option>

                {products
                  .filter((product) => product.status === "active")
                  .map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — Stock: {product.quantity}
                    </option>
                  ))}
              </select>

              {form.productId && (
                <small className="available-stock">
                  Available stock: {getProductStock(Number(form.productId))}
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Quantity</label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="form-group">
              <label>Issued To</label>

              <input
                type="text"
                name="issuedTo"
                value={form.issuedTo}
                onChange={handleChange}
                placeholder="Person / Department"
                required
              />
            </div>

            <div className="form-group">
              <label>Purpose</label>

              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="Reason for issue"
                required
              />
            </div>

            <div className="form-group">
              <label>Issue Date</label>

              <input
                type="date"
                name="issueDate"
                value={form.issueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Issued By</label>

              <input
                type="text"
                name="issuedBy"
                value={form.issuedBy}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-btn">
            Issue Stock
          </button>
        </form>
      </div>

      <div className="module-card">
        <div className="card-header">
          <h2>Issue History</h2>
          <span>{issues.length} issues</span>
        </div>

        {issues.length === 0 ? (
          <div className="empty-state">No stock issues found</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Issued To</th>
                  <th>Purpose</th>
                  <th>Issued By</th>
                </tr>
              </thead>

              <tbody>
                {issues
                  .slice()
                  .reverse()
                  .map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.issueDate}</td>

                      <td>
                        <strong>{getProductName(issue.productId)}</strong>
                      </td>

                      <td>
                        <span className="issue-quantity">
                          -{issue.quantity}
                        </span>
                      </td>

                      <td>{issue.issuedTo}</td>

                      <td>{issue.purpose}</td>

                      <td>{issue.issuedBy}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Issues;
