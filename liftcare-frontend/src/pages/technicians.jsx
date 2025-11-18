// src/pages/technicians.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  user_id: "",
  phone: "",
  specialty: "",
  notes: "",
};

export default function Technicians() {
  const api = useApi();
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]); // ดึงจาก /api/users ไม่สน role
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [ts, us] = await Promise.all([
        api.get("/api/technicians"),
        api.get("/api/technician-users"), // เดิมเคยเป็น /api/technician-users
      ]);
      setTechnicians(ts || []);
      setUsers(us || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load technicians");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.user_id) {
      alert("กรุณาเลือก User ที่เป็นช่าง");
      return;
    }

    const payload = {
      user_id: Number(form.user_id),
      phone: form.phone || null,
      specialty: form.specialty || null,
      notes: form.notes || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/technicians/${editingId}`, payload);
      } else {
        await api.post("/api/technicians", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving technician");
    }
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setForm({
      user_id: t.user_id,
      phone: t.phone || "",
      specialty: t.specialty || "",
      notes: t.notes || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบช่างคนนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/technicians/${id}`); // เดิมเป็น api.del
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting technician");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function renderUserName(user_id) {
    const u = users.find((x) => x.id === user_id);
    if (!u) return `User #${user_id}`;
    return `${u.name} (${u.email})`;
  }

  return (
    <div>
      {/* Header */}
      <div className="app-page-header">
        <h2 className="app-page-title">Technicians</h2>
        <p className="app-page-subtitle">
          จัดการข้อมูลช่างเทคนิค และเชื่อมกับ User ของระบบ
        </p>
      </div>

      {error && <div className="card error">{error}</div>}

      {/* ฟอร์ม */}
      <div className="card">
        <div className="card-title">
          {editingId ? "Edit Technician" : "New Technician"}
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            User (Technician) *
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              className="input"
              disabled={!!editingId} // แก้ไขห้ามเปลี่ยน user_id (เหมือนของเดิม)
            >
              <option value="">-- select user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <div>
              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div>
              <label>
                Specialty (ความเชี่ยวชาญ)
                <input
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  className="input"
                  placeholder="เช่น Mitsubishi, Inverter, Rescue..."
                />
              </label>
            </div>
          </div>

          <label>
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="input"
              rows={3}
            />
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit" className="button primary">
              {editingId ? "Save Changes" : "Create"}
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

      {/* ตาราง */}
      <div className="card">
        <div className="card-title">Technician List</div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Specialty</th>
                <th style={{ width: 140 }} />
              </tr>
            </thead>
            <tbody>
              {technicians.map((t) => (
                <tr key={t.id}>
                  <td>{renderUserName(t.user_id)}</td>
                  <td>{t.phone || "-"}</td>
                  <td>{t.specialty || "-"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="button sm secondary"
                      type="button"
                      onClick={() => handleEdit(t)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="button sm danger"
                      type="button"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {technicians.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">
                    No technicians.
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