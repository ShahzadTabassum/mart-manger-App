import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar    from "./components/Sidebar";
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
export default function App() {
  return (
    <BrowserRouter>
      <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f9fafb",fontFamily:"Inter,system-ui,sans-serif"}}>
        <Sidebar/>
        <main style={{flex:1,overflowY:"auto"}}>
          <Routes>
            <Route path="/"           element={<Dashboard/>}/>
            <Route path="/pos"        element={<POS/>}/>
            <Route path="/sales"      element={<Sales/>}/>
            <Route path="/returns"    element={<Returns/>}/>
            <Route path="/customers"  element={<Customers/>}/>
            <Route path="/products"   element={<Products/>}/>
            <Route path="/categories" element={<Categories/>}/>
            <Route path="/inventory"  element={<Inventory/>}/>
            <Route path="/suppliers"  element={<Suppliers/>}/>
            <Route path="/employees"  element={<Employees/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
