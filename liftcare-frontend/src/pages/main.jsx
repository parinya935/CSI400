// src/pages/main.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useAuth } from "../auth";

import LayoutTopbar from "../components/LayoutTopbar.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import TicketsSection from "../components/TicketsSection.jsx";
// import NotificationsSection from "../components/NotificationsSection.jsx"; // ❌ ไม่ใช้แล้ว
import ElevatorsSection from "../components/ElevatorsSection.jsx";
import AlertsSection from "../components/AlertsSection.jsx";
import TicketModal from "../components/TicketModal.jsx";

export default function Main() {
  const api = useApi();
  const { user, logout } = useAuth();

  const [elevators, setElevators] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [msg, setMsg] = useState("");

  const [showTicketModal, setShowTicketModal] = useState(false);

  async function load() {
    try {
      setMsg("กำลังโหลดข้อมูล...");
      const [e, a, t, n, s] = await Promise.all([
        api.get("/api/elevators"),
        api.get("/api/alerts"),
        api.get("/api/tickets"),
        api.get("/api/notifications"),
        api.get("/api/dashboard/summary"),
      ]);
      setElevators(e);
      setAlerts(a);
      setTickets(t);
      setNotifications(n);
      setSummary(s);
      setMsg("");
    } catch (err) {
      console.error(err);
      setMsg("โหลดข้อมูลไม่สำเร็จ: " + err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openTicketModal() {
    setShowTicketModal(true);
  }

  async function handleTicketCreated() {
    setShowTicketModal(false);
    await load();
  }

  // ✅ ฟังก์ชันทำ notification เป็นอ่านแล้ว
  async function markNotificationRead(id) {
    try {
      await api.post(`/api/notifications/${id}/read`);
      await load();
    } catch (err) {
      console.error("Mark notification read failed:", err);
    }
  }

  return (
    <div style={styles.page}>
      {/* ✅ ส่ง notifications + onMarkRead ไปที่ Topbar */}
      <LayoutTopbar
        user={user}
        onRefresh={load}
        onLogout={logout}
        notifications={notifications}
        onMarkRead={markNotificationRead}
      />

      {msg && <p style={styles.muted}>{msg}</p>}

      <SummaryCards summary={summary} />

      {/* ✅ Tickets แถวบนให้กินเต็มแถว */}
      <div style={styles.grid1}>
        <TicketsSection tickets={tickets} onOpenCreate={openTicketModal} />
      </div>

      {/* ✅ แถวล่างยังเป็น 2 คอลัมน์เหมือนเดิม */}
      <div style={styles.grid2}>
        <ElevatorsSection elevators={elevators} />
        <AlertsSection alerts={alerts} />
      </div>

      {showTicketModal && (
        <TicketModal
          elevators={elevators}
          onClose={() => setShowTicketModal(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background: "#f3f4f6",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  // ✅ แถว tickets ให้มี 1 คอลัมน์
  grid1: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr)",
    gap: 16,
    marginBottom: 16,
  },
  // ✅ แถว elevators + alerts ยัง 2 คอลัมน์
  grid2: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
    gap: 16,
  },
  muted: { color: "#6b7280", fontSize: 13, margin: "0 0 8px" },
};
