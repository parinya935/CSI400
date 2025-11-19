import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import "./App.css";

// Pages (ใช้ชุดไหนให้ตรงกับชื่อไฟล์จริงในโปรเจกต์คุณนะ)
import Login from "./pages/login";
import Register from "./pages/register";

import Layout from "./Layout";
import Customers from "./pages/Customers";
import Buildings from "./pages/buildings";
import Elevators from "./pages/elevators";
import Technician from "./pages/technicians";
import Contracts from "./pages/Contracts";
import Quotations from "./pages/quotations";
import Invoices from "./pages/invoices";
import Pricing from "./pages/price";
import Parts from "./pages/Parts";
import MaintenanceTemplates from "./pages/maintenanceTemplates";
import MaintenancePlans from "./pages/maintenancePlans";
import MaintenanceJobs from "./pages/maintenanceJobs";
import Dashboard from "./pages/main";
import TechnicianPortal from "./pages/TechnicianPortal";
import CustomerPortal from "./pages/CustomerPortal";

import AccountPage from "./pages/AccountPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

// ----- Middleware ตรวจสอบ login -----
function RequireAuth({ children }) {
  const { user, loading, isAuthed } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthed) return <Login />;

  return children;
}

// ----- แอปหลัก -----
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes ที่หุ้มด้วย Layout */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />

            {/* Master Data */}
            <Route path="customers" element={<Customers />} />
            <Route path="buildings" element={<Buildings />} />
            <Route path="elevators" element={<Elevators />} />
            <Route path="technicians" element={<Technician />} />

            {/* Contracts & Finance */}
            <Route path="contracts" element={<Contracts />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="pricing" element={<Pricing />} />

            {/* Parts & Inventory */}
            <Route path="parts" element={<Parts />} />

            {/* Maintenance */}
            <Route
              path="maintenance/templates"
              element={<MaintenanceTemplates />}
            />
            <Route path="maintenance/plans" element={<MaintenancePlans />} />
            <Route path="maintenance/jobs" element={<MaintenanceJobs />} />

            {/* Technician / Customer Portal */}
            <Route path="technician-portal" element={<TechnicianPortal />} />
            <Route path="customer-portal" element={<CustomerPortal />} />

            {/* Settings */}
            <Route path="settings/account" element={<AccountPage />} />
            <Route path="settings/password" element={<ChangePasswordPage />} />
          </Route>

          {/* ถ้า path ไม่ตรงอะไรเลย → เด้งกลับหน้าแรก */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
