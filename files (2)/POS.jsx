import { useEffect, useState, useRef } from "react";
import { getProducts } from "../api/products";
import { createSale } from "../api/sales";
import Receipt from "../components/Receipt";

export default function POS() {
  const [products, setProducts]   = useState([]);
  const [search,   setSearch]     = useState("");
  const [cart,     setCart]       = useState([]);
  const [payment,  setPayment]    = useState("CASH");
  const [discType, setDiscType]   = useState("");
  const [discVal,  setDiscVal]    = useState("");
  const [amtPaid,  setAmtPaid]    = useState("");
  const [servedBy, setServedBy]   = useState("");
  const [note,     setNote]       = useState("");
  const [receipt,  setReceipt]    = useState(null);
  const [loading,  setLoading]    = useState(false);
  const searchRef = useRef();

  useEffect(() => { getProducts().then(r => setProducts(r.data)); }, []);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12);

  const addToCart = (product) => {
    setCart(c => {
      const ex = c.find(i => i.product_id === product.id);
      if (ex) return c.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { product_id: product.id, name: product.name, sku: product.sku, price: parseFloat(product.price), quantity: 1, maxQty: product.inventory?.quantity || 99 }];
    });
    setSearch("");
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(c => c.map(i => i.product_id === id ? { ...i, quantity: qty } : i));
  };
  const removeFromCart = (id) => setCart(c => c.filter(i => i.product_id !== id));
  const clearCart = () => { setCart([]); setDiscType(""); setDiscVal(""); setAmtPaid(""); setNote(""); };

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountAmount = (() => {
    if (!discType || !discVal) return 0;
    if (discType === "PERCENT") return subtotal * (parseFloat(discVal) / 100);
    if (discType === "FIXED")   return Math.min(parseFloat(discVal), subtotal);
    return 0;
  })();
  const total    = subtotal - discountAmount;
  const change   = payment === "CASH" && amtPaid ? Math.max(0, parseFloat(amtPaid) - total) : 0;

  const handleCheckout = async () => {
    if (!cart.length) return alert("Cart is empty!");
    if (payment === "CASH" && amtPaid && parseFloat(amtPaid) < total) return alert("Amount paid is less than total!");
    setLoading(true);
    try {
      const payload = {
        payment_method: payment,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        discount_type:  discType || null,
        discount_value: discVal  ? parseFloat(discVal) : null,
        amount_paid:    amtPaid  ? parseFloat(amtPaid) : total,
        note, served_by: servedBy,
      };
      const r = await createSale(payload);
      setReceipt(r.data);
      clearCart();
    } catch(e) { alert(e.response?.data?.detail || "Error processing sale"); }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.topbar}>
          <h1 style={s.h1}>🛒 Point of Sale</h1>
          <input ref={searchRef} style={s.search} placeholder="Search product by name or SKU…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        {search && (
          <div style={s.searchResults}>
            {filtered.length === 0 ? <div style={s.noResult}>No products found</div>
            : filtered.map(p => (
              <div key={p.id} style={s.searchRow} onClick={() => addToCart(p)}>
                <div>
                  <div style={s.srName}>{p.name}</div>
                  <div style={s.srSku}>{p.sku} · {p.inventory?.quantity ?? 0} in stock</div>
                </div>
                <div style={s.srPrice}>SGD {parseFloat(p.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        <div style={s.cartBox}>
          <div style={s.cartHeader}>
            <span style={s.cartTitle}>Cart ({cart.length} items)</span>
            {cart.length > 0 && <button style={s.clearBtn} onClick={clearCart}>Clear all</button>}
          </div>
          {cart.length === 0
            ? <div style={s.emptyCart}><div style={{fontSize:40}}>🛍️</div><div>Search and add products above</div></div>
            : cart.map(item => (
              <div key={item.product_id} style={s.cartRow}>
                <div style={s.cartInfo}>
                  <div style={s.cartName}>{item.name}</div>
                  <div style={s.cartSku}>{item.sku} · SGD {item.price.toFixed(2)} each</div>
                </div>
                <div style={s.cartControls}>
                  <button style={s.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity - 1)}>−</button>
                  <span style={s.qtyVal}>{item.quantity}</span>
                  <button style={s.qtyBtn} onClick={() => updateQty(item.product_id, item.quantity + 1)}>+</button>
                </div>
                <div style={s.cartTotal}>SGD {(item.price * item.quantity).toFixed(2)}</div>
                <button style={s.removeBtn} onClick={() => removeFromCart(item.product_id)}>✕</button>
              </div>
            ))
          }
        </div>
      </div>

      <div style={s.right}>
        <div style={s.panel}>
          <div style={s.panelTitle}>💳 Payment</div>
          <div style={s.payBtns}>
            {[["CASH","💵 Cash"],["CARD","💳 Card"],["QR","📱 QR"]].map(([val,label])=>(
              <button key={val} style={{...s.payBtn,...(payment===val?s.payBtnActive:{})}} onClick={()=>setPayment(val)}>{label}</button>
            ))}
          </div>

          <div style={s.panelTitle} id="disc">🏷️ Discount</div>
          <div style={s.discRow}>
            <select style={s.select} value={discType} onChange={e=>{setDiscType(e.target.value);setDiscVal("");}}>
              <option value="">No discount</option>
              <option value="PERCENT">Percentage (%)</option>
              <option value="FIXED">Fixed amount (SGD)</option>
            </select>
            {discType && <input style={s.input} type="number" min="0" placeholder={discType==="PERCENT"?"e.g. 10":"e.g. 5.00"} value={discVal} onChange={e=>setDiscVal(e.target.value)} />}
          </div>

          <div style={s.summary}>
            <Row label="Subtotal"  value={`SGD ${subtotal.toFixed(2)}`} />
            {discountAmount > 0 && <Row label={`Discount (${discType==="PERCENT"?discVal+"%":"SGD "+discVal})`} value={`− SGD ${discountAmount.toFixed(2)}`} color="#dc2626" />}
            <div style={s.totalRow}><span>Total</span><span style={s.totalAmt}>SGD {total.toFixed(2)}</span></div>
          </div>

          {payment === "CASH" && (
            <>
              <L>Amount received (SGD)</L>
              <input style={s.input} type="number" min="0" placeholder={`Min SGD ${total.toFixed(2)}`} value={amtPaid} onChange={e=>setAmtPaid(e.target.value)} />
              {amtPaid && parseFloat(amtPaid) >= total && (
                <div style={s.changeBox}>💵 Change: SGD {change.toFixed(2)}</div>
              )}
            </>
          )}

          <L>Served by</L>
          <input style={s.input} placeholder="Staff name" value={servedBy} onChange={e=>setServedBy(e.target.value)} />
          <L>Note (optional)</L>
          <input style={s.input} placeholder="Any note…" value={note} onChange={e=>setNote(e.target.value)} />

          <button style={{...s.checkoutBtn,...(loading||!cart.length?s.checkoutDisabled:{})}} onClick={handleCheckout} disabled={loading||!cart.length}>
            {loading ? "Processing…" : `✅ Complete Sale · SGD ${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Row({ label, value, color="#374151" }) {
  return <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", color }}><span>{label}</span><span>{value}</span></div>;
}
function L({ children }) {
  return <div style={{ fontSize:12, color:"#6b7280", marginBottom:4, marginTop:12 }}>{children}</div>;
}

const s = {
  page:           { display:"flex", gap:20, padding:24, maxWidth:1200, margin:"0 auto", height:"calc(100vh - 0px)", overflow:"hidden" },
  left:           { flex:1, display:"flex", flexDirection:"column", gap:14, overflow:"hidden" },
  right:          { width:320, flexShrink:0 },
  topbar:         { display:"flex", flexDirection:"column", gap:10 },
  h1:             { fontSize:20, fontWeight:700, color:"#111827" },
  search:         { width:"100%", padding:"11px 16px", border:"2px solid #4f46e5", borderRadius:10, fontSize:14, outline:"none" },
  searchResults:  { background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.08)" },
  searchRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f3f4f6", transition:"background .1s" },
  srName:         { fontSize:14, fontWeight:600, color:"#111827" },
  srSku:          { fontSize:12, color:"#9ca3af", marginTop:2 },
  srPrice:        { fontSize:14, fontWeight:700, color:"#4f46e5" },
  noResult:       { padding:16, textAlign:"center", color:"#9ca3af", fontSize:13 },
  cartBox:        { flex:1, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden", display:"flex", flexDirection:"column" },
  cartHeader:     { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid #f3f4f6" },
  cartTitle:      { fontWeight:700, fontSize:14, color:"#111827" },
  clearBtn:       { fontSize:12, color:"#dc2626", background:"none", border:"none", cursor:"pointer" },
  emptyCart:      { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, color:"#9ca3af", fontSize:14 },
  cartRow:        { display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #f9fafb" },
  cartInfo:       { flex:1 },
  cartName:       { fontSize:13, fontWeight:600, color:"#111827" },
  cartSku:        { fontSize:11, color:"#9ca3af", marginTop:2 },
  cartControls:   { display:"flex", alignItems:"center", gap:8 },
  qtyBtn:         { width:28, height:28, border:"1px solid #e5e7eb", borderRadius:6, background:"#f9fafb", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" },
  qtyVal:         { fontSize:14, fontWeight:600, minWidth:24, textAlign:"center" },
  cartTotal:      { fontSize:13, fontWeight:700, color:"#4f46e5", minWidth:80, textAlign:"right" },
  removeBtn:      { background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:16 },
  panel:          { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, height:"100%", overflowY:"auto" },
  panelTitle:     { fontWeight:700, fontSize:14, color:"#111827", marginBottom:12, marginTop:16 },
  payBtns:        { display:"flex", gap:8 },
  payBtn:         { flex:1, padding:"9px 6px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, cursor:"pointer", background:"#f9fafb", fontWeight:500 },
  payBtnActive:   { background:"#eef2ff", borderColor:"#4f46e5", color:"#4f46e5" },
  discRow:        { display:"flex", gap:8 },
  select:         { flex:1, padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, background:"#fff", outline:"none" },
  input:          { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none", marginTop:2 },
  summary:        { background:"#f9fafb", borderRadius:10, padding:"12px 14px", marginTop:14 },
  totalRow:       { display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700, color:"#111827", paddingTop:8, marginTop:6, borderTop:"1px solid #e5e7eb" },
  totalAmt:       { color:"#4f46e5" },
  changeBox:      { background:"#f0fdf4", color:"#166534", padding:"8px 12px", borderRadius:8, fontSize:13, fontWeight:600, marginTop:8 },
  checkoutBtn:    { width:"100%", marginTop:18, padding:"13px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" },
  checkoutDisabled:{ background:"#c7d2fe", cursor:"not-allowed" },
};
