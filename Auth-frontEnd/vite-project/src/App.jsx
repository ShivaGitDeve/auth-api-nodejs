import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import ProtectedRoute from "./auth/Protected-route";
import Dashboard from "./pages/dashboard/Dashboard";
import ForgotPassword from "./pages/Password/Forgot-Password";
import ResetPassword from "./pages/Password/Reset-Password";
import RoleProtectedRoute from "./auth/RoleProtectedRoute";
import Admin from "./pages/admin/Admin";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin protected route */}
        <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* User protected route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
