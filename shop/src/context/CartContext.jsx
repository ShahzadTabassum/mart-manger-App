import { createContext, useContext, useState, useEffect } from "react";
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("shop_cart") || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem("shop_cart", JSON.stringify(cart)); }, [cart]);
  const addToCart    = (product, qty=1) => setCart(c => {
    const ex = c.find(i => i.id === product.id);
    if (ex) return c.map(i => i.id === product.id ? { ...i, quantity: Math.min(i.quantity+qty, product.stock_qty||99) } : i);
    return [...c, { ...product, quantity: qty }];
  });
  const removeFromCart = (id)      => setCart(c => c.filter(i => i.id !== id));
  const updateQty      = (id, qty) => { if (qty<1) return removeFromCart(id); setCart(c => c.map(i => i.id===id ? {...i,quantity:qty} : i)); };
  const clearCart      = ()        => setCart([]);
  const totalItems  = cart.reduce((a,i) => a+i.quantity, 0);
  const totalPrice  = cart.reduce((a,i) => a+i.price*i.quantity, 0);
  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
