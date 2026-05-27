import { useEffect, useState } from "react";
import { getLowStock } from "../api/products";
import { getDashboardStats } from "../api/sales";
import { useAuth } from "../context/AuthContext";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const PIE_COLORS = { CASH:"#4f46e5", CARD:"#06b6d4", QR:"#10b981" };
const PIE_LABELS = { CASH:"💵 Cash", CARD:"💳 Card", QR:"📱 QR" };

function StatCard({ icon, label, value, sub, subColor="#16a34a", trend }) {
  return (
    <div style={sc.card}>
      <div style={sc.top}>
        <div style={sc.icon}>{icon}</div>
        {trend !== undefined && (
          <div style={{fontSize:12, color: trend >= 0 ? "#16a34a" : "#dc2626", fontWeight:600}}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div style={sc.value}>{value}</div>
      <div style={sc.label}>{label}</div>
      {sub && <div style={{...sc.sub, color: subColor}}>{sub}</div>}
    </div>
  );
}
const sc = {
  card:  { background:"#fff", borderRadius:12, padding:"18px 20px", border:"1px solid #e5e7eb", flex:1, minWidth:160 },
  top:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  icon:  { fontSize:24 },
  value: { fontSize:26, fontWeight:700, color:"#111827" },
  label: { fontSize:12, color:"#6b7280", marginTop:2 },
  sub:   { fontSize:12, marginTop:4 },
};

function ChartCard({ title, children, action }) {
  return (
    <div style={cc.card}>
      <div style={cc.header}>
        <div style={cc.title}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
const cc = {
  card:   { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"18px 20px" },
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  title:  { fontSize:15, fontWeight:700, color:"#111827" },
};

const CustomTooltip = ({ active, payload, label, prefix="SGD " }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:8, padding:"8px 14px", fontSize:13 }}>
      <div style={{ color:"#6b7280", marginBottom:4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight:600 }}>{p.name}: {prefix}{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [range,    setRange]    = useState("7"); // "7" or "30"
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getLowStock()])
      .then(([s, l]) => { setStats(s.data); setLowStock(l.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#6b7280" }}>Loading dashboard…</div>;

  const revenueData = range === "7" ? stats?.revenue_7days : stats?.revenue_30days;
  const trend = stats?.last_month_revenue > 0
    ? ((stats.this_month_revenue - stats.last_month_revenue) / stats.last_month_revenue) * 100
    : null;

  const pieData = (stats?.payment_breakdown || []).map(p => ({
    name: PIE_LABELS[p.method] || p.method,
    value: parseFloat(p.revenue),
    count: p.count,
  }));

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <h1 style={s.h1}>Dashboard</h1>
          <p style={s.sub}>Welcome back, {user?.name}! Here's your mart overview.</p>
        </div>
        <div style={s.dateLabel}>{new Date().toLocaleDateString("en-SG", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</div>
      </div>

      {/* Stat cards */}
      <div style={s.statRow}>
        <StatCard icon="💰" label="Today's revenue"    value={`SGD ${stats?.today?.revenue?.toFixed(2) || "0.00"}`} sub={`${stats?.today?.transactions || 0} transactions`} />
        <StatCard icon="📅" label="This month"         value={`SGD ${stats?.this_month_revenue?.toFixed(2) || "0.00"}`} trend={trend} sub="vs last month" />
        <StatCard icon="👥" label="Total customers"    value={stats?.total_customers || 0} sub="Registered" />
        <StatCard icon="⚠️" label="Low stock alerts"   value={lowStock.length} sub={lowStock.length > 0 ? "Need reorder" : "All healthy"} subColor={lowStock.length > 0 ? "#dc2626" : "#16a34a"} />
      </div>

      {/* Revenue chart + Pie chart */}
      <div style={s.chartRow}>
        <div style={{ flex:2 }}>
          <ChartCard
            title="Revenue trend"
            action={
              <div style={s.rangeBtns}>
                {[["7","7 days"],["30","30 days"]].map(([v,l]) => (
                  <button key={v} style={{...s.rangeBtn,...(range===v?s.rangeBtnActive:{})}} onClick={()=>setRange(v)}>{l}</button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData} margin={{top:4,right:8,bottom:0,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="date" tick={{fontSize:11}} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{fontSize:11}} tickFormatter={v => `${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4f46e5" strokeWidth={2.5} dot={{r:3}} activeDot={{r:5}} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div style={{ flex:1 }}>
          <ChartCard title="Payment methods">
            {pieData.length === 0
              ? <div style={s.noData}>No sales data yet</div>
              : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={Object.values(PIE_COLORS)[i] || "#a5b4fc"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`SGD ${v.toFixed(2)}`, "Revenue"]} />
                  <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{fontSize:12}}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Top products + Low stock */}
      <div style={s.chartRow}>
        <div style={{ flex:2 }}>
          <ChartCard title="🏆 Top selling products">
            {!stats?.top_products?.length
              ? <div style={s.noData}>No sales data yet</div>
              : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.top_products} layout="vertical" margin={{top:0,right:16,bottom:0,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:11}} tickFormatter={v=>`${v}`} />
                  <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={130} tickFormatter={v => v.length > 18 ? v.slice(0,17)+"…" : v} />
                  <Tooltip content={<CustomTooltip prefix="" />} />
                  <Bar dataKey="units_sold" name="Units sold" fill="#4f46e5" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div style={{ flex:1 }}>
          <ChartCard title="⚠️ Low Stock">
            {lowStock.length === 0
              ? <div style={{...s.noData, color:"#16a34a"}}>✅ All stock healthy!</div>
              : lowStock.slice(0,6).map(i => (
                <div key={i.product_id} style={s.stockRow}>
                  <div>
                    <div style={s.stockName}>{i.product_name}</div>
                    <code style={s.stockSku}>{i.sku}</code>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#dc2626"}}>{i.quantity}</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>of {i.max_stock}</div>
                  </div>
                </div>
              ))
            }
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:          { padding:24, maxWidth:1200, margin:"0 auto" },
  topbar:        { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:10 },
  h1:            { fontSize:22, fontWeight:700, color:"#111827", marginBottom:4 },
  sub:           { fontSize:14, color:"#6b7280" },
  dateLabel:     { fontSize:13, color:"#9ca3af", paddingTop:4 },
  statRow:       { display:"flex", gap:14, marginBottom:20, flexWrap:"wrap" },
  chartRow:      { display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" },
  rangeBtns:     { display:"flex", gap:6 },
  rangeBtn:      { padding:"4px 12px", border:"1px solid #e5e7eb", borderRadius:6, fontSize:12, cursor:"pointer", background:"#f9fafb", color:"#6b7280" },
  rangeBtnActive:{ background:"#4f46e5", color:"#fff", borderColor:"#4f46e5" },
  noData:        { textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:13 },
  stockRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f9fafb" },
  stockName:     { fontSize:13, fontWeight:600, color:"#111827" },
  stockSku:      { fontSize:11, background:"#fef2f2", color:"#dc2626", padding:"2px 6px", borderRadius:4 },
};
