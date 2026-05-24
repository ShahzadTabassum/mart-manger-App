import { useEffect, useState, useRef } from "react";
import { getProducts } from "../api/products";
import { createSale } from "../api/sales";
import { searchByPhone, createCustomer } from "../api/customers";
import Receipt from "../components/Receipt";

export default function POS() {
  const [products,    setProducts]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [cart,        setCart]        = useState([]);
  const [payment,     setPayment]     = useState("CASH");
  const [discType,    setDiscType]    = useState("");
  const [discVal,     setDiscVal]     = useState("");
  const [amtPaid,     setAmtPaid]     = useState("");
  const [servedBy,    setServedBy]    = useState("");
  const [note,        setNote]        = useState("");
  const [receipt,     setReceipt]     = useState(null);
  const [loading,     setLoading]     = useState(false);

  // Customer states — clearly separated
  const [custPhone,    setCustPhone]    = useState("");
  const [customer,     setCustomer]     = useState(null);   // found/registered customer object
  const [notFound,     setNotFound]     = useState(false);  // true when phone lookup returned nothing
  const [newCustName,  setNewCustName]  = useState("");     // name input for new customer
  const [redeemPts,    setRedeemPts]    = useState(0);
  const [registering,  setRegistering]  = useState(false);

  const searchRef = useRef();
  useEffect(() => { getProducts().then(r => setProducts(r.data)); }, []);
  useEffect(() => { searchRef.current?.focus(); }, []);

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12);

  // --- Cart ---
  const addToCart = (product) => {
    setCart(c => {
      const ex = c.find(i => i.product_id === product.id);
      if (ex) return c.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { product_id: product.id, name: product.name, sku: product.sku, price: parseFloat(product.price), quantity: 1 }];
    });
    setSearch(""); searchRef.current?.focus();
  };
  const updateQty      = (id, qty) => { if (qty < 1) return removeFromCart(id); setCart(c => c.map(i => i.product_id === id ? { ...i, quantity: qty } : i)); };
  const removeFromCart = (id) => setCart(c => c.filter(i => i.product_id !== id));
  const clearCart      = () => { setCart([]); setDiscType(""); setDiscVal(""); setAmtPaid(""); setNote(""); setRedeemPts(0); };

  // --- Customer ---
  const lookupCustomer = async () => {
    if (!custPhone.trim()) return;
    setNotFound(false); setNewCustName(""); setCustomer(null);
    try {
      const r = await searchByPhone(custPhone.trim());
      if (r.data && r.data.id) {
        setCustomer(r.data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }
  };

  const registerCustomer = async () => {
    if (!newCustName.trim()) return alert("Please enter the customer's name");
    if (!custPhone.trim())   return alert("Phone number is required");
    setRegistering(true);
    try {
      const r = await createCustomer({ name: newCustName.trim(), phone: custPhone.trim() });
      setCustomer(r.data);
      setNotFound(false);
      setNewCustName("");
    } catch(e) {
      alert(e.response?.data?.detail || "Error registering customer");
    }
    setRegistering(false);
  };

  const clearCustomer = () => {
    setCustomer(null); setCustPhone(""); setNotFound(false);
    setNewCustName(""); setRedeemPts(0);
  };

  // --- Totals ---
  const subtotal       = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountAmount = (() => {
    if (!discType || !discVal) return 0;
    if (discType === "PERCENT") return subtotal * (parseFloat(discVal) / 100);
    if (discType === "FIXED")   return Math.min(parseFloat(discVal), subtotal);
    return 0;
  })();
  const loyaltyDiscount = redeemPts * 0.01;
  const total           = Math.max(0, subtotal - discountAmount - loyaltyDiscount);
  const change          = payment === "CASH" && amtPaid ? Math.max(0, parseFloat(amtPaid) - total) : 0;
  const pointsEarned    = Math.floor(total);

  // --- Checkout ---
  const handleCheckout = async () => {
    if (!cart.length) return alert("Cart is empty!");
    if (payment === "CASH" && amtPaid && parseFloat(amtPaid) < total) return alert("Amount paid is less than total!");
    setLoading(true);
    try {
      const r = await createSale({
        payment_method: payment,
        items:          cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        discount_type:  discType || null,
        discount_value: discVal  ? parseFloat(discVal) : null,
        amount_paid:    amtPaid  ? parseFloat(amtPaid) : total,
        note, served_by: servedBy,
        customer_id:    customer?.id || null,
        redeem_points:  redeemPts || 0,
      });
      setReceipt(r.data);
      clearCart(); clearCustomer();
    } catch(e) {
      alert(e.response?.data?.detail || "Error processing sale");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      {/* LEFT */}
      <div style={s.left}>
        <div style={s.topbar}>
          <h1 style={s.h1}>🛒 Point of Sale</h1>
          <input ref={searchRef} style={s.search} placeholder="Search product by name or SKU…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {search && (
          <div style={s.searchResults}>
            {filtered.length === 0
              ? <div style={s.noResult}>No products found</div>
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

      {/* RIGHT */}
      <div style={s.right}>
        <div style={s.panel}>

          {/* ── Customer Section ── */}
          <div style={s.panelTitle}>👥 Customer <span style={s.optional}>(optional)</span></div>

          {/* State 1: no customer yet */}
          {!customer && (
            <div>
              <div style={s.custRow}>
                <input
                  style={{...s.input, flex:1}}
                  placeholder="Enter phone number"
                  value={custPhone}
                  onChange={e => { setCustPhone(e.target.value); setNotFound(false); setNewCustName(""); }}
                  onKeyDown={e => e.key === "Enter" && lookupCustomer()}
                />
                <button style={s.lookupBtn} onClick={lookupCustomer}>Find</button>
              </div>

              {/* State 2: not found — show name input to register */}
              {notFound && (
                <div style={s.notFoundBox}>
                  <div style={s.notFoundTitle}>❌ Customer not found for {custPhone}</div>
                  <div style={s.notFoundSub}>Register as new customer?</div>
                  <input
                    style={{...s.input, marginTop:8}}
                    placeholder="Enter customer name *"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && registerCustomer()}
                    autoFocus
                  />
                  <div style={s.regBtns}>
                    <button style={s.cancelSmBtn} onClick={() => { setNotFound(false); setCustPhone(""); setNewCustName(""); }}>Cancel</button>
                    <button style={{...s.lookupBtn, flex:1}} onClick={registerCustomer} disabled={registering}>
                      {registering ? "Registering…" : "✅ Register & Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* State 3: customer found/registered */}
          {customer && (
            <div style={s.custCard}>
              <div>
                <div style={s.custName}>👤 {customer.name}</div>
                <div style={s.custPhone}>{customer.phone}</div>
                <div style={s.custPts}>🎁 {customer.loyalty_points} points available</div>
              </div>
              <button style={s.clearCustBtn} onClick={clearCustomer} title="Remove customer">✕</button>
            </div>
          )}

          {/* Loyalty redeem */}
          {customer && customer.loyalty_points > 0 && (
            <div style={s.redeemBox}>
              <div style={s.redeemLabel}>🎁 Redeem points (1pt = SGD 0.01)</div>
              <div style={s.custRow}>
                <input style={{...s.input, flex:1}} type="number" min="0" max={customer.loyalty_points}
                  value={redeemPts}
                  onChange={e => setRedeemPts(Math.min(parseInt(e.target.value) || 0, customer.loyalty_points))}
                />
                <button style={s.lookupBtn} onClick={() => setRedeemPts(customer.loyalty_points)}>Max</button>
              </div>
              {redeemPts > 0 && <div style={s.redeemSaving}>💰 Saving: SGD {loyaltyDiscount.toFixed(2)}</div>}
            </div>
          )}

          {/* Payment */}
          <div style={s.panelTitle}>💳 Payment</div>
          <div style={s.payBtns}>
            {[["CASH","💵 Cash"],["CARD","💳 Card"],["QR","📱 QR"]].map(([val,label]) => (
              <button key={val} style={{...s.payBtn,...(payment===val?s.payBtnActive:{})}} onClick={() => setPayment(val)}>{label}</button>
            ))}
          </div>

          {/* Discount */}
          <div style={s.panelTitle}>🏷️ Discount</div>
          <div style={s.discRow}>
            <select style={s.select} value={discType} onChange={e => { setDiscType(e.target.value); setDiscVal(""); }}>
              <option value="">No discount</option>
              <option value="PERCENT">Percentage (%)</option>
              <option value="FIXED">Fixed amount (SGD)</option>
            </select>
            {discType && (
              <input style={s.input} type="number" min="0"
                placeholder={discType === "PERCENT" ? "e.g. 10" : "e.g. 5.00"}
                value={discVal} onChange={e => setDiscVal(e.target.value)}
              />
            )}
          </div>

          {/* Summary */}
          <div style={s.summary}>
            <Row label="Subtotal" value={`SGD ${subtotal.toFixed(2)}`} />
            {discountAmount > 0  && <Row label="Discount"                         value={`− SGD ${discountAmount.toFixed(2)}`}  color="#dc2626" />}
            {loyaltyDiscount > 0 && <Row label={`Loyalty (${redeemPts} pts)`}     value={`− SGD ${loyaltyDiscount.toFixed(2)}`} color="#7c3aed" />}
            <div style={s.totalRow}><span>Total</span><span style={s.totalAmt}>SGD {total.toFixed(2)}</span></div>
            {customer && <div style={{fontSize:11,color:"#16a34a",textAlign:"right",marginTop:4}}>+{pointsEarned} pts will be earned</div>}
          </div>

          {payment === "CASH" && (
            <>
              <L>Amount received (SGD)</L>
              <input style={s.input} type="number" min="0" placeholder={`Min SGD ${total.toFixed(2)}`}
                value={amtPaid} onChange={e => setAmtPaid(e.target.value)} />
              {amtPaid && parseFloat(amtPaid) >= total && (
                <div style={s.changeBox}>💵 Change: SGD {change.toFixed(2)}</div>
              )}
            </>
          )}

          <L>Served by</L>
          <input style={s.input} placeholder="Staff name" value={servedBy} onChange={e => setServedBy(e.target.value)} />
          <L>Note (optional)</L>
          <input style={s.input} placeholder="Any note…" value={note} onChange={e => setNote(e.target.value)} />

          <button
            style={{...s.checkoutBtn,...(loading||!cart.length?s.checkoutDisabled:{})}}
            onClick={handleCheckout}
            disabled={loading || !cart.length}
          >
            {loading ? "Processing…" : `✅ Complete Sale · SGD ${total.toFixed(2)}`}
          </button>
        </div>
      </div>

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Row({ label, value, color="#374151" }) {
  return <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",color}}><span>{label}</span><span>{value}</span></div>;
}
function L({ children }) {
  return <div style={{fontSize:12,color:"#6b7280",marginBottom:4,marginTop:12}}>{children}</div>;
}

const s = {
  page:           { display:"flex", gap:20, padding:24, maxWidth:1200, margin:"0 auto", height:"100vh", overflow:"hidden", boxSizing:"border-box" },
  left:           { flex:1, display:"flex", flexDirection:"column", gap:14, overflow:"hidden" },
  right:          { width:320, flexShrink:0 },
  topbar:         { display:"flex", flexDirection:"column", gap:10 },
  h1:             { fontSize:20, fontWeight:700, color:"#111827" },
  search:         { width:"100%", padding:"11px 16px", border:"2px solid #4f46e5", borderRadius:10, fontSize:14, outline:"none", boxSizing:"border-box" },
  searchResults:  { background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.08)" },
  searchRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid #f3f4f6" },
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
  qtyBtn:         { width:28, height:28, border:"1px solid #e5e7eb", borderRadius:6, background:"#f9fafb", cursor:"pointer", fontSize:16 },
  qtyVal:         { fontSize:14, fontWeight:600, minWidth:24, textAlign:"center" },
  cartTotal:      { fontSize:13, fontWeight:700, color:"#4f46e5", minWidth:80, textAlign:"right" },
  removeBtn:      { background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:16 },
  panel:          { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16, height:"100%", overflowY:"auto" },
  panelTitle:     { fontWeight:700, fontSize:13, color:"#111827", marginBottom:8, marginTop:14 },
  optional:       { fontWeight:400, color:"#9ca3af", fontSize:12 },
  custRow:        { display:"flex", gap:6 },
  lookupBtn:      { padding:"8px 12px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:600, whiteSpace:"nowrap" },
  notFoundBox:    { background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:9, padding:"12px 14px", marginTop:8 },
  notFoundTitle:  { fontSize:13, fontWeight:700, color:"#dc2626" },
  notFoundSub:    { fontSize:12, color:"#6b7280", marginTop:3 },
  regBtns:        { display:"flex", gap:8, marginTop:10 },
  cancelSmBtn:    { padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", fontSize:12, cursor:"pointer" },
  custCard:       { background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:9, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginTop:4 },
  custName:       { fontSize:13, fontWeight:700, color:"#4f46e5" },
  custPhone:      { fontSize:11, color:"#7c3aed", marginTop:2 },
  custPts:        { fontSize:12, color:"#6d28d9", marginTop:4, fontWeight:600 },
  clearCustBtn:   { background:"none", border:"none", color:"#9ca3af", cursor:"pointer", fontSize:18, lineHeight:1 },
  redeemBox:      { background:"#f5f3ff", borderRadius:8, padding:"10px 12px", marginTop:8 },
  redeemLabel:    { fontSize:12, color:"#5b21b6", marginBottom:6, fontWeight:600 },
  redeemSaving:   { fontSize:12, color:"#16a34a", marginTop:6, fontWeight:600 },
  payBtns:        { display:"flex", gap:8 },
  payBtn:         { flex:1, padding:"9px 4px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, cursor:"pointer", background:"#f9fafb", fontWeight:500 },
  payBtnActive:   { background:"#eef2ff", borderColor:"#4f46e5", color:"#4f46e5" },
  discRow:        { display:"flex", gap:8 },
  select:         { flex:1, padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, background:"#fff", outline:"none" },
  input:          { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none" },
  summary:        { background:"#f9fafb", borderRadius:10, padding:"12px 14px", marginTop:10 },
  totalRow:       { display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:700, color:"#111827", paddingTop:8, marginTop:6, borderTop:"1px solid #e5e7eb" },
  totalAmt:       { color:"#4f46e5" },
  changeBox:      { background:"#f0fdf4", color:"#166534", padding:"8px 12px", borderRadius:8, fontSize:13, fontWeight:600, marginTop:8 },
  checkoutBtn:    { width:"100%", marginTop:14, padding:"13px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" },
  checkoutDisabled:{ background:"#c7d2fe", cursor:"not-allowed" },
};
