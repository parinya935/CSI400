// src/pages/maintenance.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  elevator_id: "",
  job_type: "emergency", // planned / emergency
  technician_id: "",
  contract_id: "",
  ticket_id: "",
  remarks: "",
  total_labor_hours: "",
  labor_cost: "",
  parts_cost: "",
};

export default function MaintenanceJobs() {
  const api = useApi();
  const [jobs, setJobs] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [js, es, ts, cs] = await Promise.all([
        api.get("/api/maintenance/jobs"),
        api.get("/api/elevators"),
        api.get("/api/technicians"),
        api.get("/api/contracts"),
      ]);
      setJobs(js);
      setElevators(es);
      setTechnicians(ts);
      setContracts(cs);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load maintenance jobs");
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
    if (!form.elevator_id) {
      alert("กรุณาเลือกลิฟต์");
      return;
    }
    if (!form.job_type) {
      alert("กรุณาเลือกประเภทงาน");
      return;
    }

    const payload = {
      elevator_id: form.elevator_id,
      job_type: form.job_type,
      technician_id: form.technician_id
        ? Number(form.technician_id)
        : null,
      contract_id: form.contract_id ? Number(form.contract_id) : null,
      ticket_id: form.ticket_id || null,
      remarks: form.remarks || null,
      total_labor_hours: form.total_labor_hours
        ? Number(form.total_labor_hours)
        : 0,
      labor_cost: form.labor_cost ? Number(form.labor_cost) : 0,
      parts_cost: form.parts_cost ? Number(form.parts_cost) : 0,
    };

    try {
      if (editingId) {
        await api.put(`/api/maintenance/jobs/${editingId}`, payload);
      } else {
        await api.post("/api/maintenance/jobs", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving job");
    }
  }

  function handleEdit(job) {
    setEditingId(job.id);
    setForm({
      elevator_id: job.elevator_id,
      job_type: job.job_type || "emergency",
      technician_id: job.technician_id || "",
      contract_id: job.contract_id || "",
      ticket_id: job.ticket_id || "",
      remarks: job.remarks || "",
      total_labor_hours:
        job.total_labor_hours != null
          ? String(job.total_labor_hours)
          : "",
      labor_cost:
        job.labor_cost != null ? String(job.labor_cost) : "",
      parts_cost:
        job.parts_cost != null ? String(job.parts_cost) : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบงานนี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/maintenance/jobs/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting job");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function renderElevator(elevator_id) {
    const e = elevators.find((x) => x.id === elevator_id);
    if (!e) return elevator_id;
    return `${e.name} (${e.id})`;
  }

  function renderTechnicianName(technician_id) {
    const t = technicians.find((x) => x.id === technician_id);
    if (!t) return "";
    // backend join users.name เป็น technician_name ใน jobs อยู่แล้ว
    return t.name || `Tech #${technician_id}`;
  }

  function renderContractCode(contract_id) {
    if (!contract_id) return "-";
    const c = contracts.find((x) => x.id === contract_id);
    return c ? c.contract_code : `#${contract_id}`;
  }

  return (
    <div>
      <h2>Maintenance Jobs</h2>

      {/* ฟอร์มงานใหม่ / แก้ไข */}
      <div
        className="card"
        style={{ marginBottom: 16, padding: 16, border: "1px solid #ddd" }}
      >
        <h3>{editingId ? "Edit Job" : "New Job"}</h3>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          <label>
            Elevator *
            <select
              name="elevator_id"
              value={form.elevator_id}
              onChange={handleChange}
            >
              <option value="">-- select elevator --</option>
              {elevators.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.id})
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Job Type *
                <select
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                >
                  <option value="planned">Planned</option>
                  <option value="emergency">Emergency</option>
                </select>
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Technician
                <select
                  name="technician_id"
                  value={form.technician_id}
                  onChange={handleChange}
                >
                  <option value="">-- none --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || `Tech #${t.id}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <label>
            Contract
            <select
              name="contract_id"
              value={form.contract_id}
              onChange={handleChange}
            >
              <option value="">-- none --</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_code}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ticket ID (ถ้ามี)
            <input
              name="ticket_id"
              value={form.ticket_id}
              onChange={handleChange}
            />
          </label>

          <label>
            Remarks
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={3}
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Labor Hours
                <input
                  type="number"
                  step="0.25"
                  name="total_labor_hours"
                  value={form.total_labor_hours}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Labor Cost
                <input
                  type="number"
                  name="labor_cost"
                  value={form.labor_cost}
                  onChange={handleChange}
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Parts Cost
                <input
                  type="number"
                  name="parts_cost"
                  value={form.parts_cost}
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit">
              {editingId ? "Save Changes" : "Create Job"}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางประวัติงาน */}
      {loading && <div className="card">Loading...</div>}
      {error && <div className="card">{error}</div>}
      {!loading && !error && (
        <div
          className="card"
          style={{ padding: 16, border: "1px solid #ddd" }}
        >
          <h3>Job History</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Elevator</th>
                <th>Type</th>
                <th>Technician</th>
                <th>Contract</th>
                <th>Remarks</th>
                <th>Total Cost</th>
                <th>Created At</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>{renderElevator(j.elevator_id)}</td>
                  <td>{j.job_type}</td>
                  <td>{j.technician_name || ""}</td>
                  <td>{renderContractCode(j.contract_id)}</td>
                  <td>{j.remarks}</td>
                  <td>{j.total_cost}</td>
                  <td>{j.created_at?.slice(0, 19)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleEdit(j)}>Edit</button>{" "}
                    <button
                      style={{ color: "red" }}
                      onClick={() => handleDelete(j.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No jobs.
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