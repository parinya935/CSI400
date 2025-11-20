// src/components/NotificationDropdown.jsx
import { useEffect, useRef } from "react";

export default function NotificationDropdown({
  notifications = [],
  onMarkRead = () => {},
  onClose = () => {},
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={dropdownRef} style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>การแจ้งเตือน</span>
      </div>

      <div style={styles.divider} />

      {/* รายการแจ้งเตือน */}
      <div style={styles.list}>
        {notifications.length === 0 && (
          <div style={styles.empty}>ไม่มีการแจ้งเตือน</div>
        )}

        {notifications.map((n) => (
          <div key={n.id} style={styles.itemRow}>
            <span style={styles.message}>{n.body || n.title}</span>
          </div>
        ))}
      </div>

      {/* ⬇ Footer — ปุ่มอยู่ล่างสุด */}
      {notifications.some(n => !n.is_read) && (
        <div style={styles.footer}>
          <button
            style={styles.footerBtn}
            onClick={() => {
              notifications.forEach(n => {
                if (!n.is_read) onMarkRead(n.id);
              });
            }}
          >
            ทำเป็นอ่านแล้วทั้งหมด
          </button>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: 40,
    right: 0,
    width: 380,
    minHeight: 250,
    maxHeight: 480,
    display: "flex",
    flexDirection: "column",          // ★ ดัน footer ลงล่าง
    background: "#ffffff",
    borderRadius: 18,
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
    padding: "16px 18px 20px",
    zIndex: 999,
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#111827",
  },

  divider: {
    height: 1,
    background: "#e5e7eb",
    marginBottom: 12,
  },

  list: {
    flex: 1,                            // ★ ให้พื้นที่ส่วนนี้ยืดเต็ม
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  empty: {
    fontSize: 13,
    color: "#9ca3af",
    padding: "8px 4px",
  },

  itemRow: {
    padding: "10px 8px",
    borderRadius: 10,
    background: "#f9fafb",
  },

  message: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.4,
  },

  // ★ Footer อยู่ล่างสุดแน่นอน
  footer: {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
  },

  footerBtn: {
    fontSize: 14,
    padding: "8px 14px",
    borderRadius: 8,
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    cursor: "pointer",
  },
};
