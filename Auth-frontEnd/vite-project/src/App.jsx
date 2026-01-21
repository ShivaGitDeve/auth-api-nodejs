import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login/Login";
import ProtectedRoute from "./auth/Protected-route";
import Dashboard from "./pages/dashboard/Dashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

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
