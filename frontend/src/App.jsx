import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Issues from "./pages/Issues";
import StockHistory from "./pages/StockHistory";

// Single unified Stationery Management page
import StationeryManagement from "./pages/StationeryManagement";

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-area">
        <Navbar />

        <main className="content">
          <Routes>
            {/* Existing Pages */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Products />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/history" element={<StockHistory />} />

            {/* Single Stationery Management Page */}
            <Route path="/stationery" element={<StationeryManagement />} />

            {/* Redirect old sub-routes to single page */}
            <Route path="/stationery/*" element={<Navigate to="/stationery" replace />} />

            {/* Unknown path */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const user = localStorage.getItem("user");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/*"
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
