import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "./auth";
import Main from "./pages/main";
import Customers from "./pages/Customers";
import Buildings from "./pages/buildings";
import Elevators from "./pages/elevators";
import Technicians from "./pages/technician";
import Contracts from "./pages/Contracts";
import PricingSettings from "./pages/price";
import Quotations from "./pages/quotations";
import Invoices from "./pages/invoices";
import MaintenanceJobs from "./pages/Maintenance";
import MaintenanceTemplates from "./pages/maintenanceTemplates";
import MaintenancePlans from "./pages/maintenancePlans";
import PartsInventory from "./pages/Parts";
import Login from "./pages/login";
import Register from "./pages/register";

function App() {
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
          <Route
            path="/customers"
            element={
              <RequireAuth>
                <Customers />
              </RequireAuth>
            }
          />
          <Route
            path="/buildings"
            element={
              <RequireAuth>
                <Buildings />
              </RequireAuth>
            }
          />
          <Route
            path="/elevators"
            element={
              <RequireAuth>
                <Elevators />
              </RequireAuth>
            }
          />
          <Route
            path="/technicians"
            element={
              <RequireAuth>
                <Technicians />
              </RequireAuth>
            }
          />
          <Route
            path="/contracts"
            element={
              <RequireAuth>
                <Contracts />
              </RequireAuth>
            }
          />
          <Route
            path="/pricing"
            element={
              <RequireAuth>
                <PricingSettings />
              </RequireAuth>
            }
          />
          <Route
            path="/quotations"
            element={
              <RequireAuth>
                <Quotations />
              </RequireAuth>
            }
          />
          <Route
            path="/invoices"
            element={
              <RequireAuth>
                <Invoices />
              </RequireAuth>
            }
          />
          <Route
            path="/maintenance-jobs"
            element={
              <RequireAuth>
                <MaintenanceJobs />
              </RequireAuth>
            }
          />
          <Route
            path="/maintenance-templates"
            element={
              <RequireAuth>
                <MaintenanceTemplates />
              </RequireAuth>
            }
          />
          <Route
            path="/maintenance-plans"
            element={
              <RequireAuth>
                <MaintenancePlans />
              </RequireAuth>
            }
          />
          <Route
            path="/parts-inventory"
            element={
              <RequireAuth>
                <PartsInventory />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
