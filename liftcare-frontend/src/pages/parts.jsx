import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyPartForm = {
  part_code: "",
  name: "",
  brand: "",
  model: "",
  unit: "",
  cost_price: "",
  sell_price: "",
  min_stock: "",
};

const emptyAdjustForm = {
  part_id: "",
  change_qty: "",
  note: "",
};

// ถ้าสต๊อกน้อยกว่าค่านี้จะถือว่า "ใกล้หมด"
const LOW_STOCK_THRESHOLD = 5;

export default function PartsInventory() {
  const api = useApi();

  const [parts, setParts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [partForm, setPartForm] = useState(emptyPartForm);
  const [editingPartId, setEditingPartId] = useState(null);

  const [adjustForm, setAdjustForm] = useState(emptyAdjustForm);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [ps, ss, ms] = await Promise.all([
        api.get("/api/parts"),
        api.get("/api/parts/stocks"),
        api.get("/api/parts/movements"),
      ]);
      setParts(ps);
      setStocks(ss);
      setMovements(ms);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load parts data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // -----------------------------
  // Part form handlers
  // -----------------------------
  function handlePartChange(e) {
    const { name, value } = e.target;
    setPartForm((f) => ({ ...f, [name]: value }));
  }

  async function handlePartSubmit(e) {
    e.preventDefault();
    if (!partForm.part_code || !partForm.name) {
      alert("กรุณากรอก Part Code และ Name");
      return;
    }

    const payload = {
      part_code: partForm.part_code,
      name: partForm.name,
      brand: partForm.brand || null,
      model: partForm.model || null,
      unit: partForm.unit || "pcs",
      cost_price: partForm.cost_price ? Number(partForm.cost_price) : 0,
      sell_price: partForm.sell_price ? Number(partForm.sell_price) : 0,
      min_stock: partForm.min_stock ? Number(partForm.min_stock) : 0,
    };

    try {
      if (editingPartId) {
        await api.put(`/api/parts/${editingPartId}`, payload);
      } else {
        await api.post("/api/parts", payload);
      }
      setPartForm(emptyPartForm);
      setEditingPartId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving part");
    }
  }

  function handlePartEdit(part) {
    setEditingPartId(part.id);
    setPartForm({
      part_code: part.part_code || "",
      name: part.name || "",
      brand: part.brand || "",
      model: part.model || "",
      unit: part.unit || "",
      cost_price: part.cost_price != null ? String(part.cost_price) : "",
      sell_price: part.sell_price != null ? String(part.sell_price) : "",
      min_stock: part.min_stock != null ? String(part.min_stock) : "",
    });
  }

  async function handlePartDelete(id) {
    if (!window.confirm("ต้องการลบอะไหล่นี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/parts/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting part");
    }
  }

  function handlePartCancel() {
    setEditingPartId(null);
    setPartForm(emptyPartForm);
  }

  // -----------------------------
  // Adjust stock handlers
  // -----------------------------
  function handleAdjustChange(e) {
    const { name, value } = e.target;
    setAdjustForm((f) => ({ ...f, [name]: value }));
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault();
    if (!adjustForm.part_id) {
      alert("กรุณาเลือกอะไหล่ที่จะปรับสต๊อก");
      return;
    }
    if (adjustForm.change_qty === "") {
      alert("กรุณากรอกจำนวนที่ต้องการปรับ (+/-)");
      return;
    }

    const payload = {
      part_id: Number(adjustForm.part_id),
      change_qty: Number(adjustForm.change_qty),
      note: adjustForm.note || null,
    };

    try {
      await api.post("/api/parts/stocks/adjust", payload);
      setAdjustForm(emptyAdjustForm);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error adjusting stock");
    }
  }

  // -----------------------------
  // Helper functions
  // -----------------------------
  function getStockForPart(partId) {
    const s = stocks.find((x) => x.part_id === partId);
    return s ? s.quantity : 0;
  }

  function isLowStock(partId) {
    const qty = getStockForPart(partId);
    return qty <= LOW_STOCK_THRESHOLD;
  }

  return (
    <div>
      <h2>Spare Parts Inventory</h2>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      {/* ส่วนจัดการอะไหล่ */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        <h3>{editingPartId ? "Edit Part" : "New Part"}</h3>
        <form
          onSubmit={handlePartSubmit}
          style={{ display: "grid", gap: 8, maxWidth: 600 }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              Part Code *
              <input
                name="part_code"
                value={partForm.part_code}
                onChange={handlePartChange}
              />
            </label>
            <label style={{ flex: 2 }}>
              Name *
              <input
                name="name"
                value={partForm.name}
                onChange={handlePartChange}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              Brand
              <input
                name="brand"
                value={partForm.brand}
                onChange={handlePartChange}
              />
            </label>
            <label style={{ flex: 1 }}>
              Model
              <input
                name="model"
                value={partForm.model}
                onChange={handlePartChange}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ flex: 1 }}>
              Unit (หน่วย)
              <input
                name="unit"
                value={partForm.unit}
                onChange={handlePartChange}
                placeholder="เช่น pcs, set, ea"
              />
            </label>
            <label style={{ flex: 1 }}>
              Cost Price
              <input
                type="number"
                name="cost_price"
                value={partForm.cost_price}
                onChange={handlePartChange}
              />
            </label>
            <label style={{ flex: 1 }}>
              Sell Price
              <input
                type="number"
                name="sell_price"
                value={partForm.sell_price}
                onChange={handlePartChange}
              />
            </label>
          </div>

          <label>
            Min Stock
            <input
              type="number"
              name="min_stock"
              value={partForm.min_stock}
              onChange={handlePartChange}
              placeholder="จำนวนขั้นต่ำที่ควรมีในคลัง"
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">
              {editingPartId ? "Save Changes" : "Create Part"}
            </button>
            {editingPartId && (
              <button type="button" onClick={handlePartCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางอะไหล่ + สต๊อก */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        <h3>Parts List & Stock</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }} border="1">
          <thead>
            <tr>
              <th>Part Code</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Unit</th>
              <th>Cost</th>
              <th>Sell</th>
              <th>Stock Qty</th>
              <th>Min</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => {
              const qty = getStockForPart(p.id);
              return (
                <tr key={p.id}>
                  <td>{p.part_code}</td>
                  <td>{p.name}</td>
                  <td>{p.brand}</td>
                  <td>{p.model}</td>
                  <td>{p.unit}</td>
                  <td>{p.cost_price}</td>
                  <td>{p.sell_price}</td>
                  <td
                    style={{
                      color: qty <= (p.min_stock ?? 0) ? "red" : "inherit",
                      fontWeight: qty <= (p.min_stock ?? 0) ? "bold" : "normal",
                    }}
                  >
                    {qty}
                    {qty <= (p.min_stock ?? 0) && " (Low)"}
                  </td>
                  <td>{p.min_stock}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handlePartEdit(p)}>Edit</button>{" "}
                    <button
                      style={{ color: "red" }}
                      onClick={() => handlePartDelete(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* ... */}
          </tbody>
        </table>
      </div>

      {/* ฟอร์มปรับสต๊อก */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        <h3>Adjust Stock</h3>
        <form
          onSubmit={handleAdjustSubmit}
          style={{ display: "grid", gap: 8, maxWidth: 500 }}
        >
          <label>
            Part *
            <select
              name="part_id"
              value={adjustForm.part_id}
              onChange={handleAdjustChange}
            >
              <option value="">-- select part --</option>
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.part_code} - {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Change Qty (+ เติมสต๊อก / - ตัดสต๊อก) *
            <input
              type="number"
              name="change_qty"
              value={adjustForm.change_qty}
              onChange={handleAdjustChange}
            />
          </label>

          <label>
            Note
            <input
              name="note"
              value={adjustForm.note}
              onChange={handleAdjustChange}
            />
          </label>

          <button type="submit">Apply Adjustment</button>
        </form>
      </div>

      {/* ประวัติการเคลื่อนไหวสต๊อก */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: 16,
          borderRadius: 4,
        }}
      >
        <h3>Stock Movements</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }} border="1">
          <thead>
            <tr>
              <th>Part</th>
              <th>Change</th>
              <th>Note</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.part_code} - {m.part_name}
                </td>
                <td
                  style={{
                    color: m.change_qty < 0 ? "red" : "green",
                    fontWeight: "bold",
                  }}
                >
                  {m.change_qty}
                </td>
                <td>{m.note}</td>
                <td>{m.created_at?.slice(0, 19)}</td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No movements.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
