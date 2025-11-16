// src/pages/ChangePasswordPage.jsx
import { useState } from "react";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    if (next !== confirm) {
      setMsg("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    // TODO: เรียก API เปลี่ยนรหัสผ่านจริง ๆ
    setMsg("ตัวอย่างหน้าจอเท่านั้น ยังไม่ได้เชื่อมต่อระบบเปลี่ยนรหัสผ่าน");
  }

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={onSubmit}>
        <h2 style={styles.title}>🔐 เปลี่ยนรหัสผ่าน</h2>
        <p style={styles.muted}>กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่</p>

        <label style={styles.label}>รหัสผ่านปัจจุบัน</label>
        <input
          type="password"
          style={styles.input}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />

        <label style={styles.label}>รหัสผ่านใหม่</label>
        <input
          type="password"
          style={styles.input}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />

        <label style={styles.label}>ยืนยันรหัสผ่านใหม่</label>
        <input
          type="password"
          style={styles.input}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button type="submit" style={styles.btn}>
          บันทึกการเปลี่ยนรหัสผ่าน
        </button>

        {msg && <p style={styles.msg}>{msg}</p>}
      </form>
    </div>
  );
}

const styles = {
  page: { padding: 16 },
  card: {
    maxWidth: 520,
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 1px 4px rgba(0,0,0,.08)",
    display: "grid",
    gap: 8,
  },
  title: { margin: 0, fontSize: 20 },
  muted: { margin: "4px 0 8px", color: "#6b7280", fontSize: 13 },
  label: { fontSize: 13 },
  input: {
    height: 40,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: "0 10px",
  },
  btn: {
    marginTop: 8,
    height: 42,
    borderRadius: 12,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  msg: { fontSize: 13, color: "#6b7280", margin: "4px 0 0" },
};
