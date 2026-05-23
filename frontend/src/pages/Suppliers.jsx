import { useEffect, useState } from "react";
import { getSuppliers } from "../api/products";
export default function Suppliers() {
  const [suppliers,setSuppliers]=useState([]);
  useEffect(()=>{getSuppliers().then(r=>setSuppliers(r.data));},[]);
  return (
    <div style={s.page}>
      <h1 style={s.h1}>Suppliers</h1>
      <p style={s.sub}>{suppliers.length} suppliers registered</p>
      <div style={s.grid}>
        {suppliers.map(sup=>(
          <div key={sup.id} style={s.card}>
            <div style={s.icon}>🚚</div>
            <div style={s.name}>{sup.name}</div>
            {sup.contact_name&&<div style={s.row}>👤 {sup.contact_name}</div>}
            {sup.phone&&<div style={s.row}>📞 {sup.phone}</div>}
            {sup.email&&<div style={s.row}>✉️ {sup.email}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
const s={page:{padding:28,maxWidth:900,margin:"0 auto"},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:4},sub:{fontSize:13,color:"#9ca3af",marginBottom:24},grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16},card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20},icon:{fontSize:28,marginBottom:10},name:{fontWeight:700,fontSize:15,color:"#111827",marginBottom:10},row:{fontSize:13,color:"#6b7280",marginBottom:6}};
