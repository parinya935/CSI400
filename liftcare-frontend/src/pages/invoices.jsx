// src/pages/invoices.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  invoice_code: "",
  customer_id: "",
  quotation_id: "",
  total_amount: "",
  paid_amount: "",
  status: "unpaid", // unpaid / partial / paid / cancelled
  due_date: "",
};

export default function Invoices() {
  const api = useApi();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [inv, cs, qs] = await Promise.all([
        api.get("/api/invoices"),
        api.get("/api/customers"),
        api.get("/api/quotations"),
      ]);
      setInvoices(inv);
      setCustomers(cs);
      setQuotations(qs);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load invoices");
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
    if (!form.customer_id) {
      alert("กรุณาเลือกลูกค้า");
      return;
    }

    const payload = {
      invoice_code: form.invoice_code || undefined, // backend gen ถ้าไม่ส่ง
      customer_id: Number(form.customer_id),
      quotation_id: form.quotation_id ? Number(form.quotation_id) : null,
      total_amount: form.total_amount ? Number(form.total_amount) : 0,
      paid_amount: form.paid_amount ? Number(form.paid_amount) : 0,
      status: form.status || "unpaid",
      due_date: form.due_date || null,
    };

    try {
      if (editingId) {
        await api.put(`/api/invoices/${editingId}`, {
          invoice_code:
            payload.invoice_code || form.invoice_code || `I-${Date.now()}`,
          customer_id: payload.customer_id,
          quotation_id: payload.quotation_id,
          total_amount: payload.total_amount,
          paid_amount: payload.paid_amount,
          status: payload.status,
          due_date: payload.due_date,
        });
      } else {
        await api.post("/api/invoices", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving invoice");
    }
  }

  function handleEdit(i) {
    setEditingId(i.id);
    setForm({
      invoice_code: i.invoice_code || "",
      customer_id: i.customer_id,
      quotation_id: i.quotation_id || "",
      total_amount:
        i.total_amount != null ? String(i.total_amount) : "",
      paid_amount:
        i.paid_amount != null ? String(i.paid_amount) : "",
      status: i.status || "unpaid",
      due_date: i.due_date ? i.due_date.slice(0, 10) : "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบใบแจ้งหนี้นี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/invoices/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting invoice");
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

  function renderQuotationCode(quotation_id) {
    if (!quotation_id) return "-";
    const q = quotations.find((x) => x.id === quotation_id);
    return q ? q.quotation_code : `#${quotation_id}`;
  }

  return (
    <div>
      <h2>Invoices</h2>

      {/* ฟอร์ม */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Invoice" : "New Invoice"}
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

          <label>
            Quotation
            <select
              name="quotation_id"
              value={form.quotation_id}
              onChange={handleChange}
              className="input"
            >
              <option value="">-- none --</option>
              {quotations.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quotation_code} ({renderCustomerName(q.customer_id)})
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Invoice Code
                <input
                  name="invoice_code"
                  value={form.invoice_code}
                  onChange={handleChange}
                  className="input"
                  placeholder="ไม่กรอกให้ระบบ gen ให้อัตโนมัติ"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Due Date
                <input
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Total Amount
                <input
                  type="number"
                  name="total_amount"
                  value={form.total_amount}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Paid Amount
                <input
                  type="number"
                  name="paid_amount"
                  value={form.paid_amount}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="input"
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
          <div className="card-title">Invoice List</div>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Quotation</th>
                <th>Status</th>
                <th>Total / Paid</th>
                <th>Due</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.invoice_code}</td>
                  <td>{i.customer_name || renderCustomerName(i.customer_id)}</td>
                  <td>{renderQuotationCode(i.quotation_id)}</td>
                  <td>{i.status}</td>
                  <td>
                    {i.total_amount} / {i.paid_amount}
                  </td>
                  <td>{i.due_date?.slice(0, 10)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-small"
                      onClick={() => handleEdit(i)}
                    >
                      Edit
                    </button>{" "}
                    <button
                      className="btn-small danger"
                      onClick={() => handleDelete(i.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    No invoices.
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