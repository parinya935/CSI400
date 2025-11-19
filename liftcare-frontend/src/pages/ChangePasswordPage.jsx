// src/pages/ChangePasswordPage.jsx
import { useState } from "react";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (!current || !next || !confirm) {
      setMsg("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (next.length < 8) {
      setMsg("รหัสผ่านใหม่ควรมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (next !== confirm) {
      setMsg("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }
    setMsg("ตัวอย่างหน้าจอเท่านั้น ยังไม่ได้เชื่อมต่อระบบเปลี่ยนรหัสผ่าน");
  }

  return (
    <div style={styles.page}>
      <div className="lift-card" style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>🔐 เปลี่ยนรหัสผ่าน</h2>
            <p style={styles.subtitle}>
              โปรดกำหนดรหัสผ่านใหม่เพื่อเพิ่มความปลอดภัยให้บัญชีของคุณ
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={styles.form}>
          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>รหัสผ่านปัจจุบัน</h3>

            <div style={styles.field}>
              <label style={styles.label}>รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                style={styles.input}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="กรอกรหัสผ่านเดิมของคุณ"
              />
            </div>
          </section>

          <section style={styles.section}>
            <h3 style={styles.sectionTitle}>รหัสผ่านใหม่</h3>

            <div style={styles.twoCols}>
              <div style={styles.field}>
                <label style={styles.label}>รหัสผ่านใหม่</label>
                <input
                  type="password"
                  style={styles.input}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร ผสมสัญลักษณ์"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  style={styles.input}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                />
              </div>
            </div>
          </section>

          <div style={styles.footerRow}>
            <button type="submit" style={styles.saveBtn}>
              💾 บันทึกการเปลี่ยนรหัสผ่าน
            </button>

            {msg && <p style={styles.msg}>{msg}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
    maxWidth: 780,
    margin: "0 auto",
  },
  card: {
    display: "grid",
    gap: 20,
  },
  headerRow: {
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 12,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 600 },
  subtitle: { margin: "6px 0 0", color: "#6b7280", fontSize: 13.5 },
  section: {
    padding: 16,
    borderRadius: 12,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    display: "grid",
    gap: 14,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
  },
  form: {
    display: "grid",
    gap: 20,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  label: { fontSize: 13, fontWeight: 600, color: "#374151" },

  /** ------------------------ Input Premium Style ------------------------- **/
  input: {
    height: 42,
    padding: "0 14px",
    fontSize: 14,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    transition: "all 0.25s ease",
    outline: "none",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },

  /* เพิ่มเอฟเฟกต์โฟกัสด้วย JS Dynamic */
  twoCols: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  },

  /** ------------------------ Save Button Premium ------------------------- **/
  saveBtn: {
    padding: "12px 20px",
    fontSize: 15,
    fontWeight: 600,
    borderRadius: 10,
    cursor: "pointer",
    color: "white",
    border: "none",
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    boxShadow: "0 4px 12px rgba(30,64,175,0.25)",
    transition: "all 0.25s ease",
  },

  msg: {
    fontSize: 13,
    color: "#6b7280",
  },
};
