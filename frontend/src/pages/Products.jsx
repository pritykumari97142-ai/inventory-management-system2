import { useEffect, useState } from "react";
import api from "../services/api";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 5;

  const [form, setForm] = useState({
    name: "",
    code: "",
    categoryId: "",
    price: "",
    quantity: "",
    minStock: "",
    description: "",
  });

  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addProduct = async (e) => {
    e.preventDefault();

    try {
      await api.post("/products", {
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        minStock: Number(form.minStock),
      });

      setMessage("Product added successfully");

      setForm({
        name: "",
        code: "",
        categoryId: "",
        price: "",
        quantity: "",
        minStock: "",
        description: "",
      });

      loadProducts();
      setCurrentPage(1);

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add product");
    }
  };

  const deactivateProduct = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this product?",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/products/${id}`);

      loadProducts();

      setMessage("Product deactivated successfully");

      setTimeout(() => {
        setMessage("");
      }, 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to deactivate product",
      );
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((item) => item.id == categoryId);

    return category?.name || "Unknown";
  };

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(searchText) ||
      product.code.toLowerCase().includes(searchText);

    const matchesCategory =
      categoryFilter === "" || product.categoryId == categoryFilter;

    let matchesStock = true;

    if (stockFilter === "in-stock") {
      matchesStock = product.quantity > product.minStock;
    }

    if (stockFilter === "low-stock") {
      matchesStock =
        product.quantity > 0 && product.quantity <= product.minStock;
    }

    if (stockFilter === "out-of-stock") {
      matchesStock = product.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage,
  );

  const changeSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const changeCategory = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const changeStock = (value) => {
    setStockFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p>Manage your inventory products</p>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="form-card">
        <h3>Add Product</h3>

        <form onSubmit={addProduct} className="form-grid">
          <input
            type="text"
            name="name"
            placeholder="Product name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="code"
            placeholder="Product code"
            value={form.code}
            onChange={handleChange}
            required
          />

          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            name="price"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            min="0"
            required
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleChange}
            min="0"
            required
          />

          <input
            type="number"
            name="minStock"
            placeholder="Minimum stock"
            value={form.minStock}
            onChange={handleChange}
            min="0"
            required
          />

          <input
            type="text"
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />

          <button type="submit" className="primary-btn">
            Add Product
          </button>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Product List</h3>

            <p>
              Showing {currentProducts.length} of {filteredProducts.length}{" "}
              products
            </p>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search product..."
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />

            <select
              value={categoryFilter}
              onChange={(e) => changeCategory(e.target.value)}
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => changeStock(e.target.value)}
            >
              <option value="">All Stock</option>

              <option value="in-stock">In Stock</option>

              <option value="low-stock">Low Stock</option>

              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No products found
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>

                    <td>
                      <strong>{product.name}</strong>
                    </td>

                    <td>{product.code}</td>

                    <td>{getCategoryName(product.categoryId)}</td>

                    <td>₹{product.price}</td>

                    <td>{product.quantity}</td>

                    <td>
                      {product.quantity === 0 ? (
                        <span className="badge danger">Out of Stock</span>
                      ) : product.quantity <= product.minStock ? (
                        <span className="badge warning">Low Stock</span>
                      ) : (
                        <span className="badge success">In Stock</span>
                      )}
                    </td>

                    <td>
                      {product.status === "active" && (
                        <button
                          className="delete-btn"
                          onClick={() => deactivateProduct(product.id)}
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  className={currentPage === page ? "active-page" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
