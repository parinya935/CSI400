// src/Layout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout() {
  const { user, logout } = useAuth();

  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  // -------- Menu Items by Role --------
  const getMenuItems = () => {
    const baseItems = [
      { path: "/", label: "Dashboard", roles: ["admin", "customer", "technician"] },
    ];

    const adminItems = [
      { path: "/customers", label: "Customers", roles: ["admin"] },
      { path: "/buildings", label: "Buildings", roles: ["admin"] },
      { path: "/elevators", label: "Elevators", roles: ["admin"] },
      { path: "/technicians", label: "Technicians", roles: ["admin"] },
      { path: "/contracts", label: "Contracts", roles: ["admin"] },
      { path: "/quotations", label: "Quotations", roles: ["admin"] },
      { path: "/invoices", label: "Invoices", roles: ["admin"] },
      { path: "/pricing", label: "Pricing", roles: ["admin"] },
    ];

    const techItems = [
      { path: "/maintenance/templates", label: "Templates", roles: ["admin", "technician"] },
      { path: "/maintenance/plans", label: "Plans", roles: ["admin", "technician"] },
      { path: "/maintenance/jobs", label: "Jobs", roles: ["admin", "technician"] },
      { path: "/parts", label: "Parts", roles: ["admin", "technician"] },
    ];

    const customerItems = [
      { path: "/customer-portal", label: "My Portal", roles: ["customer"] },
    ];

    const technicianItems = [
      { path: "/technician-portal", label: "My Jobs", roles: ["technician"] },
    ];

    let items = [...baseItems];

    if (user?.role === "admin") {
      items = [...items, ...adminItems, ...techItems];
    } else if (user?.role === "technician") {
      items = [
        ...items,
        ...technicianItems,
        { path: "/maintenance/templates", label: "Templates", roles: ["technician"] },
        { path: "/maintenance/plans", label: "Plans", roles: ["technician"] },
        { path: "/maintenance/jobs", label: "Jobs", roles: ["technician"] },
        { path: "/parts", label: "Parts", roles: ["technician"] },
      ];
    } else if (user?.role === "customer") {
      items = [...items, ...customerItems];
    }

    return items;
  };

  const menuItems = getMenuItems();

  const styles = {
    container: {
      display: "flex",
      height: "100vh",
      background: "#D3D3D3",
      fontFamily: "sans-serif",
    },
    sidebar: {
      width: "240px",
      background: "#003366",
      color: "white",
      padding: "20px 0",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    menuItem: {
      padding: "12px 20px",
      color: "white",
      textDecoration: "none",
      fontSize: "15px",
      cursor: "pointer",
    },
    menuItemHover: {
      background: "#004080",
    },
    header: {
      height: "60px",
      background: "#003366",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    content: {
      flex: 1,
      padding: "20px",
      overflowY: "auto",
    },
    title: {
      fontSize: "18px",
      fontWeight: "600",
    },
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="app-sidebar-logo">LiftCare</div>
        <div className="app-sidebar-role">
          <small>{user?.role?.toUpperCase()}</small>
        </div>
        <nav className="app-sidebar-menu">
          {menuItems.map((item) => (
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
      </aside>

      {/* Right side */}
      <div className="app-content-wrapper">
        <header className="app-header">
          <div className="app-header-title">
            Welcome, {user?.name || "User"} ({user?.role || "guest"})
          </div>
          <button className="button secondary" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}