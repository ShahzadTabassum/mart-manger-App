import { useEffect, useState } from "react";
import { getProducts, getLowStock } from "../api/products";
import StatCard from "../components/StatCard";
export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  useEffect(() => {
    getProducts().then(r=>setProducts(r.data));
    getLowStock().then(r=>setLowStock(r.data));
  }, []);
  const totalStock = products.reduce((a,p)=>a+(p.inventory?.quantity||0),0);
  const categories = [...new Set(products.map(p=>p.category?.name))].filter(Boolean);
  return (
    <div style={s.page}>
      <h1 style={s.h1}>Dashboard</h1>
      <p style={s.sub}>Welcome back! Here's your mart overview.</p>
      <div style={s.statRow}>
        <StatCard icon="📦" label="Total products"   value={products.length}  sub="Active items"/>
        <StatCard icon="🗃️"  label="Total stock"      value={totalStock}       sub="Units in store"/>
        <StatCard icon="⚠️"  label="Low stock alerts" value={lowStock.length}  sub="Need reorder" subColor={lowStock.length>0?"#dc2626":"#16a34a"}/>
        <StatCard icon="🏷️"  label="Categories"       value={categories.length} sub={categories.join(" · ")}/>
      </div>
      {lowStock.length>0&&(
        <div style={s.alertBox}>
          <div style={s.alertTitle}>⚠️ Low Stock — Reorder Needed</div>
          <table style={s.table}><thead><tr>{["Product","SKU","Stock","Alert at","Max"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>{lowStock.map(i=>(
            <tr key={i.product_id} style={s.tr}>
              <td style={s.td}>{i.product_name}</td>
              <td style={s.td}><code style={s.sku}>{i.sku}</code></td>
              <td style={{...s.td,color:"#dc2626",fontWeight:700}}>{i.quantity}</td>
              <td style={s.td}>{i.low_stock_alert}</td>
              <td style={s.td}>{i.max_stock}</td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
      <div style={s.recentBox}>
        <div style={s.boxTitle}>Recent Products</div>
        {products.slice(0,5).map(p=>(
          <div key={p.id} style={s.recentRow}>
            <div><div style={s.pName}>{p.name}</div><div style={s.pSku}>{p.sku} · {p.category?.name}</div></div>
            <div style={s.pRight}>
              <div style={s.pPrice}>SGD {parseFloat(p.price).toFixed(2)}</div>
              <div style={{fontSize:12,color:p.inventory?.quantity<=p.inventory?.low_stock_alert?"#dc2626":"#16a34a"}}>{p.inventory?.quantity??0} units</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
const s={page:{padding:28,maxWidth:960,margin:"0 auto"},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:4},sub:{fontSize:14,color:"#6b7280",marginBottom:24},statRow:{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"},alertBox:{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:12,padding:20,marginBottom:24},alertTitle:{fontWeight:700,color:"#dc2626",marginBottom:12,fontSize:14},table:{width:"100%",borderCollapse:"collapse"},th:{textAlign:"left",fontSize:11,color:"#6b7280",textTransform:"uppercase",paddingBottom:8,borderBottom:"1px solid #fca5a5"},tr:{borderBottom:"1px solid #fee2e2"},td:{padding:"8px 0",fontSize:13,color:"#374151"},sku:{background:"#fee2e2",padding:"2px 6px",borderRadius:4,fontSize:11},recentBox:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20},boxTitle:{fontWeight:700,color:"#111827",marginBottom:16,fontSize:15},recentRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f3f4f6"},pName:{fontSize:14,fontWeight:600,color:"#111827"},pSku:{fontSize:12,color:"#9ca3af",marginTop:2},pRight:{textAlign:"right"},pPrice:{fontSize:14,fontWeight:600,color:"#4f46e5"}};
