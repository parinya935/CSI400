// src/Layout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import NotificationBell from "./components/NotificationBell";
import NotificationDropdown from "./components/NotificationDropdown";
import { useState, useEffect } from "react";
import { useApi } from "./api";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const api = useApi();

  // state สำหรับ dropdown แจ้งเตือน
  const [openNoti, setOpenNoti] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // โหลด noti จาก backend ตอนเปิดหน้า layout
  useEffect(() => {
  // โหลดครั้งแรกตอนหน้า mount
  loadNotifications();

  // แล้วตั้ง interval ให้โหลดซ้ำทุก 10 วิ
  const id = setInterval(() => {
    loadNotifications();
  }, 10000); // 10000 ms = 10 วินาที

  // เคลียร์ตอน component ถูก unmount
  return () => clearInterval(id);
}, []);


  async function loadNotifications() {
    try {
      const data = await api.get("/api/notifications");
      // backend ส่งเป็น array อยู่แล้ว เช่น [{id, title, body, is_read, ...}]
      setNotifications(data);
    } catch (err) {
      console.error("โหลด notifications ล้มเหลว:", err);
    }
  }

  // จำนวนที่ยังไม่อ่าน
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // กดเพื่อ mark เป็นอ่านแล้ว
  async function onMarkRead(id) {
    try {
      // อัปเดต UI ก่อน ให้รู้สึกเร็ว
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, is_read: 1, read_at: new Date().toISOString() }
            : n
        )
      );

      // ยิงไป backend ให้เซ็ต is_read = 1
      await api.post(`/api/notifications/${id}/read`, {});
    } catch (err) {
      console.error("mark read error:", err);
    }
  }

    // ลบ noti ทีละอัน
  async function onDeleteNotification(id) {
    try {
      // อัปเดต UI ทันที
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      // ยิงไป backend เพื่อลบจริง
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.error("delete notification error:", err);
    }
  }


  const role = user?.role || "guest";

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  // -------- เมนูจัดเป็นหมวดหมู่ --------
  const sections = [
    {
      label: "แดชบอร์ด",
      items: [
        {
          path: "/",
          label: "ภาพรวมระบบ",
          roles: ["admin", "customer", "technician"],
        },
      ],
    },
    {
      label: "ข้อมูลหลัก (Master Data)",
      items: [
        { path: "/customers", label: "ลูกค้า", roles: ["admin"] },
        { path: "/buildings", label: "อาคาร", roles: ["admin"] },
        {
          path: "/elevators",
          label: "ลิฟต์",
          roles: ["admin", "customer"],
        },
        { path: "/technicians", label: "ช่าง", roles: ["admin", "technician"] },
      ],
    },
    {
      label: "งานซ่อมบำรุง (Maintenance)",
      items: [
        {
          path: "/maintenance/jobs",
          label: "ใบงานบำรุงรักษา",
          roles: ["admin"],
        },
        {
          path: "/maintenance/plans",
          label: "แผนบำรุงรักษา",
          roles: ["admin"],
        },
        {
          path: "/maintenance/templates",
          label: "เทมเพลตงานบำรุงรักษา",
          roles: ["admin"],
        },
        {
          path: "/parts",
          label: "อะไหล่ (Parts)",
          roles: ["admin"],
        },
      ],
    },
    {
      label: "สัญญา & การเงิน",
      items: [
        { path: "/contracts", label: "สัญญา", roles: ["admin"] },
        { path: "/quotations", label: "ใบเสนอราคา", roles: ["admin"] },
        { path: "/invoices", label: "ใบแจ้งหนี้", roles: ["admin"] },
        { path: "/pricing", label: "ราคา / แพ็กเกจ", roles: ["admin"] },
      ],
    },
    {
      label: "พอร์ทัล",
      items: [
        {
          path: "/technician-portal",
          label: "Technician Portal",
          roles: ["admin"],
        },
        {
          path: "/customer-portal",
          label: "Customer Portal",
          roles: ["admin", "customer"],
        },
      ],
    },
    {
      label: "การตั้งค่า",
      items: [
        {
          path: "/settings/account",
          label: "บัญชีผู้ใช้",
          roles: ["admin", "customer"],
        },
        {
          path: "/settings/password",
          label: "เปลี่ยนรหัสผ่าน",
          roles: ["admin", "customer"],
        },
      ],
    },
  ];

  // แสดงเฉพาะเมนูที่ตรงกับ role
  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">LiftCare</div>
        <div className="app-sidebar-role">
          <small>{role.toUpperCase()}</small>
        </div>

        {visibleSections.map((section) => (
          <div key={section.label} className="app-sidebar-section">
            <div className="app-sidebar-section-label">{section.label}</div>

            <nav className="app-sidebar-menu">
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    "app-sidebar-link " +
                    (isActive(item.path) ? "app-sidebar-link-active" : "")
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </aside>

      {/* ส่วนเนื้อหาขวา */}
      <div className="app-content-wrapper">
        <header className="app-header">
          <div className="app-header-title">
            ยินดีต้อนรับ, {user?.name || "ผู้ใช้"} ({user?.role || "guest"})
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* 🔔 ไอคอนระฆัง */}
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setOpenNoti(!openNoti)}
              />

              {openNoti && (
                <NotificationDropdown
                  notifications={notifications}
                  onMarkRead={onMarkRead}
                  onDelete={onDeleteNotification}   /* ⭐ เพิ่มตรงนี้ */
                  onClose={() => setOpenNoti(false)}
                />
              )}
            </div>

            {/* ปุ่มออกจากระบบ */}
            <button className="button secondary" onClick={logout}>
              ออกจากระบบ
            </button>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
