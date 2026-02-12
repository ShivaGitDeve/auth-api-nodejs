import { useState } from "react";
import api from "../../api/axios";

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !newPassword) return;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      setMessage("Password reset successfully. You can now login.");
    } catch (error) {
      setMessage("Something went wrong");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <h2>Resset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter your new Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {message && <p>{message}</p>}
    </>
  );
};

export default ResetPassword;
