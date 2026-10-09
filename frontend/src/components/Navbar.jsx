import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <header className="navbar">
      <div>
        <h3>Inventory Management System</h3>
        <p>Manage your inventory efficiently</p>
      </div>

      <div className="user-area">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase() || "A"}
        </div>

        <div>
          <strong>{user?.name || "Admin"}</strong>

          <small>{user?.role || "admin"}</small>
        </div>

        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
