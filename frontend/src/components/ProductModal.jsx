import { useState, useEffect } from "react";
import { createProduct, updateProduct, getSuppliers } from "../api/products";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

export default function ProductModal({ product, onClose, onSaved }) {
  const [catTree,   setCatTree]   = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [form, setForm] = useState({
    name:"", sku:"", category_id:"", supplier_id:"",
    price:"", cost_price:"", description:"",
    stock:0, low_stock_alert:10, max_stock:100,
  });

  useEffect(() => {
    API.get("/categories/tree").then(r => setCatTree(r.data));
    getSuppliers().then(r => setSuppliers(r.data));
    if (product) {
      setForm({
        name: product.name, sku: product.sku,
        category_id: product.category?.id || "",
        supplier_id: product.supplier?.id || "",
        price: product.price, cost_price: product.cost_price || "",
        description: product.description || "",
        stock: product.inventory?.quantity ?? 0,
        low_stock_alert: product.inventory?.low_stock_alert ?? 10,
        max_stock: product.inventory?.max_stock ?? 100,
      });
    }
  }, [product]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Product name is required");
    if (!form.category_id)  return alert("Please select a category");
    if (!form.price)         return alert("Price is required");
    setSaving(true);
    try {
      const payload = {
        name: form.name, sku: form.sku,
        category_id: parseInt(form.category_id),
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        price: parseFloat(form.price),
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        description: form.description || null,
        inventory: { quantity: parseInt(form.stock), low_stock_alert: parseInt(form.low_stock_alert), max_stock: parseInt(form.max_stock) },
      };
      if (product) await updateProduct(product.id, payload);
      else         await createProduct(payload);
      onSaved();
    } catch(e) { alert(e.response?.data?.detail || "Error saving product"); }
    setSaving(false);
  };

  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.header}>
          <h2 style={s.title}>{product ? "Edit product" : "Add new product"}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>
        <div style={s.grid}>
          <div style={s.full}><L>Product name *</L><Inp value={form.name} onChange={v=>set("name",v)} placeholder="e.g. Girls summer dress"/></div>
          <div><L>SKU *</L><Inp value={form.sku} onChange={v=>set("sku",v)} placeholder="e.g. GSD-001" disabled={!!product}/></div>
          <div>
            <L>Category * (Main → Sub)</L>
            <select style={s.input} value={form.category_id} onChange={e=>set("category_id",e.target.value)}>
              <option value="">Select category</option>
              {catTree.map(main => (
                <optgroup key={main.id} label={`${main.icon} ${main.name}`}>
                  {main.children.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.icon} {sub.name}</option>
                  ))}
                  {main.children.length === 0 && (
                    <option value={main.id}>{main.icon} {main.name} (general)</option>
                  )}
                </optgroup>
              ))}
            </select>
          </div>
          <div><L>Selling price (SGD) *</L><Inp type="number" value={form.price} onChange={v=>set("price",v)} placeholder="0.00"/></div>
          <div><L>Cost price (SGD)</L><Inp type="number" value={form.cost_price} onChange={v=>set("cost_price",v)} placeholder="0.00"/></div>
          <div>
            <L>Supplier</L>
            <select style={s.input} value={form.supplier_id} onChange={e=>set("supplier_id",e.target.value)}>
              <option value="">Select supplier</option>
              {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={s.full}><L>Description</L><textarea style={{...s.input,height:60,resize:"vertical"}} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Optional"/></div>
          <div style={{...s.full,...s.divider}}>📦 Inventory</div>
          <div><L>Stock qty</L><Inp type="number" value={form.stock} onChange={v=>set("stock",v)}/></div>
          <div><L>Low stock alert at</L><Inp type="number" value={form.low_stock_alert} onChange={v=>set("low_stock_alert",v)}/></div>
          <div><L>Max stock</L><Inp type="number" value={form.max_stock} onChange={v=>set("max_stock",v)}/></div>
        </div>
        <div style={s.actions}>
          <button onClick={onClose} style={s.cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={s.saveBtn}>{saving?"Saving…":product?"Update product":"Add product"}</button>
        </div>
      </div>
    </div>
  );
}

function L({ children }) { return <div style={{ fontSize:12, color:"#6b7280", marginBottom:4 }}>{children}</div>; }
function Inp({ value, onChange, ...props }) { return <input style={s.input} value={value} onChange={e=>onChange(e.target.value)} {...props}/>; }

const s = {
  overlay:   { position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },
  modal:     { background:"#fff", borderRadius:14, padding:24, width:540, maxWidth:"95vw", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.3)" },
  header:    { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 },
  title:     { fontSize:17, fontWeight:700, color:"#111827" },
  closeBtn:  { background:"none", border:"none", fontSize:18, cursor:"pointer", color:"#9ca3af" },
  grid:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
  full:      { gridColumn:"1/-1" },
  divider:   { fontSize:13, fontWeight:600, color:"#4f46e5", paddingTop:8, borderTop:"1px solid #f3f4f6" },
  input:     { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box", color:"#111827", background:"#fff", outline:"none" },
  actions:   { display:"flex", justifyContent:"flex-end", gap:10, marginTop:20 },
  cancelBtn: { padding:"9px 18px", border:"1px solid #d1d5db", borderRadius:8, background:"#fff", fontSize:13, cursor:"pointer" },
  saveBtn:   { padding:"9px 18px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600 },
};
