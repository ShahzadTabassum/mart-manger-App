import { useState, useEffect } from "react";
import { createProduct, updateProduct, getCategories, getSuppliers } from "../api/products";
export default function ProductModal({ product, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", sku:"", category_id:"", supplier_id:"", price:"", cost_price:"", description:"", stock:0, low_stock_alert:10, max_stock:100 });
  useEffect(() => {
    getCategories().then(r => setCategories(r.data));
    getSuppliers().then(r => setSuppliers(r.data));
    if (product) setForm({ name:product.name, sku:product.sku, category_id:product.category?.id||"", supplier_id:product.supplier?.id||"", price:product.price, cost_price:product.cost_price||"", description:product.description||"", stock:product.inventory?.quantity??0, low_stock_alert:product.inventory?.low_stock_alert??10, max_stock:product.inventory?.max_stock??100 });
  }, [product]);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { name:form.name, sku:form.sku, category_id:parseInt(form.category_id), supplier_id:form.supplier_id?parseInt(form.supplier_id):null, price:parseFloat(form.price), cost_price:form.cost_price?parseFloat(form.cost_price):null, description:form.description||null, inventory:{ quantity:parseInt(form.stock), low_stock_alert:parseInt(form.low_stock_alert), max_stock:parseInt(form.max_stock) } };
      if (product) await updateProduct(product.id, payload);
      else         await createProduct(payload);
      onSaved();
    } catch(e) { alert(e.response?.data?.detail||"Error saving product"); }
    setSaving(false);
  };
  const Inp = ({k,...p}) => <input style={s.input} value={form[k]} onChange={e=>set(k,e.target.value)} {...p}/>;
  return (
    <div style={s.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={s.modal}>
        <div style={s.header}><h2 style={s.title}>{product?"Edit product":"Add new product"}</h2><button onClick={onClose} style={s.closeBtn}>✕</button></div>
        <div style={s.grid}>
          <div style={s.full}><L>Product name *</L><Inp k="name" placeholder="e.g. Girls summer dress"/></div>
          <div><L>SKU *</L><Inp k="sku" placeholder="e.g. GSD-001" disabled={!!product}/></div>
          <div><L>Category *</L><select style={s.input} value={form.category_id} onChange={e=>set("category_id",e.target.value)}><option value="">Select</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><L>Selling price (SGD) *</L><Inp k="price" type="number" placeholder="0.00"/></div>
          <div><L>Cost price (SGD)</L><Inp k="cost_price" type="number" placeholder="0.00"/></div>
          <div><L>Supplier</L><select style={s.input} value={form.supplier_id} onChange={e=>set("supplier_id",e.target.value)}><option value="">Select</option>{suppliers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
          <div style={s.full}><L>Description</L><textarea style={{...s.input,height:60,resize:"vertical"}} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Optional"/></div>
          <div style={{...s.full,...s.div}}>📦 Inventory</div>
          <div><L>Stock qty</L><Inp k="stock" type="number"/></div>
          <div><L>Low stock alert</L><Inp k="low_stock_alert" type="number"/></div>
          <div><L>Max stock</L><Inp k="max_stock" type="number"/></div>
        </div>
        <div style={s.actions}><button onClick={onClose} style={s.cancelBtn}>Cancel</button><button onClick={handleSave} disabled={saving} style={s.saveBtn}>{saving?"Saving…":product?"Update":"Add product"}</button></div>
      </div>
    </div>
  );
}
function L({children}){return <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>{children}</div>;}
const s={overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999},modal:{background:"#fff",borderRadius:14,padding:24,width:540,maxWidth:"95vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)"},header:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20},title:{fontSize:17,fontWeight:700,color:"#111827"},closeBtn:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9ca3af"},grid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14},full:{gridColumn:"1/-1"},div:{fontSize:13,fontWeight:600,color:"#4f46e5",paddingTop:8,borderTop:"1px solid #f3f4f6"},input:{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",color:"#111827",background:"#fff",outline:"none"},actions:{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20},cancelBtn:{padding:"9px 18px",border:"1px solid #d1d5db",borderRadius:8,background:"#fff",fontSize:13,cursor:"pointer"},saveBtn:{padding:"9px 18px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600}};
