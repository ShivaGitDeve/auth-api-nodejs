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
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false}></Toaster>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<SignupPage />} />

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
