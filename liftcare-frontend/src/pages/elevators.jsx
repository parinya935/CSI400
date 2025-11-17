// src/pages/elevators.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  id: "",
  name: "",
  building_id: "",
  brand: "",
  model: "",
  install_year: "",
  install_location: "",
  capacity: "",
  state: "normal",
  last_maintenance_at: "",
  next_maintenance_at: "",
};

export default function Elevators() {
  const api = useApi();
  const [elevators, setElevators] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [es, bs] = await Promise.all([
        api.get("/api/elevators"),
        api.get("/api/buildings"),
      ]);
      setElevators(es);
      setBuildings(bs);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load elevators");
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

    if (!form.id && !editingId) {
      alert("กรุณากรอก Elevator ID");
      return;
    }
    if (!form.name || !form.building_id) {
      alert("กรุณากรอก Name และเลือก Building");
      return;
    }

    const payload = {
      id: editingId ? undefined : form.id, // เวลาแก้ไขไม่ต้องส่ง id
      name: form.name,
      building_id: Number(form.building_id),
      brand: form.brand || null,
      model: form.model || null,
      install_year: form.install_year || null,
      install_location: form.install_location || null,
      capacity: form.capacity || null,
      state: form.state || "operational",
      last_maintenance_at: form.last_maintenance_at || null,
      next_maintenance_at: form.next_maintenance_at || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/elevators/${editingId}`, payload);
      } else {
        await api.post("/api/elevators", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving elevator");
    }
  }

  function handleEdit(elev) {
    setEditingId(elev.id);
    setForm({
      id: elev.id,
      name: elev.name || "",
      building_id: elev.building_id,
      brand: elev.brand || "",
      model: elev.model || "",
      install_year: elev.install_year || "",
      install_location: elev.install_location || "",
      capacity: elev.capacity || "",
      state: elev.state || "operational",
      last_maintenance_at: elev.last_maintenance_at
        ? elev.last_maintenance_at.slice(0, 10)
        : "",
      next_maintenance_at: elev.next_maintenance_at
        ? elev.next_maintenance_at.slice(0, 10)
        : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบลิฟต์นี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/elevators/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting elevator");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Elevators</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Elevator" : "New Elevator"}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          {!editingId && (
            <label>
              Elevator ID *
              <input
                name="id"
                value={form.id}
                onChange={handleChange}
                className="input"
                placeholder="เช่น E01"
              />
            </label>
          )}

          <label>
            Name *
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input"
            />
          </label>

          <label>
            Building *
            <select
              name="building_id"
              value={form.building_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- select building --</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (ID: {b.id})
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Brand
                <input
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Model
                <input
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Install Year
                <input
                  type="number"
                  name="install_year"
                  value={form.install_year}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Capacity (kg)
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <label>
            Install Location
            <input
              name="install_location"
              value={form.install_location}
              onChange={handleChange}
              className="input"
            />
          </label>

          <label>
            State
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              className="input"
            >
              <option value="normal">Normal</option>
              <option value="fault">Fault</option>
              <option value="in_maintenance">In Maintenance</option>
              <option value="waiting_maintenance">Waiting Maintenance</option>
              <option value="waiting_quotation">Waiting Quotation</option>
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Last Maintenance
                <input
                  type="date"
                  name="last_maintenance_at"
                  value={form.last_maintenance_at}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Next Maintenance
                <input
                  type="date"
                  name="next_maintenance_at"
                  value={form.next_maintenance_at}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

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
          <div className="card-title">Elevator List</div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Building</th>
                <th>Brand/Model</th>
                <th>State</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {elevators.map((e) => (
                <tr key={e.id}>
                  <td>{e.id}</td>
                  <td>{e.name}</td>
                  <td>{e.building_name || `#${e.building_id}`}</td>
                  <td>
                    {e.brand} {e.model}
                  </td>
                  <td>{e.state}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn-small" onClick={() => handleEdit(e)}>
                      Edit
                    </button>{" "}
                    <button
                      className="btn-small danger"
                      onClick={() => handleDelete(e.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {elevators.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    No elevators.
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
