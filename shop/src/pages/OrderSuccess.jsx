import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { trackOrder } from "../api/shop";

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderNumber) trackOrder(orderNumber).then(r => setOrder(r.data)).catch(()=>{});
  }, [orderNumber]);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.icon}>✅</div>
        <h1 style={s.title}>Order Placed!</h1>
        <p style={s.sub}>Thank you for your order. We'll get it ready for you.</p>

        <div style={s.orderNo}>
          <div style={s.orderLabel}>Your Order Number</div>
          <div style={s.orderNum}>{orderNumber}</div>
          <div style={s.orderHint}>Save this number to track your order</div>
        </div>

        {order && (
          <div style={s.details}>
            <Row label="Fulfillment"   value={order.fulfillment_type === "DELIVERY" ? "🚚 Home Delivery" : "🏪 Self Pickup"} />
            <Row label="Payment"       value={order.payment_method === "COD" ? "💵 Cash on Delivery" : "💳 Online"} />
            <Row label="Total"         value={`SGD ${order.total.toFixed(2)}`} />
            <Row label="Status"        value={<StatusBadge status={order.status}/>} />
            {order.delivery_address && <Row label="Deliver to" value={order.delivery_address}/>}
          </div>
        )}

        <div style={s.actions}>
          <Link to={`/track?order=${orderNumber}`} style={s.trackBtn}>📦 Track Order</Link>
          <Link to="/shop" style={s.shopBtn}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f3f4f6", fontSize:13 }}>
      <span style={{ color:"#6b7280" }}>{label}</span>
      <span style={{ fontWeight:600, color:"#111827" }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = { PENDING:"#f59e0b", CONFIRMED:"#3b82f6", PROCESSING:"#8b5cf6", READY:"#10b981", DELIVERED:"#16a34a", CANCELLED:"#dc2626" };
  return <span style={{ background: colors[status]+"20", color: colors[status], padding:"2px 8px", borderRadius:20, fontSize:12, fontWeight:700 }}>{status}</span>;
}

const s = {
  page:      { minHeight:"calc(100vh - 64px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px", background:"#f9fafb" },
  card:      { background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"40px 36px", maxWidth:480, width:"100%", textAlign:"center" },
  icon:      { fontSize:56, marginBottom:16 },
  title:     { fontSize:26, fontWeight:800, color:"#111827", marginBottom:8 },
  sub:       { fontSize:15, color:"#6b7280", marginBottom:24 },
  orderNo:   { background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:12, padding:"16px 20px", marginBottom:20 },
  orderLabel:{ fontSize:12, color:"#6b7280", marginBottom:6, textTransform:"uppercase", letterSpacing:".05em" },
  orderNum:  { fontSize:22, fontWeight:800, color:"#4f46e5", letterSpacing:".05em" },
  orderHint: { fontSize:12, color:"#9ca3af", marginTop:6 },
  details:   { textAlign:"left", marginBottom:24 },
  actions:   { display:"flex", gap:10, flexDirection:"column" },
  trackBtn:  { padding:"13px", background:"#4f46e5", color:"#fff", borderRadius:9, textDecoration:"none", fontWeight:700, fontSize:14 },
  shopBtn:   { padding:"13px", border:"1px solid #e5e7eb", borderRadius:9, textDecoration:"none", color:"#374151", fontSize:14, fontWeight:500 },
};
