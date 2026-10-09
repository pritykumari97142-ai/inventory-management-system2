import { useEffect, useState } from "react";
import api from "../services/api";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    price: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const loadData = async () => {
    try {
      const [purchaseRes, productRes, supplierRes] = await Promise.all([
        api.get("/purchases"),
        api.get("/products"),
        api.get("/suppliers"),
      ]);

      setPurchases(purchaseRes.data);
      setProducts(productRes.data);
      setSuppliers(supplierRes.data);
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

  const addPurchase = async (e) => {
    e.preventDefault();

    if (!form.supplierId || !form.productId || !form.quantity || !form.price) {
      alert("Please fill all required fields");
      return;
    }

    try {
      await api.post("/purchases", {
        supplierId: Number(form.supplierId),
        productId: Number(form.productId),
        quantity: Number(form.quantity),
        price: Number(form.price),
        purchaseDate: form.purchaseDate,
      });

      alert("Purchase added and stock increased");

      setForm({
        supplierId: "",
        productId: "",
        quantity: "",
        price: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });

      loadData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add purchase");
    }
  };

  const getProductName = (id) => {
    const product = products.find((item) => item.id == id);

    return product?.name || "Unknown";
  };

  const getSupplierName = (id) => {
    const supplier = suppliers.find((item) => item.id == id);

    return supplier?.name || "Unknown";
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Purchases</h1>
          <p>Add purchases and increase product stock</p>
        </div>
      </div>

      <div className="module-card">
        <h2>Add Purchase</h2>

        <form onSubmit={addPurchase}>
          <div className="form-grid">
            <div className="form-group">
              <label>Supplier</label>

              <select
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                required
              >
                <option value="">Select supplier</option>

                {suppliers
                  .filter((supplier) => supplier.status === "active")
                  .map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
              </select>
            </div>

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
                      {product.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>

              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Price Per Unit</label>

              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Purchase Date</label>

              <input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-btn">
            Add Purchase
          </button>
        </form>
      </div>

      <div className="module-card">
        <div className="card-header">
          <h2>Purchase History</h2>
          <span>{purchases.length} purchases</span>
        </div>

        {purchases.length === 0 ? (
          <div className="empty-state">No purchases found</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {purchases
                  .slice()
                  .reverse()
                  .map((purchase) => (
                    <tr key={purchase.id}>
                      <td>{purchase.purchaseDate}</td>

                      <td>{getSupplierName(purchase.supplierId)}</td>

                      <td>{getProductName(purchase.productId)}</td>

                      <td>
                        <strong>{purchase.quantity}</strong>
                      </td>

                      <td>₹{purchase.price}</td>

                      <td>
                        <strong>₹{purchase.totalAmount}</strong>
                      </td>
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

export default Purchases;
