import { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mm_token");
    if (token) {
      getMe()
        .then(r  => setUser(r.data))
        .catch(() => { localStorage.removeItem("mm_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem("mm_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("mm_token");
    setUser(null);
  };

  const PERMISSIONS = {
    ADMIN:   ["dashboard","pos","sales","returns","customers","products","barcodes","categories","inventory","suppliers","employees","users"],
    MANAGER: ["dashboard","pos","returns","customers","products","barcodes","inventory"],
    CASHIER: ["pos","returns"],
  };

  const can = (page) => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(page) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
