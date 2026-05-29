import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShopAuthProvider } from "./context/ShopAuthContext";
import { CartProvider }     from "./context/CartContext";
import Navbar         from "./components/Navbar";
import Home           from "./pages/Home";
import Shop           from "./pages/Shop";
import ProductDetail  from "./pages/ProductDetail";
import Cart           from "./pages/Cart";
import Checkout       from "./pages/Checkout";
import OrderSuccess   from "./pages/OrderSuccess";
import TrackOrder     from "./pages/TrackOrder";
import ShopLogin      from "./pages/ShopLogin";
import Account        from "./pages/Account";

export default function App() {
  return (
    <ShopAuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"Inter,system-ui,sans-serif" }}>
            <Navbar />
            <Routes>
              <Route path="/"                    element={<Home/>}/>
              <Route path="/shop"                element={<Shop/>}/>
              <Route path="/product/:id"         element={<ProductDetail/>}/>
              <Route path="/cart"                element={<Cart/>}/>
              <Route path="/checkout"            element={<Checkout/>}/>
              <Route path="/order-success/:orderNumber" element={<OrderSuccess/>}/>
              <Route path="/track"               element={<TrackOrder/>}/>
              <Route path="/login"               element={<ShopLogin/>}/>
              <Route path="/account"             element={<Account/>}/>
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </ShopAuthProvider>
  );
}
