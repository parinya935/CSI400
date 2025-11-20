// src/Layout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import NotificationBell from "./components/NotificationBell";
import NotificationDropdown from "./components/NotificationDropdown";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // state สำหรับ dropdown แจ้งเตือน
  const [openNoti, setOpenNoti] = useState(false);

  // mock ตัวอย่างจัดเก็บแจ้งเตือน (ถ้ามีของจริงแล้วเดี๋ยวผมเชื่อมให้)
  // ถ้ายังไม่มี API จริง ใช้เป็น array ว่างไปก่อน
  const notifications = [];

  // จำนวนที่ยังไม่อ่าน
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // กดเพื่อ mark as read
  function onMarkRead(id) {
    console.log("mark as read:", id);
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
          roles: ["admin", "technician", "customer"],
        },
        { path: "/technicians", label: "ช่าง", roles: ["admin"] },
      ],
    },
    {
      label: "งานซ่อมบำรุง (Maintenance)",
      items: [
        {
          path: "/maintenance/jobs",
          label: "ใบงานบำรุงรักษา",
          roles: ["admin", "technician"],
        },
        {
          path: "/maintenance/plans",
          label: "แผนบำรุงรักษา",
          roles: ["admin", "technician"],
        },
        {
          path: "/maintenance/templates",
          label: "เทมเพลตงานบำรุงรักษา",
          roles: ["admin", "technician"],
        },
        {
          path: "/parts",
          label: "อะไหล่ (Parts)",
          roles: ["admin", "technician"],
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
          roles: ["admin", "technician"],
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
          roles: ["admin", "technician", "customer"],
        },
        {
          path: "/settings/password",
          label: "เปลี่ยนรหัสผ่าน",
          roles: ["admin", "technician", "customer"],
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
            <div style={{ position: "relative" }}>
              <NotificationBell
                unreadCount={unreadCount}
                onClick={() => setOpenNoti(!openNoti)}
              />

              {openNoti && (
                <NotificationDropdown
                  notifications={notifications}
                  onMarkRead={onMarkRead}
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
