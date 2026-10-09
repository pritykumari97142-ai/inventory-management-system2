import { useEffect, useState } from "react";
import api from "../services/api";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();

    try {
      await api.post("/categories", { name });

      setName("");
      setMessage("Category added successfully");

      loadCategories();

      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add category");
    }
  };

  const deleteCategory = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/categories/${id}`);

      setMessage("Category deleted successfully");

      loadCategories();

      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p>Manage product categories</p>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="form-card">
        <h3>Add Category</h3>

        <form onSubmit={addCategory} className="inline-form">
          <input
            type="text"
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <button type="submit" className="primary-btn">
            Add Category
          </button>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Category List</h3>

            <p>
              Showing {filteredCategories.length} of {categories.length}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    No categories found
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.id}</td>

                    <td>
                      <strong>{category.name}</strong>
                    </td>

                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => deleteCategory(category.id)}
                      >
                        Delete
                      </button>
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

export default Categories;
