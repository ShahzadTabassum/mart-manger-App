import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { trackOrder } from "../api/shop";

const STATUS_STEPS = ["PENDING","CONFIRMED","PROCESSING","READY","DELIVERED"];
const STATUS_INFO  = {
  PENDING:    { icon:"🕐", label:"Order Placed",     desc:"We received your order" },
  CONFIRMED:  { icon:"✅", label:"Confirmed",         desc:"Your order is confirmed" },
  PROCESSING: { icon:"⚙️", label:"Processing",        desc:"We're preparing your items" },
  READY:      { icon:"📦", label:"Ready",             desc:"Ready for pickup/delivery" },
  DELIVERED:  { icon:"🎉", label:"Delivered",         desc:"Order delivered successfully" },
  CANCELLED:  { icon:"❌", label:"Cancelled",         desc:"This order was cancelled" },
};

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [input,  setInput]  = useState(searchParams.get("order") || "");
  const [order,  setOrder]  = useState(null);
  const [loading,setLoading]= useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    if (searchParams.get("order")) handleTrack(searchParams.get("order"));
  }, []);

  const handleTrack = async (num) => {
    const n = (num || input).trim().toUpperCase();
    if (!n) return setError("Please enter your order number");
    setLoading(true); setError(""); setOrder(null);
    try {
      const r = await trackOrder(n);
      setOrder(r.data);
    } catch { setError("Order not found. Please check your order number."); }
    setLoading(false);
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const isCancelled = order?.status === "CANCELLED";

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <h1 style={s.title}>📦 Track Your Order</h1>
        <p style={s.sub}>Enter your order number to check the delivery status</p>

        {/* Search */}
        <div style={s.searchBox}>
          <input style={s.input} placeholder="e.g. ORD-20260527-001"
            value={input} onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleTrack()} />
          <button style={s.searchBtn} onClick={() => handleTrack()} disabled={loading}>
            {loading ? "Searching…" : "Track →"}
          </button>
        </div>

        {error && <div style={s.error}>⚠️ {error}</div>}

        {order && (
          <div style={s.resultCard}>
            {/* Header */}
            <div style={s.resultHeader}>
              <div>
                <div style={s.orderNum}>{order.order_number}</div>
                <div style={s.orderMeta}>
                  {order.customer_name} · {order.customer_phone}
                </div>
                <div style={s.orderMeta}>
                  {order.fulfillment_type === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"} ·
                  {order.payment_method === "COD" ? " 💵 Cash on Delivery" : " 💳 Online"}
                </div>
              </div>
              <div style={s.totalBox}>
                <div style={s.totalLabel}>Total</div>
                <div style={s.totalAmt}>SGD {order.total.toFixed(2)}</div>
              </div>
            </div>

            {/* Progress */}
            {!isCancelled ? (
              <div style={s.progress}>
                {STATUS_STEPS.map((step, i) => {
                  const done    = i <= currentStep;
                  const current = i === currentStep;
                  const info    = STATUS_INFO[step];
                  return (
                    <div key={step} style={s.stepWrap}>
                      <div style={{ ...s.stepCircle, ...(done ? s.stepDone : {}), ...(current ? s.stepCurrent : {}) }}>
                        {done ? info.icon : i + 1}
                      </div>
                      <div style={s.stepLabel}>{info.label}</div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{ ...s.stepLine, ...(i < currentStep ? s.stepLineDone : {}) }} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={s.cancelledBox}>
                ❌ This order has been cancelled
                {order.cancelled_reason && <div style={{ fontSize:13, marginTop:6 }}>{order.cancelled_reason}</div>}
              </div>
            )}

            {/* Items */}
            <div style={s.itemsTitle}>Items Ordered</div>
            {order.items.map((item, i) => (
              <div key={i} style={s.itemRow}>
                <div style={s.itemName}>{item.product_name} <span style={s.itemQty}>×{item.quantity}</span></div>
                <div style={s.itemTotal}>SGD {item.line_total.toFixed(2)}</div>
              </div>
            ))}

            {/* History */}
            {order.history?.length > 0 && (
              <>
                <div style={s.itemsTitle}>Status History</div>
                {order.history.map((h, i) => (
                  <div key={i} style={s.histRow}>
                    <div style={s.histDot} />
                    <div>
                      <div style={s.histStatus}>{STATUS_INFO[h.status]?.icon} {h.status}</div>
                      {h.note && <div style={s.histNote}>{h.note}</div>}
                      <div style={s.histDate}>{new Date(h.created_at).toLocaleString("en-SG")}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:        { padding:"32px 20px", minHeight:"calc(100vh - 64px)", background:"#f9fafb" },
  inner:       { maxWidth:700, margin:"0 auto" },
  title:       { fontSize:28, fontWeight:800, color:"#111827", marginBottom:8, textAlign:"center" },
  sub:         { fontSize:15, color:"#6b7280", marginBottom:28, textAlign:"center" },
  searchBox:   { display:"flex", gap:10, marginBottom:16 },
  input:       { flex:1, padding:"13px 16px", border:"2px solid #4f46e5", borderRadius:10, fontSize:14, outline:"none" },
  searchBtn:   { padding:"13px 24px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor:"pointer" },
  error:       { background:"#fef2f2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:9, padding:"12px 16px", fontSize:13, marginBottom:16 },
  resultCard:  { background:"#fff", border:"1px solid #e5e7eb", borderRadius:14, padding:24 },
  resultHeader:{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, gap:12 },
  orderNum:    { fontSize:20, fontWeight:800, color:"#4f46e5", marginBottom:6 },
  orderMeta:   { fontSize:13, color:"#6b7280", marginTop:3 },
  totalBox:    { textAlign:"right", flexShrink:0 },
  totalLabel:  { fontSize:12, color:"#9ca3af" },
  totalAmt:    { fontSize:20, fontWeight:800, color:"#111827" },
  progress:    { display:"flex", alignItems:"flex-start", gap:0, marginBottom:28, position:"relative" },
  stepWrap:    { display:"flex", flexDirection:"column", alignItems:"center", flex:1, position:"relative" },
  stepCircle:  { width:36, height:36, borderRadius:"50%", border:"2px solid #e5e7eb", background:"#f9fafb", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#9ca3af", zIndex:1 },
  stepDone:    { border:"2px solid #4f46e5", background:"#eef2ff", color:"#4f46e5" },
  stepCurrent: { border:"3px solid #4f46e5", background:"#4f46e5", color:"#fff", boxShadow:"0 0 0 4px #eef2ff" },
  stepLabel:   { fontSize:11, color:"#6b7280", marginTop:6, textAlign:"center" },
  stepLine:    { position:"absolute", top:18, left:"50%", width:"100%", height:2, background:"#e5e7eb", zIndex:0 },
  stepLineDone:{ background:"#4f46e5" },
  cancelledBox:{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:16, fontSize:14, fontWeight:700, color:"#dc2626", marginBottom:20, textAlign:"center" },
  itemsTitle:  { fontSize:13, fontWeight:700, color:"#374151", textTransform:"uppercase", letterSpacing:".05em", margin:"20px 0 10px" },
  itemRow:     { display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid #f9fafb", fontSize:13 },
  itemName:    { color:"#374151" },
  itemQty:     { color:"#9ca3af" },
  itemTotal:   { fontWeight:600, color:"#111827" },
  histRow:     { display:"flex", gap:12, padding:"8px 0", borderLeft:"2px solid #e5e7eb", paddingLeft:16, marginLeft:8, marginBottom:4 },
  histDot:     { width:10, height:10, borderRadius:"50%", background:"#4f46e5", flexShrink:0, marginTop:4, marginLeft:-21 },
  histStatus:  { fontSize:13, fontWeight:700, color:"#111827" },
  histNote:    { fontSize:12, color:"#6b7280", marginTop:2 },
  histDate:    { fontSize:11, color:"#9ca3af", marginTop:2 },
};
