import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./auth";
import "./App.css";
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
import Dashboard from "./pages/main";  // เดี๋ยวแก้ให้เป็น Dashboard จริงภายหลัง
import TechnicianPortal from "./pages/TechnicianPortal";
import CustomerPortal from "./pages/CustomerPortal";

// Middleware for login check
function RequireAuth({ children }) {
  const { user, loading, isAuthed } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthed) return <Login />;

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected with Layout */}
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
          <Route path="maintenance/templates" element={<MaintenanceTemplates />} />
          <Route path="maintenance/plans" element={<MaintenancePlans />} />
          <Route path="maintenance/jobs" element={<MaintenanceJobs />} />

          {/* Technician info */}
          <Route path="technician-portal" element={<TechnicianPortal />} />

          {/* Customer info */}
          <Route path="customer-portal" element={<CustomerPortal />} />
        </Route>

      </Routes>
    </BrowserRouter>
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import Login from "./pages/Login.jsx";
import Register from "./pages/register.jsx";
import Main from "./pages/main.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Main />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/settings/account" element={<AccountPage />} />
          <Route path="/settings/password" element={<ChangePasswordPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}