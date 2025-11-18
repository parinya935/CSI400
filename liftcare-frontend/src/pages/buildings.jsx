// src/pages/buildings.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  customer_id: "",
  name: "",
  address: "",
  building_type: "",
};

export default function Buildings() {
  const api = useApi();

  const [buildings, setBuildings] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // โหลดข้อมูล buildings + customers
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [bs, cs] = await Promise.all([
        api.get("/api/buildings"),
        api.get("/api/customers"),
      ]);
      setBuildings(bs || []);
      setCustomers(cs || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.customer_id) {
      alert("กรุณาเลือกลูกค้า");
      return;
    }
    if (!form.name.trim()) {
      alert("กรุณากรอกชื่ออาคาร");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
      };

      if (editingId) {
        await api.put(`/api/buildings/${editingId}`, payload);
      } else {
        await api.post("/api/buildings", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving building");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(b) {
    setEditingId(b.id);
    setForm({
      customer_id: b.customer_id?.toString() || "",
      name: b.name || "",
      address: b.address || "",
      building_type: b.building_type || "",
    });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(b) {
    if (!window.confirm(`ลบอาคาร "${b.name}" หรือไม่?`)) return;
    try {
      await api.delete(`/api/buildings/${b.id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting building");
    }
  }

  function customerName(id) {
    const c = customers.find((x) => x.id === id);
    return c ? c.name : "-";
  }

  return (
    <div>
      {/* หัวหน้าเพจ */}
      <div className="app-page-header">
        <h2 className="app-page-title">Buildings</h2>
        <p className="app-page-subtitle">
          จัดการข้อมูลอาคารสำหรับลูกค้าแต่ละราย
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* ฟอร์มสร้าง / แก้ไข */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {editingId ? "Edit building" : "Add new building"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div>
              <label>
                Customer
                <select
                  name="customer_id"
                  className="input"
                  value={form.customer_id}
                  onChange={handleChange}
                >
                  <option value="">-- select customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <label>
                Building name
                <input
                  name="name"
                  className="input"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="เช่น Tower A"
                />
              </label>
            </div>
          </div>

          <label>
            Address
            <textarea
              name="address"
              className="input"
              rows={2}
              value={form.address}
              onChange={handleChange}
            />
          </label>

          <label>
            Building type
            <input
              name="building_type"
              className="input"
              value={form.building_type}
              onChange={handleChange}
              placeholder="เช่น Office / Condo / Hospital"
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="submit"
              className="button primary"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Add building"}
            </button>

            {editingId && (
              <button
                type="button"
                className="button secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางรายการอาคาร */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">All buildings</div>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Name</th>
                <th>Address</th>
                <th>Type</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{customerName(b.customer_id)}</td>
                  <td>{b.name}</td>
                  <td>{b.address}</td>
                  <td>{b.building_type}</td>
                  <td>
                    <button
                      type="button"
                      className="button sm secondary"
                      onClick={() => handleEdit(b)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type="button"
                      className="button sm danger"
                      onClick={() => handleDelete(b)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {buildings.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">
                    No buildings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}