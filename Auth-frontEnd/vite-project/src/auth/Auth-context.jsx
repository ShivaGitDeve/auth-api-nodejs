import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // app load par check
  useEffect(() => {
    const token = localStorage.getItem("refreshToken");
    if (token) {
      refreshAccessToken();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    sessionStorage.setItem("accessToken", res.data.accessToken);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem("refreshToken", res.data.refreshToken);
    return res.data.user;
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");

      const res = await api.post(
        "/auth/refresh-token",
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        },
      );
      sessionStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);
      setAccessToken(res.data.accessToken);

      // reload ke baad user data wapas lao, warna protected routes login par bhej dete
      const me = await api.get("/auth/me");
      setUser(me.data.user);
    } catch (err) {
      console.error(err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout", {
        refreshToken: localStorage.getItem("refreshToken"),
      });
    } catch (error) {
      console.log("LogOut API failed ", error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
