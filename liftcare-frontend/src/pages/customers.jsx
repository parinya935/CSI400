// src/pages/Customers.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";

const emptyForm = {
  name: "",
  business_type: "",
  address: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
};

export default function Customers() {
  const api = useApi();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/api/customers");
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.business_type) {
      alert("กรุณากรอก Name และ Business Type");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/customers/${editingId}`, form);
      } else {
        await api.post("/api/customers", form);
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error saving customer");
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      business_type: c.business_type || "",
      address: c.address || "",
      contact_name: c.contact_name || "",
      contact_phone: c.contact_phone || "",
      contact_email: c.contact_email || "",
    });
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบลูกค้ารายนี้ใช่หรือไม่?")) return;
    try {
      await api.del(`/api/customers/${id}`);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting customer");
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <div>
      <h2>Customers</h2>

      {/* ฟอร์มสร้าง/แก้ไข */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">
          {editingId ? "Edit Customer" : "New Customer"}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Business Type *
                <input
                  name="business_type"
                  value={form.business_type}
                  onChange={handleChange}
                  className="input"
                  placeholder="office / mall / hospital / condo..."
                />
              </label>
            </div>
          </div>

          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input"
            />
          </label>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label>
                Contact Name
                <input
                  name="contact_name"
                  value={form.contact_name}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
            <div style={{ flex: 1 }}>
              <label>
                Contact Phone
                <input
                  name="contact_phone"
                  value={form.contact_phone}
                  onChange={handleChange}
                  className="input"
                />
              </label>
            </div>
          </div>

          <label>
            Contact Email
            <input
              name="contact_email"
              type="email"
              value={form.contact_email}
              onChange={handleChange}
              className="input"
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
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ตารางลูกค้า */}
      {loading && <div className="card">Loading...</div>}
      {error && <div className="card error">{error}</div>}
      {!loading && !error && (
        <div className="card">
          <div className="card-title">Customer List</div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Business Type</th>
                <th>Contact</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.business_type}</td>
                  <td>
                    {c.contact_name}
                    {c.contact_phone && ` (${c.contact_phone})`}
                    {c.contact_email && (
                      <>
                        <br />
                        <span style={{ fontSize: 12, color: "#6b7280" }}>
                          {c.contact_email}
                        </span>
                      </>
                    )}
                  </td>
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
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No customers.
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