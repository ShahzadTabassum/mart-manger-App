import { useEffect, useState } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });
API.interceptors.request.use(config => {
  const token = localStorage.getItem("mm_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const STATUSES = ["PENDING","CONFIRMED","PROCESSING","READY","DELIVERED","CANCELLED"];
const STATUS_CLR = {
  PENDING:"#f59e0b", CONFIRMED:"#3b82f6", PROCESSING:"#8b5cf6",
  READY:"#10b981", DELIVERED:"#16a34a", CANCELLED:"#dc2626"
};
const NEXT_STATUS = {
  PENDING:"CONFIRMED", CONFIRMED:"PROCESSING",
  PROCESSING:"READY", READY:"DELIVERED"
};

export default function Orders() {
  const [orders,   setOrders]   = useState([]);
  const [filter,   setFilter]   = useState("");
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg,      setMsg]      = useState({ text:"", ok:true });

  const load = () => {
    setLoading(true);
    const params = filter ? `?status=${filter}` : "";
    API.get(`/shop/orders/admin/all${params}`)
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const showMsg = (text, ok=true) => { setMsg({text,ok}); setTimeout(()=>setMsg({text:"",ok:true}),3500); };

  const updateStatus = async (orderId, status, note="") => {
    setUpdating(true);
    try {
      await API.put(`/shop/orders/admin/${orderId}/status`, null, { params:{ status, note } });
      showMsg(`Order updated to ${status}`);
      load();
      if (selected?.id === orderId) {
        const r = await API.get(`/shop/orders/admin/all`);
        setSelected(r.data.find(o => o.id === orderId) || null);
      }
    } catch(e) { showMsg(e.response?.data?.detail || "Error updating order", false); }
    setUpdating(false);
  };

  const pending   = orders.filter(o => o.status === "PENDING").length;
  const confirmed = orders.filter(o => o.status === "CONFIRMED").length;
  const ready     = orders.filter(o => o.status === "READY").length;

  return (
    <div style={s.page}>
      <h1 style={s.h1}>🛍️ Online Orders</h1>

      {/* Stats */}
      <div style={s.statRow}>
        <Stat icon="🕐" label="Pending"   value={pending}   color="#f59e0b" onClick={()=>setFilter("PENDING")}/>
        <Stat icon="✅" label="Confirmed" value={confirmed} color="#3b82f6" onClick={()=>setFilter("CONFIRMED")}/>
        <Stat icon="📦" label="Ready"     value={ready}     color="#10b981" onClick={()=>setFilter("READY")}/>
        <Stat icon="📋" label="All today" value={orders.length} color="#4f46e5" onClick={()=>setFilter("")}/>
      </div>

      {msg.text && <div style={{...s.msg, background:msg.ok?"#f0fdf4":"#fef2f2", color:msg.ok?"#166534":"#dc2626", border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>{msg.ok?"✅":"❌"} {msg.text}</div>}

      <div style={s.layout}>
        {/* Orders list */}
        <div style={s.listCol}>
          {/* Filter tabs */}
          <div style={s.filterRow}>
            <button style={{...s.filterBtn,...(!filter?s.filterBtnActive:{})}} onClick={()=>setFilter("")}>All</button>
            {STATUSES.map(st=>(
              <button key={st} style={{...s.filterBtn,...(filter===st?{...s.filterBtnActive,background:STATUS_CLR[st]+"20",color:STATUS_CLR[st],borderColor:STATUS_CLR[st]}:{})}} onClick={()=>setFilter(st)}>
                {st}
              </button>
            ))}
          </div>

          {loading && <div style={s.loading}>Loading orders…</div>}
          {!loading && orders.length === 0 && <div style={s.empty}>No orders found</div>}

          {orders.map(order => (
            <div key={order.id}
              style={{...s.orderCard,...(selected?.id===order.id?s.orderCardActive:{})}}
              onClick={()=>setSelected(order)}
            >
              <div style={s.orderTop}>
                <div>
                  <div style={s.orderNum}>{order.order_number}</div>
                  <div style={s.orderMeta}>{order.customer_name} · {order.customer_phone}</div>
                  <div style={s.orderMeta}>{new Date(order.created_at).toLocaleString("en-SG")}</div>
                </div>
                <div style={s.orderRight}>
                  <span style={{...s.statusBadge, background:STATUS_CLR[order.status]+"20", color:STATUS_CLR[order.status]}}>
                    {order.status}
                  </span>
                  <div style={s.orderTotal}>SGD {order.total.toFixed(2)}</div>
                </div>
              </div>
              <div style={s.orderTags}>
                <span style={s.tag}>{order.fulfillment_type === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}</span>
                <span style={s.tag}>{order.payment_method === "COD" ? "💵 COD" : "💳 Online"}</span>
                <span style={s.tag}>{order.item_count || order.items?.length || 0} items</span>
              </div>
            </div>
          ))}
        </div>

        {/* Order detail */}
        <div style={s.detailCol}>
          {!selected ? (
            <div style={s.noDetail}>Click an order to see details and update its status</div>
          ) : (
            <div style={s.detailCard}>
              <div style={s.detailHeader}>
                <div>
                  <div style={s.detailNum}>{selected.order_number}</div>
                  <div style={s.detailDate}>{new Date(selected.created_at).toLocaleString("en-SG")}</div>
                </div>
                <span style={{...s.statusBadge, background:STATUS_CLR[selected.status]+"20", color:STATUS_CLR[selected.status], fontSize:13, padding:"5px 12px"}}>
                  {selected.status}
                </span>
              </div>

              <Section title="Customer">
                <Row label="Name"  value={selected.customer_name}/>
                <Row label="Phone" value={selected.customer_phone}/>
                {selected.customer_email && <Row label="Email" value={selected.customer_email}/>}
              </Section>

              <Section title="Fulfillment">
                <Row label="Type"    value={selected.fulfillment_type === "DELIVERY" ? "🚚 Home Delivery" : "🏪 Self Pickup"}/>
                <Row label="Payment" value={selected.payment_method === "COD" ? "💵 Cash on Delivery" : "💳 Online"}/>
                {selected.delivery_address && <Row label="Address" value={selected.delivery_address}/>}
              </Section>

              <Section title="Items">
                {(selected.items || []).map((item, i) => (
                  <div key={i} style={s.itemRow}>
                    <div style={s.itemName}>{item.product_name} <span style={s.itemQty}>×{item.quantity}</span></div>
                    <div style={s.itemTotal}>SGD {item.line_total.toFixed(2)}</div>
                  </div>
                ))}
                <div style={s.orderSummary}>
                  <Row label="Subtotal"  value={`SGD ${selected.subtotal.toFixed(2)}`}/>
                  <Row label="Delivery"  value={selected.delivery_fee > 0 ? `SGD ${selected.delivery_fee.toFixed(2)}` : "Free"}/>
                  <div style={s.totalRow}><span>Total</span><strong>SGD {selected.total.toFixed(2)}</strong></div>
                </div>
              </Section>

              {selected.note && <Section title="Note"><div style={{fontSize:13,color:"#374151"}}>{selected.note}</div></Section>}

              {/* Actions */}
              {selected.status !== "DELIVERED" && selected.status !== "CANCELLED" && (
                <Section title="Update Status">
                  <div style={s.actionBtns}>
                    {NEXT_STATUS[selected.status] && (
                      <button style={s.nextBtn} onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status])} disabled={updating}>
                        → Mark as {NEXT_STATUS[selected.status]}
                      </button>
                    )}
                    <button style={s.cancelBtn} onClick={() => {
                      const reason = prompt("Reason for cancellation (optional):");
                      updateStatus(selected.id, "CANCELLED", reason || "");
                    }} disabled={updating}>
                      ✕ Cancel Order
                    </button>
                  </div>
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color, onClick }) {
  return (
    <div style={{...ss.stat, borderTop:`3px solid ${color}`}} onClick={onClick}>
      <div style={{fontSize:22, marginBottom:4}}>{icon}</div>
      <div style={{fontSize:22, fontWeight:700, color}}>{value}</div>
      <div style={{fontSize:12, color:"#6b7280"}}>{label}</div>
    </div>
  );
}
function Section({ title, children }) {
  return <div style={{marginBottom:16}}>
    <div style={{fontSize:12,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>{title}</div>
    {children}
  </div>;
}
function Row({ label, value }) {
  return <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",color:"#374151"}}>
    <span style={{color:"#6b7280"}}>{label}</span><span style={{fontWeight:500}}>{value}</span>
  </div>;
}

const ss = { stat:{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 18px", flex:1, cursor:"pointer", minWidth:100 } };

const s = {
  page:         { padding:24, maxWidth:1300, margin:"0 auto" },
  h1:           { fontSize:22, fontWeight:700, color:"#111827", marginBottom:16 },
  statRow:      { display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" },
  msg:          { padding:"10px 16px", borderRadius:9, fontSize:13, marginBottom:14 },
  layout:       { display:"grid", gridTemplateColumns:"1fr 380px", gap:20 },
  listCol:      { display:"flex", flexDirection:"column", gap:10 },
  filterRow:    { display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 },
  filterBtn:    { padding:"6px 12px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff", color:"#6b7280" },
  filterBtnActive:{ background:"#4f46e5", color:"#fff", borderColor:"#4f46e5" },
  loading:      { textAlign:"center", padding:32, color:"#9ca3af" },
  empty:        { textAlign:"center", padding:32, color:"#9ca3af", fontSize:14 },
  orderCard:    { background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"border .15s" },
  orderCardActive:{ borderColor:"#4f46e5", boxShadow:"0 0 0 3px #eef2ff" },
  orderTop:     { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 },
  orderNum:     { fontSize:14, fontWeight:700, color:"#4f46e5" },
  orderMeta:    { fontSize:12, color:"#6b7280", marginTop:2 },
  orderRight:   { textAlign:"right" },
  statusBadge:  { display:"inline-block", padding:"3px 8px", borderRadius:20, fontSize:11, fontWeight:700, marginBottom:4 },
  orderTotal:   { fontSize:14, fontWeight:700, color:"#111827" },
  orderTags:    { display:"flex", gap:6, flexWrap:"wrap" },
  tag:          { background:"#f3f4f6", borderRadius:6, padding:"2px 8px", fontSize:11, color:"#6b7280" },
  detailCol:    {},
  noDetail:     { background:"#f9fafb", border:"2px dashed #e5e7eb", borderRadius:12, padding:40, textAlign:"center", color:"#9ca3af", fontSize:13 },
  detailCard:   { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20 },
  detailHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  detailNum:    { fontSize:16, fontWeight:700, color:"#4f46e5" },
  detailDate:   { fontSize:12, color:"#9ca3af", marginTop:4 },
  itemRow:      { display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f9fafb" },
  itemName:     { fontSize:13, color:"#374151" },
  itemQty:      { color:"#9ca3af", fontSize:12 },
  itemTotal:    { fontSize:13, fontWeight:600, color:"#111827" },
  orderSummary: { marginTop:10, paddingTop:10, borderTop:"1px solid #e5e7eb" },
  totalRow:     { display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:700, color:"#111827", paddingTop:8, marginTop:4, borderTop:"1px solid #e5e7eb" },
  actionBtns:   { display:"flex", gap:10, flexDirection:"column" },
  nextBtn:      { padding:"11px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" },
  cancelBtn:    { padding:"11px", background:"#fff", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" },
};
