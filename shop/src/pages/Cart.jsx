import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const { cart, removeFromCart, updateQty, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const DELIVERY_FEE = 5.00;

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>🛒 Your Cart</h1>
        {cart.length === 0 ? (
          <div style={s.empty}>
            <div style={{fontSize:60, marginBottom:16}}>🛍️</div>
            <div style={{fontSize:18, fontWeight:600, color:"#374151", marginBottom:8}}>Your cart is empty</div>
            <div style={{fontSize:14, color:"#9ca3af", marginBottom:24}}>Add some products to get started</div>
            <Link to="/shop" style={s.shopBtn}>Continue Shopping →</Link>
          </div>
        ) : (
          <div style={s.layout}>
            {/* Cart items */}
            <div style={s.itemsCol}>
              {cart.map(item => (
                <div key={item.id} style={s.cartRow}>
                  <div style={s.itemIcon}>{item.category?.icon || "👗"}</div>
                  <div style={s.itemInfo}>
                    <div style={s.itemName}>{item.name}</div>
                    <div style={s.itemSku}>{item.sku}</div>
                    <div style={s.itemPrice}>SGD {item.price.toFixed(2)} each</div>
                  </div>
                  <div style={s.itemControls}>
                    <div style={s.qtyWrap}>
                      <button style={s.qtyBtn} onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                      <span style={s.qty}>{item.quantity}</span>
                      <button style={s.qtyBtn} onClick={() => updateQty(item.id, Math.min(item.quantity + 1, item.stock_qty || 99))}>+</button>
                    </div>
                    <div style={s.lineTotal}>SGD {(item.price * item.quantity).toFixed(2)}</div>
                    <button style={s.removeBtn} onClick={() => removeFromCart(item.id)}>🗑️</button>
                  </div>
                </div>
              ))}
              <button style={s.clearBtn} onClick={clearCart}>Clear all items</button>
            </div>

            {/* Summary */}
            <div style={s.summary}>
              <div style={s.summaryTitle}>Order Summary</div>
              <div style={s.summaryRow}><span>Subtotal</span><span>SGD {totalPrice.toFixed(2)}</span></div>
              <div style={s.summaryRow}><span>Delivery fee</span><span style={{color:"#6b7280",fontSize:12}}>Calculated at checkout</span></div>
              <div style={s.summaryTotal}><span>Estimated Total</span><span>SGD {totalPrice.toFixed(2)}+</span></div>
              <button style={s.checkoutBtn} onClick={() => navigate("/checkout")}>
                Proceed to Checkout →
              </button>
              <Link to="/shop" style={s.continueBtn}>← Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:         { padding:"24px 20px", minHeight:"calc(100vh - 64px)" },
  inner:        { maxWidth:900, margin:"0 auto" },
  title:        { fontSize:24, fontWeight:700, color:"#111827", marginBottom:24 },
  empty:        { textAlign:"center", padding:"60px 0" },
  shopBtn:      { padding:"12px 24px", background:"#4f46e5", color:"#fff", borderRadius:9, textDecoration:"none", fontWeight:600, fontSize:14 },
  layout:       { display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" },
  itemsCol:     { display:"flex", flexDirection:"column", gap:12 },
  cartRow:      { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16, display:"flex", alignItems:"center", gap:14 },
  itemIcon:     { fontSize:40, flexShrink:0 },
  itemInfo:     { flex:1 },
  itemName:     { fontSize:14, fontWeight:600, color:"#111827", marginBottom:4 },
  itemSku:      { fontSize:11, color:"#9ca3af" },
  itemPrice:    { fontSize:13, color:"#6b7280", marginTop:4 },
  itemControls: { display:"flex", alignItems:"center", gap:14, flexShrink:0 },
  qtyWrap:      { display:"flex", alignItems:"center", gap:8 },
  qtyBtn:       { width:30, height:30, border:"1px solid #e5e7eb", borderRadius:6, background:"#f9fafb", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" },
  qty:          { fontSize:15, fontWeight:600, minWidth:24, textAlign:"center" },
  lineTotal:    { fontSize:15, fontWeight:700, color:"#4f46e5", minWidth:80, textAlign:"right" },
  removeBtn:    { background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#9ca3af" },
  clearBtn:     { background:"none", border:"1px solid #fca5a5", borderRadius:8, padding:"8px 16px", color:"#dc2626", fontSize:13, cursor:"pointer", alignSelf:"flex-start", marginTop:4 },
  summary:      { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:80 },
  summaryTitle: { fontSize:16, fontWeight:700, color:"#111827", marginBottom:16 },
  summaryRow:   { display:"flex", justifyContent:"space-between", fontSize:13, color:"#374151", padding:"6px 0", borderBottom:"1px solid #f3f4f6" },
  summaryTotal: { display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:700, color:"#111827", padding:"12px 0", marginTop:4 },
  checkoutBtn:  { width:"100%", padding:"13px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:8 },
  continueBtn:  { display:"block", textAlign:"center", fontSize:13, color:"#6b7280", textDecoration:"none", marginTop:12 },
};
