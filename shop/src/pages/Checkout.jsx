import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useShopAuth } from "../context/ShopAuthContext";
import { placeOrder } from "../api/shop";

export default function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const { customer } = useShopAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:     customer?.name  || "",
    phone:    customer?.phone || "",
    email:    customer?.email || "",
    fulfillment: "DELIVERY",
    address:  "",
    payment:  "COD",
    note:     "",
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const DELIVERY_FEE = form.fulfillment === "DELIVERY" ? 5.00 : 0.00;
  const total        = totalPrice + DELIVERY_FEE;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim())  return setError("Please enter your name");
    if (!form.phone.trim()) return setError("Please enter your phone number");
    if (form.fulfillment === "DELIVERY" && !form.address.trim()) return setError("Please enter your delivery address");
    if (cart.length === 0)  return setError("Your cart is empty");
    setLoading(true); setError("");
    try {
      const r = await placeOrder({
        customer_name:    form.name,
        customer_phone:   form.phone,
        customer_email:   form.email || null,
        fulfillment_type: form.fulfillment,
        delivery_address: form.fulfillment === "DELIVERY" ? form.address : null,
        payment_method:   form.payment,
        items:            cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        note:             form.note || null,
      });
      clearCart();
      navigate(`/order-success/${r.data.order_number}`);
    } catch(e) { setError(e.response?.data?.detail || "Error placing order"); }
    setLoading(false);
  };

  if (cart.length === 0) { navigate("/cart"); return null; }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>Checkout</h1>
        {error && <div style={s.error}>⚠️ {error}</div>}
        <div style={s.layout}>
          {/* Form */}
          <div style={s.formCol}>
            <Section title="👤 Contact Details">
              <L>Full name *</L>
              <input style={s.input} value={form.name}  onChange={e=>set("name",e.target.value)}  placeholder="Your full name"/>
              <L>Phone number *</L>
              <input style={s.input} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+65 9xxx xxxx"/>
              <L>Email (optional)</L>
              <input style={s.input} value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" type="email"/>
            </Section>

            <Section title="🚚 Fulfillment">
              <div style={s.optionRow}>
                {[["DELIVERY","🚚 Home Delivery","SGD 5.00 flat fee"],["PICKUP","🏪 Self Pickup","Free — collect from store"]].map(([val,label,sub])=>(
                  <div key={val} style={{...s.option,...(form.fulfillment===val?s.optionActive:{})}} onClick={()=>set("fulfillment",val)}>
                    <div style={s.optionLabel}>{label}</div>
                    <div style={s.optionSub}>{sub}</div>
                  </div>
                ))}
              </div>
              {form.fulfillment === "DELIVERY" && (
                <>
                  <L>Delivery address *</L>
                  <textarea style={{...s.input,height:80,resize:"vertical"}} value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Block, street, unit, postal code…"/>
                </>
              )}
            </Section>

            <Section title="💳 Payment">
              <div style={s.optionRow}>
                {[["COD","💵 Cash on Delivery","Pay when you receive"],["ONLINE","💳 Online Payment","Card or QR (coming soon)"]].map(([val,label,sub])=>(
                  <div key={val} style={{...s.option,...(form.payment===val?s.optionActive:{}),...(val==="ONLINE"?{opacity:.5,cursor:"not-allowed"}:{})}}
                    onClick={()=>val!=="ONLINE"&&set("payment",val)}>
                    <div style={s.optionLabel}>{label}</div>
                    <div style={s.optionSub}>{sub}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="📝 Note (optional)">
              <textarea style={{...s.input,height:70,resize:"vertical"}} value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Any special instructions…"/>
            </Section>
          </div>

          {/* Order summary */}
          <div style={s.summaryCol}>
            <div style={s.summaryCard}>
              <div style={s.summaryTitle}>Order Summary</div>
              {cart.map(item=>(
                <div key={item.id} style={s.summaryItem}>
                  <div style={s.siName}>{item.name} <span style={s.siQty}>×{item.quantity}</span></div>
                  <div style={s.siTotal}>SGD {(item.price*item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div style={s.divider}/>
              <Row label="Subtotal"     value={`SGD ${totalPrice.toFixed(2)}`}/>
              <Row label="Delivery"     value={form.fulfillment==="DELIVERY"?"SGD 5.00":"Free"}/>
              <div style={s.totalRow}><span>Total</span><span style={s.totalAmt}>SGD {total.toFixed(2)}</span></div>
              <button style={{...s.placeBtn,...(loading?{background:"#c7d2fe",cursor:"not-allowed"}:{})}} onClick={handleSubmit} disabled={loading}>
                {loading ? "Placing order…" : `Place Order · SGD ${total.toFixed(2)}`}
              </button>
              <div style={s.secureNote}>🔒 Secure checkout · No hidden fees</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, marginBottom:16 }}>
    <div style={{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:14 }}>{title}</div>
    {children}
  </div>;
}
function L({ children }) { return <div style={{ fontSize:12, color:"#6b7280", marginBottom:4, marginTop:10 }}>{children}</div>; }
function Row({ label, value }) { return <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#374151", padding:"5px 0" }}><span>{label}</span><span>{value}</span></div>; }

const s = {
  page:        { padding:"24px 20px", minHeight:"calc(100vh - 64px)", background:"#f9fafb" },
  inner:       { maxWidth:1000, margin:"0 auto" },
  title:       { fontSize:24, fontWeight:700, color:"#111827", marginBottom:20 },
  error:       { background:"#fef2f2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:9, padding:"10px 16px", fontSize:13, marginBottom:16 },
  layout:      { display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" },
  formCol:     {},
  input:       { width:"100%", padding:"10px 12px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" },
  optionRow:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 },
  option:      { border:"2px solid #e5e7eb", borderRadius:9, padding:"14px 16px", cursor:"pointer", transition:"all .15s" },
  optionActive:{ border:"2px solid #4f46e5", background:"#eef2ff" },
  optionLabel: { fontSize:14, fontWeight:600, color:"#111827", marginBottom:4 },
  optionSub:   { fontSize:12, color:"#6b7280" },
  summaryCol:  {},
  summaryCard: { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:80 },
  summaryTitle:{ fontSize:15, fontWeight:700, color:"#111827", marginBottom:14 },
  summaryItem: { display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f9fafb" },
  siName:      { fontSize:13, color:"#374151", flex:1 },
  siQty:       { color:"#9ca3af", fontSize:12 },
  siTotal:     { fontSize:13, fontWeight:600, color:"#111827" },
  divider:     { borderTop:"1px solid #e5e7eb", margin:"10px 0" },
  totalRow:    { display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:700, color:"#111827", padding:"10px 0", marginTop:4 },
  totalAmt:    { color:"#4f46e5" },
  placeBtn:    { width:"100%", padding:"14px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:12 },
  secureNote:  { textAlign:"center", fontSize:12, color:"#9ca3af", marginTop:10 },
};
