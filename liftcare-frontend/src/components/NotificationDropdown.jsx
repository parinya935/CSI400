// src/components/NotificationDropdown.jsx
export default function NotificationDropdown({
  notifications,
  onMarkRead,
  onClose,
}) {
  return (
    <div style={styles.dropdown}>
      <div style={styles.header}>
        <span>การแจ้งเตือน</span>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div style={styles.list}>
        {notifications.length === 0 ? (
          <p style={styles.empty}>ยังไม่มีการแจ้งเตือน</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} style={styles.item}>
              <div style={{ flex: 1 }}>
                <strong style={{ opacity: n.is_read ? 0.6 : 1 }}>
                  {n.title}
                </strong>
                <p style={styles.text}>{n.body}</p>
              </div>

              {!n.is_read && (
                <button
                  style={styles.readBtn}
                  onClick={() => onMarkRead(n.id)}
                >
                  ทำเป็นอ่านแล้ว
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  dropdown: {
    position: "absolute",
    top: 50,
    right: 10,
    width: 320,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 10px rgba(0,0,0,.15)",
    padding: 10,
    zIndex: 1000,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 600,
    paddingBottom: 8,
    borderBottom: "1px solid #e5e7eb",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 16,
    cursor: "pointer",
  },
  list: {
    maxHeight: 250,
    overflowY: "auto",
    paddingTop: 8,
  },
  empty: { color: "#6b7280", fontSize: 13, textAlign: "center" },
  item: {
    display: "flex",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  text: { margin: 0, fontSize: 12, color: "#6b7280" },
  readBtn: {
    background: "#e5e7eb",
    border: "none",
    borderRadius: 6,
    padding: "4px 6px",
    fontSize: 11,
    cursor: "pointer",
  },
};
