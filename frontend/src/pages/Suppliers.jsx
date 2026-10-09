import { useEffect, useState } from "react";
import api from "../services/api";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const [message, setMessage] = useState("");

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const addSupplier = async (e) => {
    e.preventDefault();

    try {
      await api.post("/suppliers", form);

      setForm({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
      });

      setMessage("Supplier added successfully");

      loadSuppliers();

      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to add supplier");
    }
  };

  const deactivateSupplier = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to deactivate this supplier?",
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/suppliers/${id}`);

      setMessage("Supplier deactivated successfully");

      loadSuppliers();

      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Failed to deactivate supplier",
      );
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const text = search.toLowerCase();

    return (
      supplier.name?.toLowerCase().includes(text) ||
      supplier.contactPerson?.toLowerCase().includes(text) ||
      supplier.phone?.toLowerCase().includes(text) ||
      supplier.email?.toLowerCase().includes(text)
    );
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Suppliers</h2>
          <p>Manage your suppliers</p>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}

      <div className="form-card">
        <h3>Add Supplier</h3>

        <form onSubmit={addSupplier} className="form-grid">
          <input
            type="text"
            name="name"
            placeholder="Supplier name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="contactPerson"
            placeholder="Contact person"
            value={form.contactPerson}
            onChange={handleChange}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
          />

          <button type="submit" className="primary-btn">
            Add Supplier
          </button>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <div>
            <h3>Supplier List</h3>

            <p>
              Showing {filteredSuppliers.length} of {suppliers.length}
            </p>
          </div>

          <input
            type="text"
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.id}</td>

                    <td>
                      <strong>{supplier.name}</strong>
                    </td>

                    <td>{supplier.contactPerson || "-"}</td>

                    <td>{supplier.phone || "-"}</td>

                    <td>{supplier.email || "-"}</td>

                    <td>{supplier.address || "-"}</td>

                    <td>
                      <span
                        className={
                          supplier.status === "active"
                            ? "badge success"
                            : "badge danger"
                        }
                      >
                        {supplier.status}
                      </span>
                    </td>

                    <td>
                      {supplier.status === "active" && (
                        <button
                          className="delete-btn"
                          onClick={() => deactivateSupplier(supplier.id)}
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
      </div>
    </div>
  );
}

export default Suppliers;
