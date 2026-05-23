import { useEffect, useState } from "react";
import { getProducts, deleteProduct, getCategories } from "../api/products";
import ProductModal from "../components/ProductModal";
const CC = {"Garment":{bg:"#ede9fe",color:"#5b21b6"},"Baby Shoes":{bg:"#d1fae5",color:"#065f46"},"Kids Accessory":{bg:"#fef3c7",color:"#92400e"}};
export default function Products() {
  const [products,setProducts]=useState([]);
  const [categories,setCategories]=useState([]);
  const [search,setSearch]=useState("");
  const [catFilter,setCatFilter]=useState("");
  const [lowFilter,setLowFilter]=useState(false);
  const [modal,setModal]=useState(null);
  const [loading,setLoading]=useState(true);
  const load=async()=>{
    setLoading(true);
    const params={};
    if(search)params.search=search;
    if(catFilter)params.category_id=catFilter;
    if(lowFilter)params.low_stock=true;
    const r=await getProducts(params);
    setProducts(r.data);setLoading(false);
  };
  useEffect(()=>{getCategories().then(r=>setCategories(r.data));},[]);
  useEffect(()=>{load();},[search,catFilter,lowFilter]);
  const handleDelete=async(p)=>{if(!window.confirm(`Remove "${p.name}"?`))return;await deleteProduct(p.id);load();};
  const stockPct=inv=>inv?Math.round(inv.quantity/(inv.max_stock||100)*100):0;
  const stockColor=inv=>{if(!inv||inv.quantity===0)return"#dc2626";if(inv.quantity<=inv.low_stock_alert)return"#f59e0b";return"#16a34a";};
  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div><h1 style={s.h1}>Products</h1><p style={s.sub}>{products.length} items</p></div>
        <button style={s.addBtn} onClick={()=>setModal("add")}>+ Add product</button>
      </div>
      <div style={s.filters}>
        <input style={s.search} placeholder="🔍  Search by name or SKU…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={s.select} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button style={{...s.filterBtn,...(lowFilter?s.filterBtnActive:{})}} onClick={()=>setLowFilter(f=>!f)}>⚠️ Low stock</button>
      </div>
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead><tr>{["Product / SKU","Category","Price","Cost","Stock","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {loading?<tr><td colSpan={6} style={s.empty}>Loading…</td></tr>
            :products.length===0?<tr><td colSpan={6} style={s.empty}>No products found</td></tr>
            :products.map(p=>{
              const inv=p.inventory;
              const cc=CC[p.category?.name]||{bg:"#f3f4f6",color:"#374151"};
              return(
                <tr key={p.id} style={s.tr}>
                  <td style={s.td}><div style={s.pName}>{p.name}</div><code style={s.pSku}>{p.sku}</code></td>
                  <td style={s.td}><span style={{...s.badge,background:cc.bg,color:cc.color}}>{p.category?.name}</span></td>
                  <td style={s.td}><strong>SGD {parseFloat(p.price).toFixed(2)}</strong></td>
                  <td style={s.td}>{p.cost_price?`SGD ${parseFloat(p.cost_price).toFixed(2)}`:"—"}</td>
                  <td style={s.td}>
                    <div style={{color:stockColor(inv),fontWeight:700,fontSize:13}}>{inv?`${inv.quantity} units`:"—"}</div>
                    {inv&&<div style={s.barBg}><div style={{...s.barFill,width:`${Math.min(stockPct(inv),100)}%`,background:stockColor(inv)}}/></div>}
                  </td>
                  <td style={s.td}><div style={s.actions}><button style={s.editBtn} onClick={()=>setModal(p)}>✏️ Edit</button><button style={s.delBtn} onClick={()=>handleDelete(p)}>🗑️</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal&&<ProductModal product={modal==="add"?null:modal} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
    </div>
  );
}
const s={page:{padding:28,maxWidth:1100,margin:"0 auto"},topbar:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:2},sub:{fontSize:13,color:"#9ca3af"},addBtn:{background:"#4f46e5",color:"#fff",border:"none",borderRadius:9,padding:"10px 18px",fontSize:13,fontWeight:600,cursor:"pointer"},filters:{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"},search:{flex:1,minWidth:200,padding:"9px 14px",border:"1px solid #d1d5db",borderRadius:9,fontSize:13,outline:"none"},select:{padding:"9px 12px",border:"1px solid #d1d5db",borderRadius:9,fontSize:13,background:"#fff",outline:"none"},filterBtn:{padding:"9px 14px",border:"1px solid #d1d5db",borderRadius:9,fontSize:13,cursor:"pointer",background:"#fff"},filterBtnActive:{background:"#fef3c7",borderColor:"#f59e0b",color:"#92400e"},tableWrap:{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"},table:{width:"100%",borderCollapse:"collapse"},th:{textAlign:"left",fontSize:11,color:"#6b7280",textTransform:"uppercase",padding:"12px 16px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",letterSpacing:".04em"},tr:{borderBottom:"1px solid #f3f4f6"},td:{padding:"12px 16px",fontSize:13,color:"#374151",verticalAlign:"middle"},pName:{fontWeight:600,color:"#111827",marginBottom:3},pSku:{fontSize:11,background:"#f3f4f6",padding:"2px 6px",borderRadius:4},badge:{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600},barBg:{height:4,background:"#f3f4f6",borderRadius:4,marginTop:5,width:80},barFill:{height:"100%",borderRadius:4},actions:{display:"flex",gap:6},editBtn:{padding:"5px 10px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff"},delBtn:{padding:"5px 8px",border:"1px solid #fee2e2",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff",color:"#dc2626"},empty:{textAlign:"center",padding:40,color:"#9ca3af",fontSize:14}};
