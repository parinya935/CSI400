// src/pages/technicians.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useRoleCheck, ProtectedPage } from "../hooks/useRoleCheck";
import { useAuth } from "../auth";
import FormModal from "../components/FormModal";

const emptyForm = {
  user_id: "",
  phone: "",
  specialty: "",
  notes: "",
};

const emptyRequestForm = {
  phone: "",
  specialty: "",
  notes: "",
  address: "",
  date_of_birth: "",
  age: "",
  experience: "",
  education: "",
};

export default function Technicians() {
  const api = useApi();
  const userRole = useRoleCheck();
  const { user } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [requestForm, setRequestForm] = useState(emptyRequestForm);
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      // สำหรับ admin เท่านั้นที่ต้องโหลดข้อมูลช่างและ users
      if (userRole === "admin") {
        const [ts, us] = await Promise.all([
          api.get("/api/technicians"),
          api.get("/api/technician-users"),
        ]);
        setTechnicians(ts || []);
        setUsers(us || []);
      }
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

  function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? String(age) : "";
  }

  function handleRequestChange(e) {
    const { name, value } = e.target;
    
    // ถ้าเปลี่ยน date_of_birth ให้คำนวณอายุอัตโนมัติ
    if (name === "date_of_birth") {
      const calculatedAge = calculateAge(value);
      setRequestForm((f) => ({ 
        ...f, 
        [name]: value,
        age: calculatedAge
      }));
    } else {
      setRequestForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // TODO: ส่ง request ไปยัง backend (จะทำทีหลัง)
      const payload = {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        ...requestForm,
      };
      
      // สำหรับตอนนี้แค่แสดง alert
      console.log("Technician Request:", payload);
      alert("ส่งคำขอสมัครเป็นช่างเรียบร้อยแล้ว รอการอนุมัติจากผู้ดูแลระบบ");
      
      setRequestForm(emptyRequestForm);
    } catch (err) {
      console.error(err);
      alert(err.message || "Error submitting request");
    } finally {
      setSubmitting(false);
    }
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
      setIsFormOpen(false);
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
    setIsFormOpen(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("ต้องการลบช่างคนนี้ใช่หรือไม่?")) return;
    try {
      await api.delete(`/api/technicians/${id}`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error deleting technician");
    }
  }

  function handleOpenForm() {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function renderUserName(user_id) {
    const u = users.find((x) => x.id === user_id);
    if (!u) return `User #${user_id}`;
    return `${u.name} (${u.email})`;
  }

  // สำหรับ technician: แสดงฟอร์มขอสมัคร
  if (userRole === "technician") {
    return (
      <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
        <div>
          {/* Header */}
          <div className="app-page-header">
            <h2 className="app-page-title">New Technician Request</h2>
            <p className="app-page-subtitle">
              กรอกข้อมูลเพื่อสมัครเป็นช่างเทคนิคในระบบ
            </p>
          </div>

          {error && <div className="card error">{error}</div>}

          {/* ฟอร์มขอสมัคร */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">ข้อมูลการสมัครเป็นช่างเทคนิค</div>
            </div>

            <form onSubmit={handleSubmitRequest}>
              {/* User Info (Read-only) */}
              <label>
                ชื่อผู้ใช้งาน
                <input
                  type="text"
                  className="input"
                  value={`${user?.name || ""} (${user?.email || ""})`}
                  disabled
                  style={{ backgroundColor: "#f5f5f5", color: "#6b7280" }}
                />
              </label>

              {/* Phone + Specialty */}
              <div className="form-row">
                <div>
                  <label>
                    Phone *
                    <input
                      type="tel"
                      name="phone"
                      value={requestForm.phone}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="เช่น 081-234-5678"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Specialty (ความเชี่ยวชาญ) *
                    <input
                      name="specialty"
                      value={requestForm.specialty}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="เช่น Mitsubishi, Inverter, Rescue..."
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Address */}
              <label>
                Address *
                <textarea
                  name="address"
                  value={requestForm.address}
                  onChange={handleRequestChange}
                  className="input"
                  rows={2}
                  placeholder="ที่อยู่"
                  required
                />
              </label>

              {/* Date of Birth + Age */}
              <div className="form-row">
                <div>
                  <label>
                    Date of Birth *
                    <input
                      type="date"
                      name="date_of_birth"
                      value={requestForm.date_of_birth}
                      onChange={handleRequestChange}
                      className="input"
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Age *
                    <input
                      type="number"
                      name="age"
                      value={requestForm.age}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="คำนวณอัตโนมัติจาก Date of Birth"
                      min={18}
                      max={100}
                      disabled
                      readOnly
                      required
                      style={{ backgroundColor: "#f5f5f5", color: "#6b7280", cursor: "not-allowed" }}
                    />
                  </label>
                </div>
              </div>

              {/* Experience + Education */}
              <div className="form-row">
                <div>
                  <label>
                    ประสบการณ์ทำงาน (ปี) *
                    <input
                      type="number"
                      name="experience"
                      value={requestForm.experience}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="จำนวนปี"
                      min={0}
                      required
                    />
                  </label>
                </div>
                <div>
                  <label>
                    วุฒิการศึกษา *
                    <input
                      name="education"
                      value={requestForm.education}
                      onChange={handleRequestChange}
                      className="input"
                      placeholder="เช่น ปวช., ปวส., ปริญญาตรี..."
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Notes */}
              <label>
                Notes
                <textarea
                  name="notes"
                  value={requestForm.notes}
                  onChange={handleRequestChange}
                  className="input"
                  rows={3}
                  placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
                />
              </label>

              {/* Submit Button */}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button
                  type="submit"
                  className="button primary"
                  disabled={submitting}
                >
                  {submitting ? "กำลังส่ง..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  // สำหรับ admin: แสดงหน้าจัดการช่างแบบเดิม
  return (
    <ProtectedPage userRole={userRole} allowedRoles={["admin", "technician"]}>
      <div>
        {/* Header */}
        <div className="app-page-header">
          <h2 className="app-page-title">Technicians</h2>
          <p className="app-page-subtitle">
            จัดการข้อมูลช่างเทคนิค และเชื่อมกับ User ของระบบ
          </p>
        </div>

        {error && <div className="card error">{error}</div>}

        {/* ปุ่มเพิ่มช่างใหม่ */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="button primary"
            onClick={handleOpenForm}
          >
            + Add New Technician
          </button>
        </div>

        {/* ฟอร์มในโมดัล */}
        <FormModal
          isOpen={isFormOpen}
          title={editingId ? "Edit Technician" : "New Technician"}
          onClose={handleCloseForm}
        >
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

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="button primary">
                {editingId ? "Save Changes" : "Create"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={handleCloseForm}
              >
                Cancel
              </button>
            </div>
          </form>
        </FormModal>

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
    </ProtectedPage>
  );
}