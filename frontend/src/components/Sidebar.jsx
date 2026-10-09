import { NavLink } from "react-router-dom";

const navigation = [
  { name: "Dashboard", path: "/", icon: "⌂", admin: false },
  { name: "Categories", path: "/categories", icon: "▦", admin: true },
  { name: "Products", path: "/products", icon: "◇", admin: false },
  { name: "Suppliers", path: "/suppliers", icon: "♙", admin: true },
  { name: "Purchases", path: "/purchases", icon: "🛒", admin: true },
  { name: "Stock Issues", path: "/issues", icon: "⚠", admin: false },
  { name: "Stock History", path: "/history", icon: "◷", admin: false },
];

function Sidebar() {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const isAdmin = user?.role === "admin";

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">I</div>
        <div className="logo-copy">
          <h2>Inventory</h2>
          <span>Management System</span>
        </div>
      </div>

      <div className="sidebar-label">WORKSPACE</div>

      <nav className="sidebar-nav">
        {navigation
          .filter((item) => !item.admin || isAdmin)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>
              <span className="nav-arrow">›</span>
            </NavLink>
          ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-icon">✓</div>
        <div>
          <strong>Inventory System</strong>
          <small>{isAdmin ? "Administrator access" : "Staff access"}</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
