import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar    from "./components/Sidebar";
import Login      from "./pages/Login";
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
import ForgotPassword from "./pages/ForgotPassword";

function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontSize:14,color:"#6b7280"}}>Loading…</div>;
  if (!user)   return <Routes><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>;
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f9fafb",fontFamily:"Inter,system-ui,sans-serif"}}>
      <Sidebar/>
      <main style={{flex:1,overflowY:"auto"}}>
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/*"     element={<AppLayout/>}/>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
