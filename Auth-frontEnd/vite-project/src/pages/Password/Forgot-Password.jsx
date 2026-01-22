import { useState } from "react";
import api from "../../api/axios"

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("Reset link sent to your email");
    } catch (error) {
      setMessage("Something went wrong");
      console.log(error);
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
        <button type="submit">Submit</button>
      </form>
      {message && <p>{message}</p>}
    </>
  );
};

export default ForgotPassword;
