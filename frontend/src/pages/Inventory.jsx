import { useEffect, useState } from "react";
import { getLowStock, recordMovement, getProducts } from "../api/products";
export default function Inventory() {
  const [lowStock,setLowStock]=useState([]);
  const [products,setProducts]=useState([]);
  const [form,setForm]=useState({product_id:"",movement_type:"IN",quantity:1,note:"",created_by:""});
  const [msg,setMsg]=useState("");
  const load=()=>{getLowStock().then(r=>setLowStock(r.data));getProducts().then(r=>setProducts(r.data));};
  useEffect(load,[]);
  const handleSubmit=async()=>{
    try{
      await recordMovement({...form,product_id:parseInt(form.product_id),quantity:parseInt(form.quantity)});
      setMsg("✅ Stock updated successfully!");
      setForm({product_id:"",movement_type:"IN",quantity:1,note:"",created_by:""});
      load();setTimeout(()=>setMsg(""),3000);
    }catch(e){setMsg("❌ "+(e.response?.data?.detail||"Error"));}
  };
  const F=({k,...p})=><input style={s.input} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} {...p}/>;
  return (
    <div style={s.page}>
      <h1 style={s.h1}>Inventory Management</h1>
      <p style={s.sub}>Track stock movements and monitor low stock alerts.</p>
      <div style={s.layout}>
        <div style={s.card}>
          <div style={s.cardTitle}>📋 Record Stock Movement</div>
          {msg&&<div style={s.msg}>{msg}</div>}
          <L>Product *</L>
          <select style={s.input} value={form.product_id} onChange={e=>setForm(f=>({...f,product_id:e.target.value}))}>
            <option value="">Select product</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
          </select>
          <L>Movement type *</L>
          <select style={s.input} value={form.movement_type} onChange={e=>setForm(f=>({...f,movement_type:e.target.value}))}>
            <option value="IN">IN — Stock received</option>
            <option value="OUT">OUT — Stock sold/used</option>
            <option value="ADJUSTMENT">ADJUSTMENT — Manual correction</option>
          </select>
          <L>Quantity *</L><F k="quantity" type="number" min="1"/>
          <L>Note</L><F k="note" placeholder="e.g. Received from supplier"/>
          <L>Done by</L><F k="created_by" placeholder="Your name"/>
          <button style={s.btn} onClick={handleSubmit}>Record movement</button>
        </div>
        <div style={s.card}>
          <div style={s.cardTitle}>⚠️ Low Stock Alerts ({lowStock.length})</div>
          {lowStock.length===0?<div style={s.empty}>✅ All stock levels are healthy!</div>
          :lowStock.map(i=>(
            <div key={i.product_id} style={s.alertRow}>
              <div><div style={s.aName}>{i.product_name}</div><code style={s.aSku}>{i.sku}</code></div>
              <div style={s.aRight}><div style={s.aQty}>{i.quantity} left</div><div style={s.aAlert}>alert at {i.low_stock_alert}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function L({children}){return <div style={{fontSize:12,color:"#6b7280",marginBottom:4,marginTop:12}}>{children}</div>;}
const s={page:{padding:28,maxWidth:1000,margin:"0 auto"},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:4},sub:{fontSize:13,color:"#9ca3af",marginBottom:24},layout:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20},card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20},cardTitle:{fontWeight:700,fontSize:15,color:"#111827",marginBottom:16},input:{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",outline:"none"},btn:{marginTop:18,width:"100%",padding:"10px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:9,fontSize:14,fontWeight:600,cursor:"pointer"},msg:{padding:"10px 14px",borderRadius:8,background:"#f0fdf4",color:"#166534",fontSize:13,marginBottom:12},empty:{color:"#16a34a",fontSize:13,padding:"20px 0",textAlign:"center"},alertRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f3f4f6"},aName:{fontSize:13,fontWeight:600,color:"#111827"},aSku:{fontSize:11,background:"#fef2f2",color:"#dc2626",padding:"2px 6px",borderRadius:4},aRight:{textAlign:"right"},aQty:{fontSize:15,fontWeight:700,color:"#dc2626"},aAlert:{fontSize:11,color:"#9ca3af"}};
