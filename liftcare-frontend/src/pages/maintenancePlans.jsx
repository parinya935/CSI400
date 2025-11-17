import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  elevator_id: "",
  contract_id: "",
  template_id: "",
  frequency_per_year: "4",
  next_run_at: "",
  is_active: true,
};

export default function MaintenancePlans() {
  const api = useApi();

  const [plans, setPlans] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      setLoading(true);

      const [e, c, t, p] = await Promise.all([
        api.get("/api/elevators"),
        api.get("/api/contracts"),
        api.get("/api/maintenance/templates"),
        api.get("/api/maintenance/plans"),
      ]);

      setElevators(e);
      setContracts(c);
      setTemplates(t);
      setPlans(p);
    } catch (err) {
      setError(err.message || "Error loading data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.elevator_id || !form.template_id || !form.frequency_per_year) {
      alert("กรุณาเลือก Elevator, Template และใส่ Frequency per year");
      return;
    }

    const payload = {
      elevator_id: form.elevator_id,
      contract_id: form.contract_id || null,
      template_id: form.template_id,
      frequency_per_year: Number(form.frequency_per_year),
      next_run_at: form.next_run_at || null,
      is_active: form.is_active ? 1 : 0,
    };

    try {
      if (editingId) {
        await api.put(`/api/maintenance/plans/${editingId}`, payload);
      } else {
        await api.post("/api/maintenance/plans", payload);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadAll();
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  }

  function handleEdit(plan) {
    setEditingId(plan.id);
    setForm({
      elevator_id: plan.elevator_id,
      contract_id: plan.contract_id || "",
      template_id: plan.template_id || "",
      frequency_per_year:
        plan.frequency_per_year != null
          ? String(plan.frequency_per_year)
          : "4",
      next_run_at: plan.next_run_at ? plan.next_run_at.slice(0, 10) : "",
      is_active: plan.is_active ? true : false,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบแผนนี้หรือไม่?")) return;

    try {
      await api.del(`/api/maintenance/plans/${id}`);
      await loadAll();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Maintenance Plans</h2>

      {/* Form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Plan" : "New Maintenance Plan"}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          <label>
            Elevator *
            <select
              name="elevator_id"
              value={form.elevator_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- Select Elevator --</option>
              {elevators.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} - {e.name} ({e.building_name})
                </option>
              ))}
            </select>
          </label>

          <label>
            Contract
            <select
              name="contract_id"
              value={form.contract_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- None --</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_code} - {c.customer_name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Template *
            <select
              name="template_id"
              value={form.template_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Frequency per year *
            <input
              type="number"
              name="frequency_per_year"
              value={form.frequency_per_year}
              onChange={handleChange}
              className="input"
              min={1}
            />
          </label>

          <label>
            Next run at
            <input
              type="date"
              name="next_run_at"
              value={form.next_run_at}
              onChange={handleChange}
              className="input"
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="button primary">
              {editingId ? "Update" : "Create"}
            </button>

            {editingId && (
              <button type="button" className="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-title">Maintenance Plan List</div>

        {loading && <div>Loading...</div>}
        {error && <div className="card error">{error}</div>}

        {!loading && !error && (
          <table className="table">
            <thead>
              <tr>
                <th>Elevator</th>
                <th>Template</th>
                <th>Contract</th>
                <th>Freq/Year</th>
                <th>Next run</th>
                <th>Last run</th>
                <th>Active</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.elevator_id} - {p.elevator_name}{" "}
                    {p.building_name && `(${p.building_name})`}
                  </td>
                  <td>{p.template_name || p.template_id}</td>
                  <td>{p.contract_code || "-"}</td>
                  <td>{p.frequency_per_year}</td>
                  <td>{p.next_run_at?.slice(0, 10) || "-"}</td>
                  <td>{p.last_run_at?.slice(0, 10) || "-"}</td>
                  <td>{p.is_active ? "Yes" : "No"}</td>
                  <td>
                    <button
                      className="button"
                      onClick={() => handleEdit(p)}
                      style={{ marginRight: 4 }}
                    >
                      Edit
                    </button>
                    <button
                      className="button danger"
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No maintenance plans.
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