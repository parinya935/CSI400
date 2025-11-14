import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useAuth } from "../auth";

export default function Main() {
  const api = useApi();
  const { user, logout } = useAuth();
  const [elevators, setElevators] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [e, a] = await Promise.all([api.get("/api/elevators"), api.get("/api/alerts")]);
      setElevators(e);
      setAlerts(a);
    } catch (e) {
      alert("โหลดข้อมูลไม่สำเร็จ: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:16 }}>
      <header style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:12 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20 }}>LiftCare — หน้าหลัก</h1>
          <div style={{ color:"#6b7280", fontSize:12 }}>
            {user?.name ? `ยินดีต้อนรับ, ${user.name}` : ""}
          </div>
        </div>
        <button onClick={logout} style={{ height:36, padding:"0 12px", border:"1px solid #e5e7eb", borderRadius:10, cursor:"pointer" }}>
          ออกจากระบบ
        </button>
      </header>

      <div style={{ display:"grid", gap:16, gridTemplateColumns:"repeat(auto-fit, minmax(320px,1fr))" }}>
        <section style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
            <h2 style={{ margin:0, fontSize:16 }}>สถานะลิฟต์</h2>
            <button onClick={load} style={btnPrimary}>Reload</button>
          </div>
          <div style={{ overflow:"auto", marginTop:10 }}>
            {loading ? <div style={{ color:"#6b7280" }}>กำลังโหลด...</div> : (
              <table style={table}>
                <thead><tr><th>ID</th><th>ชื่อ</th><th>อาคาร</th><th>ชั้น</th><th>โหลด</th><th>สถานะ</th></tr></thead>
                <tbody>
                  {elevators.map(el => (
                    <tr key={el.id}>
                      <td>{el.id}</td><td>{el.name}</td><td>{el.building}</td><td>{el.floor}</td><td>{el.load}%</td>
                      <td>{badge(el.state)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ margin:"0 0 10px", fontSize:16 }}>แจ้งเตือนล่าสุด</h2>
          <ul style={{ paddingLeft:16, margin:0 }}>
            {alerts.map(a => (
              <li key={a.id}>{new Date(a.at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })} - {a.title}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

const card = { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, boxShadow:"0 1px 2px rgba(0,0,0,.03)", padding:16 };
const btnPrimary = { height:36, padding:"0 12px", border:"1px solid #e5e7eb", borderRadius:10, cursor:"pointer", background:"#111", color:"#fff", fontWeight:600 };
const table = { width:"100%", borderCollapse:"collapse" };
function badge(state){
  const base = { padding:"4px 8px", borderRadius:999, color:"#fff", fontSize:12 };
  if (state === "operational") return <span style={{ ...base, background:"#059669" }}>ปกติ</span>;
  if (state === "maintenance") return <span style={{ ...base, background:"#b45309" }}>ซ่อม</span>;
  return <span style={{ ...base, background:"#b91c1c" }}>ขัดข้อง</span>;
}
