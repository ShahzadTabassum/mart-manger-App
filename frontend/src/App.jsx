import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar    from "./components/Sidebar";
import Login      from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard  from "./pages/Dashboard";
import Products   from "./pages/Products";
import Inventory  from "./pages/Inventory";
import Suppliers  from "./pages/Suppliers";
import POS        from "./pages/POS";
import Sales      from "./pages/Sales";
import Categories from "./pages/Categories";
import Customers  from "./pages/Customers";
import Employees  from "./pages/Employees";
import Returns    from "./pages/Returns";
import Users      from "./pages/Users";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function AppLayout() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div style={ls.loader}>Loading…</div>;
  if (!user)   return <Routes><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>;

  return (
    <div style={ls.app}>

      {/* ── Mobile topbar (hamburger) — only on small screens ── */}
      {isMobile && (
        <div style={ls.mobileTopbar}>
          <button style={ls.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
          <span style={ls.mobileLogo}>🛍️ MartManager</span>
          <div style={{ width:36 }}/>
        </div>
      )}

      <div style={ls.body}>
        {/* ── Desktop: sidebar always visible ── */}
        {!isMobile && (
          <Sidebar open={false} onClose={() => {}} />
        )}

        {/* ── Mobile: sidebar as overlay ── */}
        {isMobile && sidebarOpen && (
          <>
            <div style={ls.overlay} onClick={() => setSidebarOpen(false)} />
            <div style={ls.mobileSidebar}>
              <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* ── Main content ── */}
        <main style={ls.main}>
          <Routes>
            <Route path="/"           element={<ProtectedRoute page="dashboard"> <Dashboard/> </ProtectedRoute>}/>
            <Route path="/pos"        element={<ProtectedRoute page="pos">       <POS/>       </ProtectedRoute>}/>
            <Route path="/sales"      element={<ProtectedRoute page="sales">     <Sales/>     </ProtectedRoute>}/>
            <Route path="/returns"    element={<ProtectedRoute page="returns">   <Returns/>   </ProtectedRoute>}/>
            <Route path="/customers"  element={<ProtectedRoute page="customers"> <Customers/> </ProtectedRoute>}/>
            <Route path="/products"   element={<ProtectedRoute page="products">  <Products/>  </ProtectedRoute>}/>
            <Route path="/categories" element={<ProtectedRoute page="categories"><Categories/></ProtectedRoute>}/>
            <Route path="/inventory"  element={<ProtectedRoute page="inventory"> <Inventory/> </ProtectedRoute>}/>
            <Route path="/suppliers"  element={<ProtectedRoute page="suppliers"> <Suppliers/> </ProtectedRoute>}/>
            <Route path="/employees"  element={<ProtectedRoute page="employees"> <Employees/> </ProtectedRoute>}/>
            <Route path="/users"      element={<ProtectedRoute page="users">     <Users/>     </ProtectedRoute>}/>
            <Route path="*"           element={<Navigate to="/" replace/>}/>
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"           element={<Login/>}/>
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
          <Route path="/*"               element={<AppLayout/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const ls = {
  app:          { display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden", background:"#f9fafb", fontFamily:"Inter,system-ui,sans-serif" },
  mobileTopbar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#1e1b4b", flexShrink:0, zIndex:10 },
  hamburger:    { background:"none", border:"none", color:"#e0e7ff", fontSize:24, cursor:"pointer", width:36, lineHeight:1 },
  mobileLogo:   { color:"#e0e7ff", fontWeight:700, fontSize:15 },
  body:         { display:"flex", flex:1, overflow:"hidden" },
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:199 },
  mobileSidebar:{ position:"fixed", top:0, left:0, height:"100vh", zIndex:200 },
  main:         { flex:1, overflowY:"auto" },
  loader:       { display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontSize:14, color:"#6b7280" },
};
