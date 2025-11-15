// src/components/LayoutTopbar.jsx
export default function LayoutTopbar({ user, onRefresh, onLogout }) {
  return (
    <header style={styles.topbar}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20 }}>LiftCare Dashboard</h1>
        <p style={styles.muted}>
          ยินดีต้อนรับ, {user?.name} ({user?.role})
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button style={styles.secondaryBtn} onClick={onRefresh}>
          รีเฟรชข้อมูล
        </button>
        <button style={styles.dangerBtn} onClick={onLogout}>
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  muted: { color: "#6b7280", fontSize: 13, margin: 0 },
  secondaryBtn: {
    height: 36,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  dangerBtn: {
    height: 36,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid #ef4444",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
};
