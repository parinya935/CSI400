// src/components/LayoutTopbar.jsx
import { useState } from "react";

// SVG ระฆัง
function BellIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function SettingsIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      {/* วงล้อฟันเฟืองกลาง */}
      <circle cx="12" cy="12" r="3" />
      {/* ฟันเฟืองรอบนอก (แนว Heroicons/Feather style) */}
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.6 1.65 1.65 0 0010.51 3.1H11a2 2 0 012 0h.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.33.31.6.73.6 1.2v.09c0 .47-.27.89-.6 1.71z" />
    </svg>
  );
}


export default function LayoutTopbar({
  user,
  onRefresh,
  onLogout,
  notifications = [],
  onMarkRead = () => {},
}) {
  const [openNoti, setOpenNoti] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [hover, setHover] = useState(false);

  const unread = notifications.filter((n) => !n.is_read).length;

  const initial =
    (user?.name && user.name.trim()[0]?.toUpperCase()) ||
    (user?.email && user.email.trim()[0]?.toUpperCase()) ||
    "U";

  return (
    <header style={styles.topbar}>
      <h1 style={styles.title}>LiftCare Dashboard</h1>

      <div style={styles.right}>
        {/* ปุ่มรีเฟรช */}
        <button style={styles.btn} onClick={onRefresh}>
          รีเฟรช
        </button>

        {/* ระฆังแจ้งเตือน */}
        <div style={styles.bellWrap}>
          <div style={styles.bellIcon} onClick={() => setOpenNoti(!openNoti)}>
            <BellIcon size={24} />
            {unread > 0 && <span style={styles.badge}>{unread}</span>}
          </div>

          {openNoti && (
            <div style={styles.dropdown}>
              <h4 style={styles.dropdownTitle}>การแจ้งเตือน</h4>

              {notifications.length === 0 && (
                <p style={styles.empty}>ไม่มีการแจ้งเตือน</p>
              )}

              {notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  style={styles.item(n.is_read)}
                  onClick={() => onMarkRead(n.id)}
                >
                  <strong>{n.title || "ไม่มีหัวข้อ"}</strong>
                  <p style={styles.body}>{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* โปรไฟล์ + ปุ่มตั้งค่า (dropdown) */}
        <div style={styles.profileWrap}>
          <div style={styles.avatar}>{initial}</div>

          <div style={styles.profileText}>
            <div style={styles.profileName}>{user?.name || "ผู้ใช้งาน"}</div>
            <div style={styles.profileSub}>{user?.role || user?.email}</div>
          </div>

          <div style={styles.settingsWrap}>
  <button
    style={styles.settingsIconBtn}
    onClick={() => setOpenSettings(!openSettings)}
  >
    <SettingsIcon size={20} />
  </button>

  {openSettings && (
    <div style={styles.settingsDropdown}>
      <div style={styles.menuItem}>👤 ข้อมูลบัญชี</div>
      <div style={styles.menuItem}>🔐 เปลี่ยนรหัสผ่าน</div>
      <div style={styles.menuItem}>🎨 ธีม / โหมดมืด</div>
      <div style={styles.menuItem}>🔔 การแจ้งเตือน</div>
      <hr style={styles.hr} />
      <div style={styles.menuItemDanger} onClick={onLogout}>
        🚪 ออกจากระบบ
      </div>
    </div>
  )}
</div>

        </div>

        {/* ปุ่ม Logout เผื่ออยากแยกจากเมนูด้านบน */}
        {/* ถ้าใช้ออกจากระบบใน dropdown แล้ว ไม่อยากซ้ำ ตัดปุ่มนี้ออกได้ */}
        {/* 
        <button style={styles.logout} onClick={onLogout}>
          ออกจากระบบ
        </button> 
        */}
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    padding: "12px 16px",
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,.08)",
  },
  title: { margin: 0, fontSize: 18 },
  right: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  btn: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    cursor: "pointer",
    fontSize: 13,
  },

  bellWrap: { position: "relative" },
  bellIcon: {
    cursor: "pointer",
    display: "flex",
    position: "relative",
    color: "#374151",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 6px",
    fontSize: 10,
    fontWeight: "bold",
  },
  dropdown: {
    position: "absolute",
    top: 30,
    right: 0,
    width: 260,
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 4px 12px rgba(0,0,0,.15)",
    padding: 12,
    zIndex: 100,
  },
  dropdownTitle: { margin: "0 0 8px", fontSize: 14, fontWeight: 600 },
  empty: { color: "#6b7280", fontSize: 12 },

  item: (isRead) => ({
    padding: 8,
    borderRadius: 8,
    background: isRead ? "#f3f4f6" : "#e0f7e9",
    border: "1px solid #e5e7eb",
    marginBottom: 8,
    cursor: "pointer",
  }),
  body: { fontSize: 12, color: "#6b7280", margin: "4px 0 0" },

  // โปรไฟล์ + ตั้งค่า
  profileWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 8px",
    borderRadius: 999,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#111827",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 600,
  },
  profileText: {
    display: "flex",
    flexDirection: "column",
    maxWidth: 140,
  },
  profileName: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  profileSub: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
  },

  // dropdown ตั้งค่า
  settingsWrap: {
    position: "relative",
  },
  settingsIconBtn: {
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 0,               // ไม่ให้มีช่องว่าง text
  outline: "none",
  boxShadow: "none",
  transition: "background 0.2s ease, transform 0.1s ease",
},

  settingsIconBtnFocus: {
    outline: "none",
    boxShadow: "none",
  },

  settingsIconBtnHover: {
    background: "#f3f4f6",
    transform: "scale(1.05)",
  },

  settingsDropdown: {
    position: "absolute",
    top: 36,
    right: 0,
    width: 180,
    background: "#fff",
    borderRadius: 10,
    padding: "8px 0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 200,
  },
  menuItem: {
    padding: "8px 14px",
    fontSize: 14,
    cursor: "pointer",
    color: "#374151",
  },
  menuItemDanger: {
    padding: "8px 14px",
    fontSize: 14,
    cursor: "pointer",
    color: "#b91c1c",
    fontWeight: 600,
  },
  hr: {
    border: "none",
    borderTop: "1px solid #e5e7eb",
    margin: "6px 0",
  },

  logout: {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #fecaca",
    background: "#fee2e2",
    cursor: "pointer",
    fontSize: 13,
  },
};
