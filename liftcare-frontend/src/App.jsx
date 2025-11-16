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
