import { useState } from "react";
import api from "../../api/axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaLock, FaKey } from "react-icons/fa";
import "./Reset-Password.css";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  // const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  console.log(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: token,
        newPassword,
      });
      toast.success("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <h2>
          <FaKey className="icon" /> Reset Password
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FaLock className="input-icon" />
            {/* <input
//           type="text"
//           placeholder="Token"
//           value={token}
//           onChange={(e) => setToken(e.target.value)}
//         /> */}
            <input
              type="password"
              placeholder="Enter your new Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* {message && <p className="message">{message}</p>} */}
      </div>
    </div>
  );
};

export default ResetPassword;

// import { useState } from "react";
// import api from "../../api/axios";
// import { useSearchParams } from "react-router-dom";

// const ResetPassword = () => {
//   console.log("Reset page loaded");

//   // const [token, setToken] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const [searchParams] = useSearchParams();
//   const token = searchParams.get("token");

//   console.log(token);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!newPassword) return;
//     setLoading(true);
//     try {
//       await api.post("/auth/reset-password", {
//         token: token,
//         newPassword,
//       });
//       setMessage("Password reset successfully. You can now login.");
//     } catch (error) {
//       setMessage("Something went wrong");
//       console.log(error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <>
//       <h2>Resset Password</h2>
//       <form onSubmit={handleSubmit}>
//         {/* <input
//           type="text"
//           placeholder="Token"
//           value={token}
//           onChange={(e) => setToken(e.target.value)}
//         /> */}
//         <input
//           type="password"
//           placeholder="Enter your new Password"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//         />
//         <button type="submit" disabled={loading}>
//           {loading ? "Resetting..." : "Reset Password"}
//         </button>
//       </form>
//       {message && <p>{message}</p>}
//     </>
//   );
// };

// export default ResetPassword;
