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
  const [techUsers, setTechUsers] = useState([]); // users ที่ role = technician
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [ts, tus] = await Promise.all([
        api.get("/api/technicians"),
        api.get("/api/technician-users"),
      ]);
      setTechnicians(ts);
      setTechUsers(tus);
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
      await api.del(`/api/technicians/${id}`);
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
    const u = techUsers.find((x) => x.id === user_id);
    if (!u) return `User #${user_id}`;
    return `${u.name} (${u.email})`;
  }

  return (
    <div>
      <h2>Technicians</h2>

      {/* ฟอร์ม */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Technician" : "New Technician"}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          <label>
            User (Technician) *
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              className="input"
              disabled={!!editingId} // แก้ไขห้ามเปลี่ยน user_id
            >
              <option value="">-- select technician user --</option>
              {techUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input"
            />
          </label>

          <label>
            Specialty (ความเชี่ยวชาญ)
            <input
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              className="input"
              placeholder="เช่น Mitsubishi, Inverter, Emergency Rescue..."
            />
          </label>

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
            <button type="submit" className="btn-primary">
              {editingId ? "Save Changes" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-outline"
                onClick={handleCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ตาราง */}
      {loading && <div className="card">Loading...</div>}
      {error && <div className="card error">{error}</div>}
      {!loading && !error && (
        <div className="card">
          <div className="card-title">Technician List</div>
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Specialty</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {technicians.map((t) => (
                <tr key={t.id}>
                  <td>{renderUserName(t.user_id)}</td>
                  <td>{t.phone}</td>
                  <td>{t.specialty}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-small"
                      onClick={() => handleEdit(t)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-small danger"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {technicians.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No technicians.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}