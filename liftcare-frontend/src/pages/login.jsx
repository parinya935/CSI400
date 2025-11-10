import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../api";
import { useAuth } from "../auth";

export default function Login() {
  const [email, setEmail] = useState("admin@liftcare.local");
  const [password, setPassword] = useState("admin123");
  const [msg, setMsg] = useState("");
  const api = useApi();
  const { login, isAuthed } = useAuth();
  const nav = useNavigate();

  // ถ้าเข้าสู่ระบบแล้ว ให้ไปหน้า main ทันที
  if (isAuthed) nav("/");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("กำลังเข้าสู่ระบบ...");
    try {
      const data = await api.post("/auth/login", { email, password });
      login({ token: data.token, user: data.user });
      nav("/", { replace: true });
    } catch (e) {
      setMsg("ล็อกอินไม่สำเร็จ: " + e.message);
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h1 style={styles.h1}>LiftCare — Login</h1>
        <p style={styles.muted}>เข้าสู่ระบบเพื่อเข้าหน้าหลัก</p>
        <input
          style={styles.input}
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button style={styles.btn} type="submit">
          เข้าสู่ระบบ
        </button>
        <p style={styles.muted}>{msg}</p>
        <p style={styles.muted}>
          ยังไม่มีบัญชี?{" "}
          <a href="/register" style={{ color: "#111" }}>
            สมัครสมาชิก
          </a>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100svh",
    display: "grid",
    placeItems: "center",
    background: "#f7f7f7",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,.05)",
    display: "grid",
    gap: 12,
  },
  h1: { margin: 0, fontSize: 20 },
  input: {
    height: 40,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "0 12px",
  },
  btn: {
    height: 42,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    background: "#111",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  muted: { color: "#6b7280", fontSize: 12, margin: 0 },
};
