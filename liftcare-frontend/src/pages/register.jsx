import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../api";
import { useAuth } from "../auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const api = useApi();
  const { login } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("กำลังสมัครสมาชิก...");
    try {
      const data = await api.post("/auth/register", { name, email, password });
      login({ token: data.token, user: data.user });
      nav("/", { replace: true }); // สมัครเสร็จแล้วเด้งไปหน้าหลัก
    } catch (err) {
      setMsg("สมัครไม่สำเร็จ: " + err.message);
    }
  };

  return (
    <div style={styles.wrap}>
      <form onSubmit={onSubmit} style={styles.card}>
        <h1 style={styles.h1}>สมัครสมาชิกใหม่</h1>
        <input style={styles.input} placeholder="ชื่อ-นามสกุล" value={name} onChange={(e)=>setName(e.target.value)} />
        <input style={styles.input} placeholder="อีเมล" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="รหัสผ่าน" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button style={styles.btn}>สมัครสมาชิก</button>
        <p style={styles.muted}>{msg}</p>
        <p style={styles.muted}>
          มีบัญชีแล้ว?{" "}
          <a href="/login" style={{ color: "#111" }}>
            เข้าสู่ระบบ
          </a>
        </p>
      </form>
    </div>
  );
}

const styles = {
  wrap: { minHeight:"100svh", display:"grid", placeItems:"center", background:"#f7f7f7", padding:16 },
  card: { width:"100%", maxWidth:420, background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:20, boxShadow:"0 2px 10px rgba(0,0,0,.05)", display:"grid", gap:12 },
  h1: { margin:0, fontSize:20 },
  input: { height:40, border:"1px solid #e5e7eb", borderRadius:12, padding:"0 12px" },
  btn: { height:42, border:"1px solid #e5e7eb", borderRadius:12, background:"#111", color:"#fff", fontWeight:600, cursor:"pointer" },
  muted: { color:"#6b7280", fontSize:12, margin:0 },
};
