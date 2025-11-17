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

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [bs, cs] = await Promise.all([
        api.get("/api/buildings"),
        api.get("/api/customers"),
      ]);
      setBuildings(bs);
      setCustomers(cs);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load buildings");
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
    if (!form.customer_id || !form.name) {
      alert("กรุณาเลือก Customer และกรอก Building Name");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      name: form.name,
      address: form.address || null,
      building_type: form.building_type || null,
    };

    try {
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
    }
  }

  function handleEdit(b) {
    setEditingId(b.id);
    setForm({
      customer_id: b.customer_id,
      name: b.name || "",
      address: b.address || "",
      building_type: b.building_type || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบอาคารนี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/buildings/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting building");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Buildings</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Building" : "New Building"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          <label>
            Customer *
            <select
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- select customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (ID: {c.id})
                </option>
              ))}
            </select>
          </label>

          <label>
            Building Name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
            />
          </label>

          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input"
            />
          </label>

          <label>
            Building Type
            <input
              name="building_type"
              value={form.building_type}
              onChange={handleChange}
              className="input"
              placeholder="office / mall / hospital / condo ..."
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

      {loading && <div className="card">Loading...</div>}
      {error && <div className="card error">{error}</div>}
      {!loading && !error && (
        <div className="card">
          <div className="card-title">Building List</div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Address</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {buildings.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.customer_name || `#${b.customer_id}`}</td>
                  <td>{b.building_type}</td>
                  <td>{b.address}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-small"
                      onClick={() => handleEdit(b)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-small danger"
                      onClick={() => handleDelete(b.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {buildings.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No buildings.
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