import { useEffect, useState, useCallback } from "react";
import api from "../services/api";

/* ─────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────── */
const today = () => new Date().toISOString().slice(0, 10);

const CATEGORIES = [
  "Writing Instruments",
  "Notebooks & Registers",
  "Files & Folders",
  "Printing & Paper",
  "Office Supplies",
  "ID & Uniform",
  "Electronics",
  "Other",
];

function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const styles = {
    success: { bg: "#ecfdf5", border: "#6ee7b7", color: "#065f46", icon: "✓" },
    error: { bg: "#fef2f2", border: "#fca5a5", color: "#991b1b", icon: "⚠" },
  };
  const s = styles[type] || styles.error;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "14px 18px",
        marginBottom: "18px",
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "12px",
        color: s.color,
        fontSize: "13px",
        fontWeight: 500,
        animation: "fadeIn 0.25s ease",
      }}
    >
      <span style={{ fontWeight: 800, fontSize: "15px" }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: s.color,
          fontSize: "16px",
          padding: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function SectionHeading({ icon, title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "10px",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#6366f1",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          {icon} {title}
        </div>
        {subtitle && <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ITEM DETAIL MODAL
───────────────────────────────────────────── */
function ItemDetailModal({ item, receipts, distributions, onClose }) {
  if (!item) return null;

  const itemReceipts = receipts.filter((r) => String(r.itemId) === String(item.id));
  const itemDists = distributions.filter((d) => String(d.itemId) === String(item.id));
  const totalRec = itemReceipts.reduce((s, r) => s + Number(r.quantity || 0), 0);
  const totalDist = itemDists.reduce((s, d) => s + Number(d.quantity || 0), 0);
  const available = totalRec - totalDist;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(10,15,40,0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        overflowY: "auto",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          background: "#fff",
          borderRadius: "20px",
          boxShadow: "0 30px 90px rgba(10,15,40,0.22)",
          overflow: "hidden",
          animation: "fadeIn 0.2s ease",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "24px 28px",
            background: "linear-gradient(110deg, #4f46e5, #7c3aed)",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "11px", opacity: 0.8, marginBottom: "6px", fontWeight: 600 }}>
                ITEM DETAILS
              </div>
              <h3 style={{ margin: 0, fontSize: "22px", fontWeight: 800 }}>{item.name}</h3>
              <span style={{ fontSize: "12px", opacity: 0.85 }}>
                {item.category} · {item.unit}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "18px",
                width: "36px",
                height: "36px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          {/* Summary Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "14px",
              marginTop: "20px",
            }}
          >
            {[
              { label: "Total Received", value: totalRec },
              { label: "Total Distributed", value: totalDist },
              { label: "Available Stock", value: available },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: "12px",
                  padding: "14px 18px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "28px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", opacity: 0.85, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px 28px" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
            📥 Stock Receipt History ({itemReceipts.length} entries)
          </h4>
          <div style={{ overflowX: "auto", marginBottom: "24px" }}>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "#f8f9fd" }}>
                  {["Date", "Supplier", "Qty Received", "Invoice #", "Remarks"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", color: "#7c879b", fontSize: "10px", fontWeight: 750, whiteSpace: "nowrap", borderBottom: "1px solid #e9edf5", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemReceipts.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No receipts for this item.</td></tr>
                ) : (
                  itemReceipts.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #f0f2f7" }}>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{r.receivedDate}</td>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{r.supplierName}</td>
                      <td style={{ padding: "10px 14px", color: "#059669", fontWeight: 700 }}>+{r.quantity}</td>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{r.invoiceNumber || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{r.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h4 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 750, color: "#1e293b" }}>
            📤 Distribution History ({itemDists.length} entries)
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "#f8f9fd" }}>
                  {["Date", "Student Name", "Admission No.", "Qty", "Remarks"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", color: "#7c879b", fontSize: "10px", fontWeight: 750, whiteSpace: "nowrap", borderBottom: "1px solid #e9edf5", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemDists.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>No distributions for this item.</td></tr>
                ) : (
                  itemDists.map((d) => (
                    <tr key={d.id} style={{ borderBottom: "1px solid #f0f2f7" }}>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{d.issueDate}</td>
                      <td style={{ padding: "10px 14px" }}><strong>{d.recipientName}</strong></td>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{d.recipientId || "—"}</td>
                      <td style={{ padding: "10px 14px", color: "#dc2626", fontWeight: 700 }}>-{d.quantity}</td>
                      <td style={{ padding: "10px 14px", color: "#59667d" }}>{d.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function StationeryManagement() {
  const [items, setItems] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [dashboard, setDashboard] = useState({ totalItems: 0, totalReceived: 0, totalDistributed: 0, totalAvailable: 0 });
  const [loading, setLoading] = useState(true);
  const [globalMsg, setGlobalMsg] = useState({ type: "", msg: "" });

  const [addItemForm, setAddItemForm] = useState({ name: "", category: CATEGORIES[0], unit: "Piece", minimumStock: "0", newCategory: "" });
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [addItemMsg, setAddItemMsg] = useState({ type: "", msg: "" });
  const [showAddItem, setShowAddItem] = useState(false);

  const [receiveForm, setReceiveForm] = useState({ itemId: "", supplierName: "", quantity: "", receivedDate: today(), invoiceNumber: "", remarks: "" });
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveMsg, setReceiveMsg] = useState({ type: "", msg: "" });

  const [distForm, setDistForm] = useState({ itemId: "", studentName: "", admissionNumber: "", quantity: "", issueDate: today(), remarks: "" });
  const [distLoading, setDistLoading] = useState(false);
  const [distMsg, setDistMsg] = useState({ type: "", msg: "" });

  const [distSearch, setDistSearch] = useState("");
  const [distItemFilter, setDistItemFilter] = useState("");
  const [recSearch, setRecSearch] = useState("");
  const [recItemFilter, setRecItemFilter] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [dashRes, itemsRes, recRes, distRes] = await Promise.allSettled([
        api.get("/stationery/dashboard"),
        api.get("/stationery/items"),
        api.get("/stationery/receipts"),
        api.get("/stationery/distributions"),
      ]);
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value.data || {});
      if (itemsRes.status === "fulfilled") setItems(itemsRes.value.data || []);
      if (recRes.status === "fulfilled") setReceipts(recRes.value.data || []);
      if (distRes.status === "fulfilled") setDistributions(distRes.value.data || []);
      if (dashRes.status === "rejected" && itemsRes.status === "rejected") {
        setGlobalMsg({ type: "error", msg: dashRes.reason?.response?.data?.message || "Cannot connect to backend. Make sure the server is running on port 5000." });
      }
    } catch (err) {
      setGlobalMsg({ type: "error", msg: err.message || "Failed to load data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const itemWiseStock = items.map((item) => {
    const totalRec = receipts.filter((r) => String(r.itemId) === String(item.id)).reduce((s, r) => s + Number(r.quantity || 0), 0);
    const totalDist = distributions.filter((d) => String(d.itemId) === String(item.id)).reduce((s, d) => s + Number(d.quantity || 0), 0);
    return { ...item, totalRec, totalDist, available: totalRec - totalDist };
  });

  const selReceiveItem = items.find((i) => String(i.id) === String(receiveForm.itemId));
  const selDistItem = items.find((i) => String(i.id) === String(distForm.itemId));
  const selDistItemStock = itemWiseStock.find((i) => String(i.id) === String(distForm.itemId));

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    setAddItemMsg({ type: "", msg: "" });
    const name = addItemForm.name.trim();
    if (!name) return setAddItemMsg({ type: "error", msg: "Item name is required." });
    const category = addItemForm.category === "__new__" ? addItemForm.newCategory.trim() : addItemForm.category;
    if (!category) return setAddItemMsg({ type: "error", msg: "Category is required." });
    const minStock = parseInt(addItemForm.minimumStock, 10);
    if (isNaN(minStock) || minStock < 0) return setAddItemMsg({ type: "error", msg: "Minimum stock must be 0 or more." });
    setAddItemLoading(true);
    try {
      const res = await api.post("/stationery/items", { name, category, unit: addItemForm.unit || "Piece", minimumStock: minStock });
      setAddItemMsg({ type: "success", msg: `"${res.data.item.name}" added successfully.` });
      setAddItemForm({ name: "", category: CATEGORIES[0], unit: "Piece", minimumStock: "0", newCategory: "" });
      setShowAddItem(false);
      await loadAll();
    } catch (err) {
      setAddItemMsg({ type: "error", msg: err.response?.data?.message || "Failed to add item." });
    } finally {
      setAddItemLoading(false);
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    setReceiveMsg({ type: "", msg: "" });
    if (!receiveForm.itemId) return setReceiveMsg({ type: "error", msg: "Please select an item." });
    const sup = receiveForm.supplierName.trim();
    if (!sup) return setReceiveMsg({ type: "error", msg: "Supplier name is required." });
    const qty = Number(receiveForm.quantity);
    if (!Number.isInteger(qty) || qty <= 0) return setReceiveMsg({ type: "error", msg: "Quantity must be a positive whole number." });
    if (!receiveForm.receivedDate) return setReceiveMsg({ type: "error", msg: "Date is required." });
    setReceiveLoading(true);
    try {
      const res = await api.post("/stationery/stock-in", { itemId: receiveForm.itemId, supplierName: sup, quantity: qty, receivedDate: receiveForm.receivedDate, invoiceNumber: receiveForm.invoiceNumber.trim(), remarks: receiveForm.remarks.trim() });
      setReceiveMsg({ type: "success", msg: `${qty} ${selReceiveItem?.unit || "units"} of "${selReceiveItem?.name}" received. Available stock now: ${res.data.currentStock}.` });
      setReceiveForm({ itemId: "", supplierName: "", quantity: "", receivedDate: today(), invoiceNumber: "", remarks: "" });
      await loadAll();
    } catch (err) {
      setReceiveMsg({ type: "error", msg: err.response?.data?.message || "Failed to record stock." });
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleDistSubmit = async (e) => {
    e.preventDefault();
    setDistMsg({ type: "", msg: "" });
    if (!distForm.itemId) return setDistMsg({ type: "error", msg: "Please select an item." });
    const name = distForm.studentName.trim();
    if (!name) return setDistMsg({ type: "error", msg: "Student name is required." });
    const qty = Number(distForm.quantity);
    if (!Number.isInteger(qty) || qty <= 0) return setDistMsg({ type: "error", msg: "Quantity must be a positive whole number." });
    if (!distForm.issueDate) return setDistMsg({ type: "error", msg: "Date is required." });
    if (selDistItemStock && qty > selDistItemStock.available) {
      return setDistMsg({ type: "error", msg: `Insufficient stock. Only ${selDistItemStock.available} ${selDistItem?.unit || "units"} available for "${selDistItem?.name}".` });
    }
    setDistLoading(true);
    try {
      const res = await api.post("/stationery/distribute", { itemId: distForm.itemId, studentName: name, admissionNumber: distForm.admissionNumber.trim(), quantity: qty, issueDate: distForm.issueDate, remarks: distForm.remarks.trim(), recipientType: "Student" });
      setDistMsg({ type: "success", msg: `${qty} ${selDistItem?.unit || "units"} of "${selDistItem?.name}" distributed to ${name}. Remaining stock: ${res.data.currentStock}.` });
      setDistForm({ itemId: "", studentName: "", admissionNumber: "", quantity: "", issueDate: today(), remarks: "" });
      await loadAll();
    } catch (err) {
      setDistMsg({ type: "error", msg: err.response?.data?.message || "Failed to distribute." });
    } finally {
      setDistLoading(false);
    }
  };

  const handleDeleteDist = async (record) => {
    if (!window.confirm(`Delete distribution of ${record.quantity} "${record.itemName}" to ${record.recipientName}?\n\nThis will restore ${record.quantity} unit(s) to available stock.`)) return;
    try {
      const res = await api.delete(`/stationery/distributions/${record.id}`);
      setGlobalMsg({ type: "success", msg: res.data.message });
      await loadAll();
    } catch (err) {
      setGlobalMsg({ type: "error", msg: err.response?.data?.message || "Failed to delete distribution." });
    }
  };

  const handleDeleteReceipt = async (receipt) => {
    if (!window.confirm(`Delete stock receipt of ${receipt.quantity} "${receipt.itemName}" from "${receipt.supplierName}"?\n\nThis cannot be undone. System will reject if it would make stock negative.`)) return;
    try {
      const res = await api.delete(`/stationery/receipts/${receipt.id}`);
      setGlobalMsg({ type: "success", msg: res.data.message });
      await loadAll();
    } catch (err) {
      setGlobalMsg({ type: "error", msg: err.response?.data?.message || "Failed to delete receipt." });
    }
  };

  const filteredDists = distributions.filter((d) => {
    const term = distSearch.toLowerCase();
    const matchSearch = !term || d.recipientName?.toLowerCase().includes(term) || d.recipientId?.toLowerCase().includes(term);
    const matchItem = !distItemFilter || String(d.itemId) === distItemFilter;
    return matchSearch && matchItem;
  });

  const filteredRecs = receipts.filter((r) => {
    const term = recSearch.toLowerCase();
    const matchSearch = !term || r.itemName?.toLowerCase().includes(term) || r.supplierName?.toLowerCase().includes(term);
    const matchItem = !recItemFilter || String(r.itemId) === recItemFilter;
    return matchSearch && matchItem;
  });

  if (loading) {
    return (
      <div className="page" style={{ display: "grid", placeContent: "center", minHeight: "400px", textAlign: "center" }}>
        <div className="loading-spinner" />
        <p style={{ marginTop: "12px", color: "#64748b" }}>Loading Stationery Management...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Item Types", value: dashboard.totalItems ?? items.length, icon: "☷", note: "Stationery varieties", accent: "#4f46e5", bg: "#eef2ff" },
    { label: "Total Received", value: dashboard.totalReceived ?? 0, icon: "📥", note: "All-time stock received", accent: "#059669", bg: "#ecfdf5" },
    { label: "Total Distributed", value: dashboard.totalDistributed ?? 0, icon: "📤", note: "Issued to students/staff", accent: "#7c3aed", bg: "#f5f3ff" },
    { label: "Available Stock", value: dashboard.totalAvailable ?? 0, icon: "▤", note: "Currently in store", accent: "#0284c7", bg: "#eff6ff" },
  ];

  return (
    <div className="page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            Stationery Management
          </span>
          <h2>Stationery Management</h2>
          <p>Complete stationery inventory — receive stock, distribute items, and track everything in one place.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="secondary-btn" onClick={loadAll}>↻ Refresh</button>
          <button className="primary-btn" onClick={() => setShowAddItem((v) => !v)}>
            {showAddItem ? "× Cancel" : "+ Add New Item"}
          </button>
        </div>
      </div>

      {/* GLOBAL ALERT */}
      <Alert type={globalMsg.type} msg={globalMsg.msg} onClose={() => setGlobalMsg({ type: "", msg: "" })} />

      {/* ── SUPER 60 BRAND BANNER ── */}
      <div
        style={{
          marginBottom: "28px",
          padding: "28px 32px",
          borderRadius: "18px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)",
          boxShadow: "0 12px 40px rgba(79, 70, 229, 0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "130px", height: "130px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-20px", left: "-20px", width: "90px", height: "90px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Eyebrow label */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
              padding: "4px 14px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#c7d2fe",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            <span>☷</span> Inventory Management System
          </div>

          {/* Main heading */}
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "clamp(22px, 4vw, 38px)",
              fontWeight: 900,
              letterSpacing: "-0.5px",
              color: "#ffffff",
              lineHeight: 1.1,
              textShadow: "0 2px 20px rgba(0,0,0,0.25)",
            }}
          >
            SUPER 60
            <span
              style={{
                display: "block",
                fontSize: "clamp(13px, 2.2vw, 20px)",
                fontWeight: 700,
                letterSpacing: "3px",
                color: "#a5b4fc",
                marginTop: "2px",
                textTransform: "uppercase",
              }}
            >
              Inventory Management
            </span>
          </h1>

          {/* Divider */}
          <div
            style={{
              width: "60px",
              height: "3px",
              margin: "12px auto",
              borderRadius: "2px",
              background: "linear-gradient(90deg, #818cf8, #c4b5fd)",
            }}
          />

          {/* Subtitle */}
          <p
            style={{
              margin: 0,
              fontSize: "clamp(11px, 1.5vw, 14px)",
              color: "#c7d2fe",
              fontWeight: 500,
              letterSpacing: "0.3px",
            }}
          >
            Stationery &amp; Student Distribution Management
          </p>
        </div>
      </div>

      {/* ── SECTION A: SUMMARY CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px", marginBottom: "28px" }}>
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ background: card.bg, border: `1px solid ${card.accent}33`, color: card.accent }}>
              {card.icon}
            </div>
            <div className="stat-information">
              <span>{card.label}</span>
              <h3>{Number(card.value || 0).toLocaleString("en-IN")}</h3>
              <small style={{ color: "#94a3b8", fontSize: "10px" }}>{card.note}</small>
            </div>
          </div>
        ))}
      </div>

      {/* ── ADD NEW ITEM (collapsible) ── */}
      {showAddItem && (
        <div className="form-card" style={{ marginBottom: "24px", border: "2px solid #e0e7ff", background: "linear-gradient(135deg,#fafbff,#f0f3ff)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0 }}>Register New Stationery Item</h3>
            <button className="delete-btn" style={{ fontSize: "12px" }} onClick={() => { setShowAddItem(false); setAddItemMsg({ type: "", msg: "" }); }}>
              Cancel
            </button>
          </div>
          <Alert type={addItemMsg.type} msg={addItemMsg.msg} onClose={() => setAddItemMsg({ type: "", msg: "" })} />
          <form onSubmit={handleAddItemSubmit} className="form-grid">
            <div className="form-group">
              <label htmlFor="ai-name">Item Name *</label>
              <input id="ai-name" type="text" value={addItemForm.name} onChange={(e) => setAddItemForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. T-Shirt, Notebook, ID Card" required />
            </div>
            <div className="form-group">
              <label htmlFor="ai-cat">Category *</label>
              <select id="ai-cat" value={addItemForm.category} onChange={(e) => setAddItemForm((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ Add New Category</option>
              </select>
            </div>
            {addItemForm.category === "__new__" && (
              <div className="form-group">
                <label htmlFor="ai-newcat">New Category Name *</label>
                <input id="ai-newcat" type="text" value={addItemForm.newCategory} onChange={(e) => setAddItemForm((p) => ({ ...p, newCategory: e.target.value }))} placeholder="e.g. Uniforms" />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="ai-unit">Unit</label>
              <select id="ai-unit" value={addItemForm.unit} onChange={(e) => setAddItemForm((p) => ({ ...p, unit: e.target.value }))}>
                {["Piece", "Set", "Box", "Ream", "Pack", "Pair", "Dozen", "Roll", "Bundle"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ai-min">Minimum Stock Level</label>
              <input id="ai-min" type="number" min="0" value={addItemForm.minimumStock} onChange={(e) => setAddItemForm((p) => ({ ...p, minimumStock: e.target.value }))} placeholder="e.g. 10" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="submit" className="primary-btn" disabled={addItemLoading}>{addItemLoading ? "Saving..." : "Save New Item"}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── SECTION B: RECEIVE STOCK ── */}
      <div className="form-card" style={{ marginBottom: "24px", border: "1.5px solid #d1fae5" }}>
        <SectionHeading icon="📥" title="Section B — Add / Receive Stock" subtitle="Record deliveries from suppliers. Stock updates instantly after submission." />
        <Alert type={receiveMsg.type} msg={receiveMsg.msg} onClose={() => setReceiveMsg({ type: "", msg: "" })} />
        {items.length === 0 && (
          <div style={{ padding: "14px 16px", background: "#fef3c7", borderRadius: "10px", marginBottom: "16px", color: "#92400e", fontSize: "13px" }}>
            ⚠ No stationery items found. Use <strong>"+ Add New Item"</strong> above to register items first.
          </div>
        )}
        <form onSubmit={handleReceiveSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="rec-item">Item Name *</label>
            <select id="rec-item" value={receiveForm.itemId} onChange={(e) => setReceiveForm((p) => ({ ...p, itemId: e.target.value }))} required>
              <option value="">— Select Item —</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name} — Available: {item.currentStock} {item.unit}</option>)}
            </select>
            {selReceiveItem && <small style={{ color: "#6b7280", fontSize: "11px" }}>Current: <strong>{selReceiveItem.currentStock} {selReceiveItem.unit}</strong> · Min: {selReceiveItem.minimumStock}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="rec-sup">Supplier Name *</label>
            <input id="rec-sup" type="text" value={receiveForm.supplierName} onChange={(e) => setReceiveForm((p) => ({ ...p, supplierName: e.target.value }))} placeholder="e.g. ABC Stationery Store" required />
          </div>
          <div className="form-group">
            <label htmlFor="rec-qty">Quantity Received *</label>
            <input id="rec-qty" type="number" min="1" step="1" value={receiveForm.quantity} onChange={(e) => setReceiveForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 50" required />
            {selReceiveItem && Number(receiveForm.quantity) > 0 && (
              <small style={{ color: "#059669", fontWeight: 600, fontSize: "11px" }}>
                Stock after receipt: {selReceiveItem.currentStock + Number(receiveForm.quantity)} {selReceiveItem.unit}
              </small>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="rec-date">Date *</label>
            <input id="rec-date" type="date" value={receiveForm.receivedDate} onChange={(e) => setReceiveForm((p) => ({ ...p, receivedDate: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label htmlFor="rec-inv">Invoice / Challan No.</label>
            <input id="rec-inv" type="text" value={receiveForm.invoiceNumber} onChange={(e) => setReceiveForm((p) => ({ ...p, invoiceNumber: e.target.value }))} placeholder="e.g. INV-2026-001" />
          </div>
          <div className="form-group">
            <label htmlFor="rec-rem">Remarks</label>
            <input id="rec-rem" type="text" value={receiveForm.remarks} onChange={(e) => setReceiveForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Optional notes" />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" className="primary-btn" disabled={receiveLoading || items.length === 0}>{receiveLoading ? "Recording..." : "✓ Record Received Stock"}</button>
            <button type="button" className="secondary-btn" onClick={() => setReceiveForm({ itemId: "", supplierName: "", quantity: "", receivedDate: today(), invoiceNumber: "", remarks: "" })}>Clear</button>
          </div>
        </form>
      </div>

      {/* ── SECTION C: DISTRIBUTE ── */}
      <div className="form-card" style={{ marginBottom: "24px", border: "1.5px solid #fde68a" }}>
        <SectionHeading icon="📤" title="Section C — Distribute Items to Students" subtitle="Issue stationery to students. Available stock is deducted automatically." />
        <Alert type={distMsg.type} msg={distMsg.msg} onClose={() => setDistMsg({ type: "", msg: "" })} />
        <form onSubmit={handleDistSubmit} className="form-grid">
          <div className="form-group">
            <label htmlFor="dist-name">Student Name *</label>
            <input id="dist-name" type="text" value={distForm.studentName} onChange={(e) => setDistForm((p) => ({ ...p, studentName: e.target.value }))} placeholder="e.g. Rahul Sharma" required />
          </div>
          <div className="form-group">
            <label htmlFor="dist-adm">Admission Number</label>
            <input id="dist-adm" type="text" value={distForm.admissionNumber} onChange={(e) => setDistForm((p) => ({ ...p, admissionNumber: e.target.value }))} placeholder="e.g. ADM001" />
          </div>
          <div className="form-group">
            <label htmlFor="dist-item">Item Name *</label>
            <select id="dist-item" value={distForm.itemId} onChange={(e) => setDistForm((p) => ({ ...p, itemId: e.target.value }))} required>
              <option value="">— Select Item —</option>
              {itemWiseStock.map((item) => (
                <option key={item.id} value={item.id} disabled={item.available <= 0}>
                  {item.name} — Available: {item.available} {item.unit}{item.available <= 0 ? " (Out of Stock)" : ""}
                </option>
              ))}
            </select>
            {selDistItemStock && (
              <small style={{ color: selDistItemStock.available <= 0 ? "#dc2626" : "#6b7280", fontSize: "11px" }}>
                Available: <strong>{selDistItemStock.available} {selDistItem?.unit}</strong>
              </small>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="dist-qty">Quantity Distributed *</label>
            <input id="dist-qty" type="number" min="1" step="1" value={distForm.quantity} onChange={(e) => setDistForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 2" required />
            {selDistItemStock && Number(distForm.quantity) > 0 && (() => {
              const qty = Number(distForm.quantity);
              const avail = selDistItemStock.available;
              return (
                <small style={{ color: qty > avail ? "#dc2626" : "#059669", fontWeight: 600, fontSize: "11px" }}>
                  {qty > avail ? `Only ${avail} available — cannot distribute ${qty}.` : `Remaining after: ${avail - qty} ${selDistItem?.unit}`}
                </small>
              );
            })()}
          </div>
          <div className="form-group">
            <label htmlFor="dist-date">Date *</label>
            <input id="dist-date" type="date" value={distForm.issueDate} onChange={(e) => setDistForm((p) => ({ ...p, issueDate: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label htmlFor="dist-rem">Reason</label>
            <input id="dist-rem" type="text" value={distForm.remarks} onChange={(e) => setDistForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="e.g. For mid-term exam" />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
            <button type="submit" className="primary-btn" disabled={distLoading} style={{ background: "linear-gradient(110deg,#059669,#047857)" }}>
              {distLoading ? "Processing..." : "✓ Distribute Items"}
            </button>
            <button type="button" className="secondary-btn" onClick={() => setDistForm({ itemId: "", studentName: "", admissionNumber: "", quantity: "", issueDate: today(), remarks: "" })}>Clear</button>
          </div>
        </form>
      </div>

      {/* ── SECTION D: ITEM-WISE STOCK TABLE ── */}
      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="table-header">
          <div>
            <h3>Item-Wise Stock Summary</h3>
            <p>Click <strong>View</strong> or the item name to see full receipt &amp; distribution history.</p>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th style={{ textAlign: "right" }}>Total Received</th>
                <th style={{ textAlign: "right" }}>Total Distributed</th>
                <th style={{ textAlign: "right" }}>Available Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {itemWiseStock.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No items registered. Click "+ Add New Item" above.</td></tr>
              ) : (
                itemWiseStock.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <button onClick={() => setSelectedItem(item)} style={{ background: "none", border: "none", padding: 0, color: "#4f46e5", fontWeight: 700, cursor: "pointer", fontSize: "12px", textDecoration: "underline dotted" }}>
                        {item.name}
                      </button>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.unit}</td>
                    <td style={{ textAlign: "right", color: "#059669", fontWeight: 700 }}>{item.totalRec}</td>
                    <td style={{ textAlign: "right", color: "#7c3aed", fontWeight: 700 }}>{item.totalDist}</td>
                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "14px", color: item.available === 0 ? "#dc2626" : item.available <= item.minimumStock ? "#d97706" : "#059669" }}>
                      {item.available}
                    </td>
                    <td>
                      {item.available === 0 ? <span className="badge danger">Out of Stock</span>
                        : item.available <= item.minimumStock ? <span className="badge warning">Low Stock</span>
                          : <span className="badge success">In Stock</span>}
                    </td>
                    <td>
                      <button className="primary-btn" style={{ minHeight: "30px", padding: "5px 12px", fontSize: "11px" }} onClick={() => setSelectedItem(item)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION E: DISTRIBUTION HISTORY ── */}
      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="table-header">
          <div>
            <h3>Distribution History</h3>
            <p>{filteredDists.length} of {distributions.length} records</p>
          </div>
          <div className="filters">
            <input type="text" placeholder="Search name or admission no." value={distSearch} onChange={(e) => setDistSearch(e.target.value)} style={{ width: "230px" }} />
            <select value={distItemFilter} onChange={(e) => setDistItemFilter(e.target.value)} style={{ width: "150px" }}>
              <option value="">All Items</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Admission No.</th>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDists.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">{distributions.length === 0 ? "No distribution records yet." : "No records match your filter."}</td></tr>
              ) : (
                filteredDists.map((d) => (
                  <tr key={d.id}>
                    <td>{d.issueDate}</td>
                    <td><strong>{d.recipientName}</strong></td>
                    <td>{d.recipientId || "—"}</td>
                    <td>
                      <span style={{ color: "#4f46e5", fontWeight: 600, cursor: "pointer", textDecoration: "underline dotted" }} onClick={() => setSelectedItem(items.find((i) => String(i.id) === String(d.itemId)))}>
                        {d.itemName}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", color: "#7c3aed", fontWeight: 700 }}>-{d.quantity}</td>
                    <td style={{ color: "#64748b" }}>{d.remarks || "—"}</td>
                    <td><button className="delete-btn" onClick={() => handleDeleteDist(d)}>Delete</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION F: RECEIPT HISTORY ── */}
      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="table-header">
          <div>
            <h3>Stock Receipt History</h3>
            <p>{filteredRecs.length} of {receipts.length} records · Safe delete — rejected if it would cause negative stock</p>
          </div>
          <div className="filters">
            <input type="text" placeholder="Search item or supplier..." value={recSearch} onChange={(e) => setRecSearch(e.target.value)} style={{ width: "210px" }} />
            <select value={recItemFilter} onChange={(e) => setRecItemFilter(e.target.value)} style={{ width: "150px" }}>
              <option value="">All Items</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Item Name</th>
                <th>Supplier</th>
                <th style={{ textAlign: "right" }}>Qty Received</th>
                <th>Invoice #</th>
                <th>Remarks</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecs.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">{receipts.length === 0 ? "No receipts yet. Use the form above." : "No records match."}</td></tr>
              ) : (
                filteredRecs.map((r) => (
                  <tr key={r.id}>
                    <td>{r.receivedDate}</td>
                    <td>
                      <span style={{ color: "#4f46e5", fontWeight: 600, cursor: "pointer", textDecoration: "underline dotted" }} onClick={() => setSelectedItem(items.find((i) => String(i.id) === String(r.itemId)))}>
                        {r.itemName}
                      </span>
                    </td>
                    <td>{r.supplierName}</td>
                    <td style={{ textAlign: "right", color: "#059669", fontWeight: 700 }}>+{r.quantity}</td>
                    <td style={{ color: "#64748b" }}>{r.invoiceNumber || "—"}</td>
                    <td style={{ color: "#64748b" }}>{r.remarks || "—"}</td>
                    <td><button className="delete-btn" onClick={() => handleDeleteReceipt(r)}>Delete</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEM DETAIL MODAL */}
      {selectedItem && (
        <ItemDetailModal
          item={itemWiseStock.find((i) => String(i.id) === String(selectedItem.id)) || selectedItem}
          receipts={receipts}
          distributions={distributions}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
