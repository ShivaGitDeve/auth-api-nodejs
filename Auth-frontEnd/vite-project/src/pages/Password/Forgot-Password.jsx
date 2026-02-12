import { useState } from "react";
import api from "../../api/axios";

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
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}{" "}
        </button>
      </form>
      {message && <p>{message}</p>}
    </>
  );
};

export default ForgotPassword;
