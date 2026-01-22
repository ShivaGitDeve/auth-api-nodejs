import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/Auth-context";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email && !password) return;
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (e) {
      alert("Invalid credentials");
      console.log(e);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back </h2>
        <p className="subtitle">Login to your account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              display: "flex",
              flexDirection: "row-reverse",
              cursor: "pointer",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>

          <button type="submit">Login</button>
        </form>

        <p className="footer-text">
          Don’t have an account? <span>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
