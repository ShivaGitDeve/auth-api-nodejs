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

    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem("refreshToken", res.data.refreshToken);
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

      setAccessToken(res.data.accessToken);
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
