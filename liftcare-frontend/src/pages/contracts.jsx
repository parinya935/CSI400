// src/pages/contracts.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  customer_id: "",
  contract_code: "",
  contract_type: "annual", // annual / per_call
  start_date: "",
  end_date: "",
  maintenance_times_per_year: "",
  included_items: "",
  excluded_items: "",
  notify_before_days: 30,
};

export default function Contracts() {
  const api = useApi();
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [cs, ct] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/contracts"),
      ]);
      setCustomers(cs);
      setContracts(ct);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load contracts");
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

    if (!form.customer_id || !form.contract_code || !form.contract_type) {
      alert("กรุณาเลือกลูกค้า และกรอก Contract Code / Type");
      return;
    }
    if (!form.start_date || !form.end_date) {
      alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดสัญญา");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      contract_code: form.contract_code,
      contract_type: form.contract_type,
      start_date: form.start_date,
      end_date: form.end_date,
      maintenance_times_per_year: form.maintenance_times_per_year
        ? Number(form.maintenance_times_per_year)
        : 0,
      included_items: form.included_items || null,
      excluded_items: form.excluded_items || null,
      notify_before_days: form.notify_before_days
        ? Number(form.notify_before_days)
        : 30,
    };

    try {
      if (editingId) {
        await api.put(`/api/contracts/${editingId}`, payload);
      } else {
        await api.post("/api/contracts", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving contract");
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({
      customer_id: c.customer_id,
      contract_code: c.contract_code || "",
      contract_type: c.contract_type || "annual",
      start_date: c.start_date ? c.start_date.slice(0, 10) : "",
      end_date: c.end_date ? c.end_date.slice(0, 10) : "",
      maintenance_times_per_year:
        c.maintenance_times_per_year != null
          ? String(c.maintenance_times_per_year)
          : "",
      included_items: c.included_items || "",
      excluded_items: c.excluded_items || "",
      notify_before_days:
        c.notify_before_days != null ? String(c.notify_before_days) : "30",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบสัญญานี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/contracts/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting contract");
    }
  }

  function handleCancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function renderCustomerName(customer_id) {
    const c = customers.find((x) => x.id === customer_id);
    return c ? c.name : `#${customer_id}`;
  }

  function renderTypeLabel(type) {
    if (type === "per_call") return "Per Call";
    if (type === "annual") return "Annual";
    return type;
  }

  return (
    <div>
      <h2>Contracts</h2>

      {/* ฟอร์มสร้าง/แก้ไขสัญญา */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Contract" : "New Contract"}
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
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Contract Code *
                <input
                  name="contract_code"
                  value={form.contract_code}
                  onChange={handleChange}
                  className="input"
                  placeholder="เช่น CT-2025-001"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Contract Type *
                <select
                  name="contract_type"
                  value={form.contract_type}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="annual">Annual (รายปี)</option>
                  <option value="per_call">Per Call (จ่ายต่อครั้ง)</option>
                </select>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Start Date *
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                End Date *
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Maintenance / Year
                <input
                  type="number"
                  name="maintenance_times_per_year"
                  value={form.maintenance_times_per_year}
                  onChange={handleChange}
                  className="input"
                  placeholder="เช่น 4 (ตรวจ 4 ครั้ง/ปี)"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Notify Before (days)
                <input
                  type="number"
                  name="notify_before_days"
                  value={form.notify_before_days}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <label>
            Included Items
            <textarea
              name="included_items"
              value={form.included_items}
              onChange={handleChange}
              className="input"
              rows={2}
              placeholder="รายการที่รวมในสัญญา เช่น ค่าแรง, ค่าเดินทาง, ตรวจเช็คตามแผน ฯลฯ"
            />
          </label>

          <label>
            Excluded Items
            <textarea
              name="excluded_items"
              value={form.excluded_items}
              onChange={handleChange}
              className="input"
              rows={2}
              placeholder="รายการที่ไม่รวม เช่น ค่าอะไหล่ใหญ่, ค่า Overhaul ฯลฯ"
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

      {/* ตารางสัญญา */}
      {loading && <div className="card">Loading...</div>}
      {error && <div className="card error">{error}</div>}
      {!loading && !error && (
        <div className="card">
          <div className="card-title">Contract List</div>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Period</th>
                <th>Maint./Year</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>{c.contract_code}</td>
                  <td>{c.customer_name || renderCustomerName(c.customer_id)}</td>
                  <td>{renderTypeLabel(c.contract_type)}</td>
                  <td>
                    {c.start_date?.slice(0, 10)} -{" "}
                    {c.end_date?.slice(0, 10)}
                  </td>
                  <td>{c.maintenance_times_per_year}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-small"
                      onClick={() => handleEdit(c)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-small danger"
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center" }}>
                    No contracts.
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