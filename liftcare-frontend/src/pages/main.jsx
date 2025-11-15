// src/pages/main.jsx
import { useEffect, useState } from "react";
import { useApi } from "../api";
import { useAuth } from "../auth";

import LayoutTopbar from "../components/LayoutTopbar.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import TicketsSection from "../components/TicketsSection.jsx";
import NotificationsSection from "../components/NotificationsSection.jsx";
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

  return (
    <div style={styles.page}>
      <LayoutTopbar user={user} onRefresh={load} onLogout={logout} />

      {msg && <p style={styles.muted}>{msg}</p>}

      <SummaryCards summary={summary} />

      <div style={styles.grid2}>
        <TicketsSection tickets={tickets} onOpenCreate={openTicketModal} />
        <NotificationsSection notifications={notifications} />
      </div>

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
  grid2: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
    gap: 16,
  },
  muted: { color: "#6b7280", fontSize: 13, margin: "0 0 8px" },
};
