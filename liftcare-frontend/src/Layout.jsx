// src/Layout.jsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth";

export default function Layout() {
  const { user, logout } = useAuth();

  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

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
        <nav className="app-sidebar-menu">
          <Link
            to="/"
            className={
              "app-sidebar-link " +
              (isActive("/") ? "app-sidebar-link-active" : "")
            }
          >
            Dashboard
          </Link>
          <Link
            to="/customers"
            className={
              "app-sidebar-link " +
              (isActive("/customers") ? "app-sidebar-link-active" : "")
            }
          >
            Customers
          </Link>
          <Link
            to="/buildings"
            className={
              "app-sidebar-link " +
              (isActive("/buildings") ? "app-sidebar-link-active" : "")
            }
          >
            Buildings
          </Link>
          <Link
            to="/elevators"
            className={
              "app-sidebar-link " +
              (isActive("/elevators") ? "app-sidebar-link-active" : "")
            }
          >
            Elevators
          </Link>
          <Link
            to="/technicians"
            className={
              "app-sidebar-link " +
              (isActive("/technicians") ? "app-sidebar-link-active" : "")
            }
          >
            Technicians
          </Link>
          <Link
            to="/contracts"
            className={
              "app-sidebar-link " +
              (isActive("/contracts") ? "app-sidebar-link-active" : "")
            }
          >
            Contracts
          </Link>
          <Link
            to="/quotations"
            className={
              "app-sidebar-link " +
              (isActive("/quotations") ? "app-sidebar-link-active" : "")
            }
          >
            Quotations
          </Link>
          <Link
            to="/invoices"
            className={
              "app-sidebar-link " +
              (isActive("/invoices") ? "app-sidebar-link-active" : "")
            }
          >
            Invoices
          </Link>
          <Link
            to="/parts"
            className={
              "app-sidebar-link " +
              (isActive("/parts") ? "app-sidebar-link-active" : "")
            }
          >
            Parts
          </Link>
          <Link
            to="/maintenance/templates"
            className={
              "app-sidebar-link " +
              (isActive("/maintenance/templates")
                ? "app-sidebar-link-active"
                : "")
            }
          >
            Templates
          </Link>
          <Link
            to="/maintenance/plans"
            className={
              "app-sidebar-link " +
              (isActive("/maintenance/plans") ? "app-sidebar-link-active" : "")
            }
          >
            Plans
          </Link>
          <Link
            to="/maintenance/jobs"
            className={
              "app-sidebar-link " +
              (isActive("/maintenance/jobs") ? "app-sidebar-link-active" : "")
            }
          >
            Jobs
          </Link>
        </nav>
      </aside>

      {/* Right side */}
      <div className="app-content-wrapper">
        <header className="app-header">
          <div className="app-header-title">
            Welcome, {user?.name || "User"}
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
