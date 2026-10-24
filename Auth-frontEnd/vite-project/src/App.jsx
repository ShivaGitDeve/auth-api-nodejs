import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/login/Login";
import ProtectedRoute from "./auth/Protected-route";
import Dashboard from "./pages/dashboard/Dashboard";
import ForgotPassword from "./pages/Password/Forgot-Password";
import ResetPassword from "./pages/Password/Reset-Password";
import RoleProtectedRoute from "./auth/RoleProtectedRoute";
import Admin from "./pages/admin/Admin";
import SignupPage from "./pages/login/Signup";
import HomePage from "./pages/home/Home";
import Profile from "./pages/home/Profile";
import ChangePassword from "./pages/Password/Change-Password";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(20, 20, 38, 0.85)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(16px)",
            borderRadius: "14px",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#a78bfa", secondary: "#0b0b18" } },
          error: { iconTheme: { primary: "#fb7185", secondary: "#0b0b18" } },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin protected route */}
        <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* User protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
