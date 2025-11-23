// src/pages/maintenanceJobs.jsx
import { useEffect, useState, useCallback } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";

const emptyForm = {
  elevator_id: "",
  job_type: "emergency", // planned / emergency
  technician_id: "",
  contract_id: "",
  ticket_id: "",
  remarks: "",
  total_labor_hours: "",
  labor_cost: 0,
  parts_cost: "",
};

export default function MaintenanceJobs() {
  const api = useApi();
  const userRole = useRoleCheck();

  const [jobs, setJobs] = useState([]);
  const [elevators, setElevators] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [laborRate, setLaborRate] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // โหลดข้อมูลทั้งหมด
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [jobsData, elevs, techs, cons, settings] = await Promise.all([
        api.get("/api/maintenance/jobs"),
        api.get("/api/elevators"),
        api.get("/api/technicians"),
        api.get("/api/contracts"),
        api.get("/api/pricing-settings"),
      ]);
      setJobs(jobsData || []);
      setElevators(elevs || []);
      setTechnicians(techs || []);
      setContracts(cons || []);
      setLaborRate(settings?.labor_rate_per_hour || 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load maintenance jobs");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "total_labor_hours") {
      const hours = Number(value || 0);
      const cost = hours * laborRate;
      setForm((f) => ({ ...f, total_labor_hours: value, labor_cost: cost }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.elevator_id) {
      alert("กรุณาเลือกลิฟต์");
      return;
    }

    const labor = form.labor_cost ? Number(form.labor_cost) : 0;
    const parts = form.parts_cost ? Number(form.parts_cost) : 0;
    const total = labor + parts;

    const payload = {
      elevator_id: form.elevator_id,
      job_type: form.job_type || "emergency",
      technician_id: form.technician_id
        ? Number(form.technician_id)
        : null,
      contract_id: form.contract_id
        ? Number(form.contract_id)
        : null,
      ticket_id: form.ticket_id || null,
      remarks: form.remarks || null,
      total_labor_hours: form.total_labor_hours
        ? Number(form.total_labor_hours)
        : 0,
      labor_cost: labor,
      parts_cost: parts,
      total_cost: total,
    };

    try {
      if (editingId) {
        await api.put(`/api/maintenance/jobs/${editingId}`, payload);
      } else {
        await api.post("/api/maintenance/jobs", payload);
      }
      setForm({ ...emptyForm, labor_cost: 0 });
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving maintenance job");
    }
  }

  function handleEdit(job) {
    const hours = Number(job.total_labor_hours || 0);
    const cost = hours * laborRate;
    setEditingId(job.id);
    setForm({
      elevator_id: job.elevator_id || "",
      job_type: job.job_type || "emergency",
      technician_id:
        job.technician_id != null ? String(job.technician_id) : "",
      contract_id:
        job.contract_id != null ? String(job.contract_id) : "",
      ticket_id: job.ticket_id || "",
      remarks: job.remarks || "",
      total_labor_hours:
        job.total_labor_hours != null
          ? String(job.total_labor_hours)
          : "",
      labor_cost: cost,
      parts_cost:
        job.parts_cost != null ? String(job.parts_cost) : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบงานบำรุงนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/maintenance/jobs/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting job");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm({ ...emptyForm, labor_cost: 0 });
  }

  function elevatorLabel(eid) {
    const e = elevators.find((x) => x.id === eid);
    if (!e) return eid;
    return `${e.id} - ${e.name || ""}`;
  }

  function technicianName(tid) {
    const t = technicians.find((x) => x.id === tid);
    return t ? t.name : tid ? `#${tid}` : "-";
  }

  function contractCode(cid) {
    const c = contracts.find((x) => x.id === cid);
    return c ? c.contract_code : cid ? `#${cid}` : "-";
  }

  function renderJobType(type) {
    if (!type) return "-";
    if (type === "planned") return "Planned";
    if (type === "emergency") return "Emergency";
    return type;
  }

  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* หัวหน้าเพจ */}
        <div className="app-page-header">
          <h2 className="app-page-title">Maintenance Jobs</h2>
          <p className="app-page-subtitle">
            บันทึกและติดตามงานบำรุง / ซ่อมฉุกเฉินของลิฟต์แต่ละตัว
          </p>
        </div>

        {error && <div className="card error">{error}</div>}

        {/* ฟอร์มสร้าง / แก้ไขงาน - เฉพาะ admin */}
        {userRole === "admin" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {editingId ? "Edit Job" : "New Job"}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
            {/* Elevator / Type */}
            <div className="form-row">
              <div>
                <label>
                  Elevator *
                  <select
                    name="elevator_id"
                    value={form.elevator_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- select elevator --</option>
                    {elevators.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.id} - {e.name}{" "}
                        {e.building_name ? `(${e.building_name})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Job Type
                  <select
                    name="job_type"
                    value={form.job_type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="planned">Planned</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Technician / Contract */}
            <div className="form-row">
              <div>
                <label>
                  Technician
                  <select
                    name="technician_id"
                    value={form.technician_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- not assigned --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  Contract
                  <select
                    name="contract_id"
                    value={form.contract_id}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">-- none --</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.contract_code} - {c.customer_name || ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Ticket ID */}
            <label>
              Ticket ID
              <input
                name="ticket_id"
                value={form.ticket_id}
                onChange={handleChange}
                className="input"
                placeholder="เชื่อมกับ ticket ถ้ามี"
              />
            </label>

            {/* Remarks */}
            <label>
              Remarks
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="input"
                rows={2}
                placeholder="รายละเอียดอาการ / งานที่ทำ"
              />
            </label>

            {/* เวลาและค่าใช้จ่าย */}
            <div className="form-row">
              <div>
                <label>
                  Labor Hours
                  <input
                    type="number"
                    step="0.25"
                    name="total_labor_hours"
                    value={form.total_labor_hours}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
              <div>
                <label>Labor Cost</label>
                <input
                  type="number"
                  name="labor_cost"
                  value={Number(form.labor_cost || 0).toFixed(2)}
                  className="input"
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>
                  Parts Cost
                  <input
                    type="number"
                    step="0.01"
                    name="parts_cost"
                    value={form.parts_cost}
                    onChange={handleChange}
                    className="input"
                  />
                </label>
              </div>
            </div>

            {/* ปุ่ม */}
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
        )}

        {/* ตารางรายการงานบำรุง */}
        {loading && <div className="card">Loading jobs...</div>}

        {!loading && !error && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Jobs List</div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Elevator</th>
                  <th>Technician</th>
                  <th>Type</th>
                  <th>Contract</th>
                  <th>Total Cost</th>
                  <th>Created</th>
                  {userRole === "admin" && <th style={{ width: 130 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>{j.id}</td>
                    <td>
                      {j.elevator_id}{" "}
                      {j.elevator_name ? `- ${j.elevator_name}` : ""}{" "}
                      {j.building_name ? `(${j.building_name})` : ""}
                    </td>
                    <td>{j.technician_name || technicianName(j.technician_id)}</td>
                    <td>{renderJobType(j.job_type)}</td>
                    <td>{j.contract_code || contractCode(j.contract_id)}</td>
                    <td>{j.total_cost}</td>
                    <td>
                      {j.created_at
                        ? new Date(j.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    {userRole === "admin" && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="button sm secondary"
                          onClick={() => handleEdit(j)}
                        >
                          Edit
                        </button>{" "}
                        <button
                          type="button"
                          className="button sm danger"
                          onClick={() => handleDelete(j.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      No jobs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}