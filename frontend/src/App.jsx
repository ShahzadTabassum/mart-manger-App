import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar   from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Products  from "./pages/Products";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
export default function App() {
  return (
    <BrowserRouter>
      <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"#f9fafb",fontFamily:"Inter,system-ui,sans-serif"}}>
        <Sidebar/>
        <main style={{flex:1,overflowY:"auto"}}>
          <Routes>
            <Route path="/"          element={<Dashboard/>}/>
            <Route path="/products"  element={<Products/>}/>
            <Route path="/inventory" element={<Inventory/>}/>
            <Route path="/suppliers" element={<Suppliers/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
