import { createContext, useContext, useState, useEffect } from "react";
import { shopGetMe } from "../api/shop";
const ShopAuthContext = createContext(null);
export function ShopAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading,  setLoading]  = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("shop_token");
    if (token) {
      shopGetMe().then(r => setCustomer(r.data)).catch(() => localStorage.removeItem("shop_token")).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);
  const loginCustomer = (token, data) => { localStorage.setItem("shop_token", token); setCustomer(data); };
  const logout = () => { localStorage.removeItem("shop_token"); setCustomer(null); };
  return <ShopAuthContext.Provider value={{ customer, loading, loginCustomer, logout }}>{children}</ShopAuthContext.Provider>;
}
export const useShopAuth = () => useContext(ShopAuthContext);
