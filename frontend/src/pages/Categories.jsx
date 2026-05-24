import { useEffect, useState } from "react";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

const COMMON_ICONS = ["👗","👟","🎀","🧒","👦","👧","🤵","👩","👕","🧢","🎒","🐣","👡","👔","🩱","🧣","🧤","🧦","👒","🎽"];

export default function Categories() {
  const [tree,  setTree]  = useState([]);
  const [form,  setForm]  = useState({ name:"", parent_id:"", icon:"", description:"" });
  const [mode,  setMode]  = useState("sub"); // "main" | "sub"
  const [msg,   setMsg]   = useState({ text:"", ok:true });
  const [delId, setDelId] = useState(null);

  const load = () => API.get("/categories/tree").then(r => setTree(r.data));
  useEffect(() => { load(); }, []);

  const switchMode = (m) => {
    setMode(m);
    setForm({ name:"", parent_id:"", icon:"", description:"" });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return showMsg("Please enter a category name", false);
    if (mode === "sub" && !form.parent_id) return showMsg("Please select a main category", false);
    try {
      await API.post("/categories/", {
        name: form.name.trim(),
        parent_id: mode === "sub" ? parseInt(form.parent_id) : null,
        icon: form.icon || (mode === "main" ? "🏷️" : "📁"),
        description: form.description || null,
      });
      setForm({ name:"", parent_id:"", icon:"", description:"" });
      load();
      showMsg(`${mode === "main" ? "Main" : "Sub"}-category "${form.name}" added!`, true);
    } catch(e) { showMsg(e.response?.data?.detail || "Error adding category", false); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/categories/${id}`);
      setDelId(null); load();
      showMsg("Category deleted.", true);
    } catch(e) { showMsg(e.response?.data?.detail || "Cannot delete — products may be using it", false); setDelId(null); }
  };

  const showMsg = (text, ok) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:"", ok:true }), 4000); };

  const totalCats     = tree.reduce((a, m) => a + 1 + m.children.length, 0);
  const totalProducts = tree.reduce((a, m) => a + m.product_count + m.children.reduce((b, c) => b + c.product_count, 0), 0);

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <h1 style={s.h1}>Categories</h1>
          <p style={s.sub}>{tree.length} main categories · {totalCats} total · {totalProducts} products assigned</p>
        </div>
      </div>

      {msg.text && (
        <div style={{...s.msg, background:msg.ok?"#f0fdf4":"#fef2f2", color:msg.ok?"#166534":"#dc2626", border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>
          {msg.ok ? "✅" : "❌"} {msg.text}
        </div>
      )}

      <div style={s.layout}>
        {/* LEFT: Category tree */}
        <div style={s.treeCol}>
          {tree.length === 0 && (
            <div style={s.empty}>No categories yet. Add a main category first →</div>
          )}
          {tree.map(main => (
            <div key={main.id} style={s.mainCard}>
              <div style={s.mainHeader}>
                <div style={s.mainLeft}>
                  <span style={s.mainIcon}>{main.icon}</span>
                  <div>
                    <div style={s.mainName}>{main.name}</div>
                    <div style={s.mainMeta}>{main.children.length} sub-categories · {main.product_count} direct products</div>
                  </div>
                </div>
                <button style={s.delBtn} onClick={() => setDelId(main.id)} title="Delete">🗑️</button>
              </div>
              <div style={s.subList}>
                {main.children.map(sub => (
                  <div key={sub.id} style={s.subRow}>
                    <div style={s.subLeft}>
                      <span style={s.subIcon}>{sub.icon}</span>
                      <div>
                        <div style={s.subName}>{sub.name}</div>
                        {sub.description && <div style={s.subDesc}>{sub.description}</div>}
                      </div>
                    </div>
                    <div style={s.subRight}>
                      <span style={s.productCount}>{sub.product_count} products</span>
                      <button style={s.delBtnSm} onClick={() => setDelId(sub.id)}>✕</button>
                    </div>
                  </div>
                ))}
                {main.children.length === 0 && <div style={s.noSubs}>No sub-categories yet</div>}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Add form */}
        <div style={s.formCol}>
          <div style={s.formCard}>
            {/* Mode toggle */}
            <div style={s.modeRow}>
              <button style={{...s.modeBtn,...(mode==="main"?s.modeBtnActive:{})}} onClick={()=>switchMode("main")}>
                🏠 New Main Category
              </button>
              <button style={{...s.modeBtn,...(mode==="sub"?s.modeBtnActive:{})}} onClick={()=>switchMode("sub")}>
                📁 New Sub-Category
              </button>
            </div>

            {mode === "main" && (
              <div style={s.modeHint}>
                Creates a top-level category like <strong>Garment</strong>, <strong>Baby Shoes</strong>, or a new one like <strong>Sports Wear</strong>.
              </div>
            )}
            {mode === "sub" && (
              <div style={s.modeHint}>
                Creates a sub-category under an existing main category, like <strong>Man Suit</strong> under <strong>Garment</strong>.
              </div>
            )}

            <L>Category name *</L>
            <input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
              placeholder={mode==="main" ? "e.g. Sports Wear, Footwear…" : "e.g. Man Suit, School Uniform…"} />

            {mode === "sub" && (
              <>
                <L>Main category (parent) *</L>
                <select style={s.input} value={form.parent_id} onChange={e=>setForm(f=>({...f,parent_id:e.target.value}))}>
                  <option value="">— Select main category —</option>
                  {tree.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
                </select>
              </>
            )}

            <L>Icon (pick or type emoji)</L>
            <div style={s.iconGrid}>
              {COMMON_ICONS.map(ic => (
                <button key={ic} style={{...s.iconBtn,...(form.icon===ic?s.iconBtnActive:{})}} onClick={()=>setForm(f=>({...f,icon:ic}))}>{ic}</button>
              ))}
            </div>
            <input style={{...s.input,marginTop:8}} value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} placeholder="Or type any emoji…" maxLength={4} />

            <L>Description (optional)</L>
            <textarea style={{...s.input,height:56,resize:"vertical"}} value={form.description}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Short description…" />

            <button style={s.addBtn} onClick={handleAdd}>
              {mode==="main" ? "➕ Add Main Category" : "➕ Add Sub-Category"}
            </button>
          </div>
        </div>
      </div>

      {delId && (
        <div style={s.overlay} onClick={()=>setDelId(null)}>
          <div style={s.confirmBox} onClick={e=>e.stopPropagation()}>
            <div style={s.confirmTitle}>⚠️ Delete Category?</div>
            <p style={s.confirmText}>This will permanently delete this category. Products using it won't be deleted but may lose their category.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={()=>setDelId(null)}>Cancel</button>
              <button style={s.confirmDelBtn} onClick={()=>handleDelete(delId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function L({ children }) {
  return <div style={{ fontSize:12, color:"#6b7280", marginBottom:4, marginTop:12 }}>{children}</div>;
}

const s = {
  page:         { padding:28, maxWidth:1100, margin:"0 auto" },
  topbar:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  h1:           { fontSize:22, fontWeight:700, color:"#111827", marginBottom:2 },
  sub:          { fontSize:13, color:"#9ca3af" },
  msg:          { padding:"10px 16px", borderRadius:9, fontSize:13, marginBottom:16 },
  layout:       { display:"grid", gridTemplateColumns:"1fr 320px", gap:20 },
  treeCol:      { display:"flex", flexDirection:"column", gap:14 },
  empty:        { background:"#f9fafb", border:"2px dashed #e5e7eb", borderRadius:12, padding:32, textAlign:"center", color:"#9ca3af", fontSize:14 },
  mainCard:     { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, overflow:"hidden" },
  mainHeader:   { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", background:"#f9fafb", borderBottom:"1px solid #e5e7eb" },
  mainLeft:     { display:"flex", alignItems:"center", gap:12 },
  mainIcon:     { fontSize:26 },
  mainName:     { fontSize:15, fontWeight:700, color:"#111827" },
  mainMeta:     { fontSize:12, color:"#9ca3af", marginTop:2 },
  delBtn:       { background:"none", border:"1px solid #fca5a5", borderRadius:7, padding:"5px 9px", cursor:"pointer", fontSize:13, color:"#dc2626" },
  subList:      { padding:"8px 18px 14px" },
  subRow:       { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f9fafb" },
  subLeft:      { display:"flex", alignItems:"center", gap:10 },
  subIcon:      { fontSize:18 },
  subName:      { fontSize:13, fontWeight:600, color:"#374151" },
  subDesc:      { fontSize:11, color:"#9ca3af", marginTop:1 },
  subRight:     { display:"flex", alignItems:"center", gap:8 },
  productCount: { fontSize:12, color:"#6b7280", background:"#f3f4f6", padding:"2px 8px", borderRadius:20 },
  delBtnSm:     { background:"none", border:"none", cursor:"pointer", color:"#d1d5db", fontSize:14 },
  noSubs:       { fontSize:12, color:"#d1d5db", fontStyle:"italic", padding:"8px 0" },
  formCol:      {},
  formCard:     { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:20 },
  modeRow:      { display:"flex", gap:8, marginBottom:12 },
  modeBtn:      { flex:1, padding:"9px 6px", border:"1px solid #e5e7eb", borderRadius:9, fontSize:12, cursor:"pointer", background:"#f9fafb", color:"#6b7280", fontWeight:500 },
  modeBtnActive:{ background:"#4f46e5", color:"#fff", borderColor:"#4f46e5" },
  modeHint:     { fontSize:12, color:"#6b7280", background:"#f5f3ff", borderRadius:8, padding:"8px 12px", lineHeight:1.5 },
  input:        { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none", background:"#fff", color:"#111827" },
  iconGrid:     { display:"flex", flexWrap:"wrap", gap:6, marginTop:6 },
  iconBtn:      { width:32, height:32, border:"1px solid #e5e7eb", borderRadius:6, background:"#f9fafb", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" },
  iconBtnActive:{ background:"#eef2ff", borderColor:"#4f46e5" },
  addBtn:       { width:"100%", marginTop:16, padding:"11px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" },
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },
  confirmBox:   { background:"#fff", borderRadius:12, padding:24, width:360, boxShadow:"0 20px 60px rgba(0,0,0,.2)" },
  confirmTitle: { fontSize:16, fontWeight:700, color:"#111827", marginBottom:10 },
  confirmText:  { fontSize:13, color:"#6b7280", lineHeight:1.6, marginBottom:20 },
  confirmActions:{ display:"flex", gap:10, justifyContent:"flex-end" },
  cancelBtn:    { padding:"9px 18px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", fontSize:13, cursor:"pointer" },
  confirmDelBtn:{ padding:"9px 18px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600 },
};
