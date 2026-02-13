import { useState } from "react";
import api from "../../api/axios";
import "./ForgotPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("Reset link sent to your email");
    } catch (error) {
      setMessage("Something went wrong");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="forgot-wrapper">
        <h2>Forgot Password</h2>
        <p className="forgot-subtitle">
          Enter your email to receive reset link
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p
            className={`message ${message.includes("wrong") ? "error" : "success"}`}
          >
            {message}
          </p>
        )}
      </div>
    </>
  );
};

export default ForgotPassword;
