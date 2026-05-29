import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useShopAuth } from "../context/ShopAuthContext";

export default function Navbar() {
  const { totalItems } = useCart();
  const { customer, logout } = useShopAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <nav style={s.nav}>
      <div style={s.inner}>
        {/* Logo */}
        <Link to="/" style={s.logo}>
          🛍️ <span style={s.logoText}>MartShop</span>
        </Link>

        {/* Desktop links */}
        <div style={s.links}>
          <Link to="/"      style={s.link}>Home</Link>
          <Link to="/shop"  style={s.link}>Shop</Link>
          <Link to="/track" style={s.link}>Track Order</Link>
        </div>

        {/* Right side */}
        <div style={s.right}>
          {/* Cart */}
          <Link to="/cart" style={s.cartBtn}>
            🛒
            {totalItems > 0 && <span style={s.cartBadge}>{totalItems}</span>}
          </Link>

          {/* Account */}
          {customer ? (
            <div style={s.accountWrap}>
              <button style={s.accountBtn} onClick={() => setMenuOpen(m => !m)}>
                👤 {customer.name.split(" ")[0]} ▾
              </button>
              {menuOpen && (
                <div style={s.dropdown}>
                  <Link to="/account" style={s.dropItem} onClick={() => setMenuOpen(false)}>My Orders</Link>
                  <button style={s.dropItem} onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={s.loginBtn}>Sign In</Link>
          )}

          {/* Mobile menu toggle */}
          <button style={s.hamburger} onClick={() => setMenuOpen(m => !m)}>☰</button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={s.mobileMenu}>
          <Link to="/"      style={s.mobileLink} onClick={() => setMenuOpen(false)}>🏠 Home</Link>
          <Link to="/shop"  style={s.mobileLink} onClick={() => setMenuOpen(false)}>🛍️ Shop</Link>
          <Link to="/track" style={s.mobileLink} onClick={() => setMenuOpen(false)}>📦 Track Order</Link>
          <Link to="/cart"  style={s.mobileLink} onClick={() => setMenuOpen(false)}>🛒 Cart ({totalItems})</Link>
          {customer
            ? <><Link to="/account" style={s.mobileLink} onClick={() => setMenuOpen(false)}>👤 My Orders</Link>
                <button style={s.mobileLink} onClick={handleLogout}>🚪 Logout</button></>
            : <Link to="/login" style={s.mobileLink} onClick={() => setMenuOpen(false)}>🔑 Sign In</Link>
          }
        </div>
      )}
    </nav>
  );
}

const s = {
  nav:         { background:"#fff", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0, zIndex:100 },
  inner:       { maxWidth:1200, margin:"0 auto", padding:"0 20px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", gap:20 },
  logo:        { display:"flex", alignItems:"center", gap:8, textDecoration:"none" },
  logoText:    { fontSize:20, fontWeight:800, color:"#4f46e5" },
  links:       { display:"flex", gap:24, "@media(max-width:768px)":{display:"none"} },
  link:        { fontSize:14, color:"#374151", textDecoration:"none", fontWeight:500 },
  right:       { display:"flex", alignItems:"center", gap:12 },
  cartBtn:     { position:"relative", fontSize:22, textDecoration:"none", color:"#374151" },
  cartBadge:   { position:"absolute", top:-6, right:-8, background:"#4f46e5", color:"#fff", borderRadius:"50%", width:18, height:18, fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center" },
  accountWrap: { position:"relative" },
  accountBtn:  { background:"none", border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 12px", fontSize:13, cursor:"pointer", color:"#374151" },
  dropdown:    { position:"absolute", right:0, top:"110%", background:"#fff", border:"1px solid #e5e7eb", borderRadius:9, boxShadow:"0 4px 20px rgba(0,0,0,.1)", minWidth:140, zIndex:200, overflow:"hidden" },
  dropItem:    { display:"block", padding:"10px 16px", fontSize:13, color:"#374151", textDecoration:"none", cursor:"pointer", background:"none", border:"none", width:"100%", textAlign:"left" },
  loginBtn:    { padding:"8px 16px", background:"#4f46e5", color:"#fff", borderRadius:8, fontSize:13, fontWeight:600, textDecoration:"none" },
  hamburger:   { background:"none", border:"none", fontSize:22, cursor:"pointer", display:"none", "@media(max-width:768px)":{display:"block"} },
  mobileMenu:  { background:"#fff", borderTop:"1px solid #f3f4f6", padding:"8px 0" },
  mobileLink:  { display:"block", padding:"12px 20px", fontSize:14, color:"#374151", textDecoration:"none", cursor:"pointer", background:"none", border:"none", width:"100%", textAlign:"left" },
};
