// src/components/NotificationsSection.jsx
export default function NotificationsSection({ notifications }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>การแจ้งเตือนล่าสุด</h2>
      {notifications.length === 0 ? (
        <p style={styles.muted}>ยังไม่มีการแจ้งเตือน</p>
      ) : (
        <ul style={styles.list}>
          {notifications.slice(0, 10).map((n) => (
            <li key={n.id} style={styles.item}>
              <div>
                <p style={{ margin: 0, fontWeight: n.is_read ? 400 : 600 }}>
                  {n.title || "(ไม่มีหัวข้อ)"}
                </p>
                <p style={styles.mutedSmall}>{n.body}</p>
              </div>
              <span style={styles.badge(n.is_read)}>
                {n.is_read ? "อ่านแล้ว" : "ใหม่"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const styles = {
  section: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,.06)",
  },
  sectionTitle: { margin: "0 0 8px", fontSize: 16 },
  muted: { color: "#6b7280", fontSize: 13, margin: 0 },
  mutedSmall: { color: "#6b7280", fontSize: 11, margin: 0 },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 8,
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    padding: 8,
    borderRadius: 10,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  badge: (isRead) => ({
    alignSelf: "flex-start",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11,
    background: isRead ? "#e5e7eb" : "#22c55e",
    color: isRead ? "#374151" : "#ffffff",
  }),
};
