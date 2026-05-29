import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/shop";
import { useShopAuth } from "../context/ShopAuthContext";

const STATUS_CLR = {
  PENDING:"#f59e0b", CONFIRMED:"#3b82f6", PROCESSING:"#8b5cf6",
  READY:"#10b981", DELIVERED:"#16a34a", CANCELLED:"#dc2626"
};

export default function Account() {
  const { customer, logout } = useShopAuth();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!customer) { navigate("/login"); return; }
    getMyOrders().then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, [customer]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Profile header */}
        <div style={s.profileCard}>
          <div style={s.avatar}>{customer?.name?.[0]?.toUpperCase()}</div>
          <div style={s.profileInfo}>
            <div style={s.profileName}>{customer?.name}</div>
            <div style={s.profilePhone}>{customer?.phone}</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        <h2 style={s.ordersTitle}>My Orders ({orders.length})</h2>

        {loading && <div style={s.loading}>Loading your orders…</div>}

        {!loading && orders.length === 0 && (
          <div style={s.empty}>
            <div style={{fontSize:48, marginBottom:12}}>📦</div>
            <div style={{fontSize:16, fontWeight:600, color:"#374151", marginBottom:8}}>No orders yet</div>
            <Link to="/shop" style={s.shopBtn}>Start Shopping →</Link>
          </div>
        )}

        {orders.map(order => (
          <div key={order.id} style={s.orderCard}>
            <div style={s.orderTop}>
              <div>
                <div style={s.orderNum}>{order.order_number}</div>
                <div style={s.orderDate}>{new Date(order.created_at).toLocaleDateString("en-SG", { day:"numeric", month:"long", year:"numeric" })}</div>
              </div>
              <div style={s.orderRight}>
                <span style={{...s.statusBadge, background: STATUS_CLR[order.status]+"20", color: STATUS_CLR[order.status]}}>
                  {order.status}
                </span>
                <div style={s.orderTotal}>SGD {order.total.toFixed(2)}</div>
              </div>
            </div>
            <div style={s.orderItems}>
              {order.items.map((item, i) => (
                <span key={i} style={s.orderItem}>{item.product_name} ×{item.quantity}</span>
              ))}
            </div>
            <div style={s.orderFooter}>
              <span style={s.fulfillTag}>{order.fulfillment_type === "DELIVERY" ? "🚚 Delivery" : "🏪 Pickup"}</span>
              <Link to={`/track?order=${order.order_number}`} style={s.trackLink}>Track →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page:        { padding:"24px 20px", minHeight:"calc(100vh - 64px)", background:"#f9fafb" },
  inner:       { maxWidth:700, margin:"0 auto" },
  profileCard: { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"20px 24px", display:"flex", alignItems:"center", gap:16, marginBottom:24 },
  avatar:      { width:52, height:52, borderRadius:"50%", background:"#4f46e5", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, flexShrink:0 },
  profileInfo: { flex:1 },
  profileName: { fontSize:18, fontWeight:700, color:"#111827" },
  profilePhone:{ fontSize:13, color:"#6b7280", marginTop:2 },
  logoutBtn:   { padding:"8px 16px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", fontSize:13, cursor:"pointer", color:"#374151" },
  ordersTitle: { fontSize:18, fontWeight:700, color:"#111827", marginBottom:14 },
  loading:     { textAlign:"center", padding:40, color:"#9ca3af" },
  empty:       { textAlign:"center", padding:60 },
  shopBtn:     { padding:"12px 24px", background:"#4f46e5", color:"#fff", borderRadius:9, textDecoration:"none", fontWeight:600, fontSize:14 },
  orderCard:   { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"16px 20px", marginBottom:12 },
  orderTop:    { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 },
  orderNum:    { fontSize:15, fontWeight:700, color:"#4f46e5" },
  orderDate:   { fontSize:12, color:"#9ca3af", marginTop:3 },
  orderRight:  { textAlign:"right" },
  statusBadge: { display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, marginBottom:4 },
  orderTotal:  { fontSize:15, fontWeight:700, color:"#111827" },
  orderItems:  { display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 },
  orderItem:   { background:"#f3f4f6", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#374151" },
  orderFooter: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  fulfillTag:  { fontSize:12, color:"#6b7280" },
  trackLink:   { fontSize:13, color:"#4f46e5", fontWeight:600, textDecoration:"none" },
};
