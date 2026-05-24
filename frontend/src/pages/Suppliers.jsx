import { useEffect, useState } from "react";
import { getSuppliers } from "../api/products";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

const empty = { name:"", contact_name:"", phone:"", email:"", address:"" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [form,      setForm]      = useState(empty);
  const [editId,    setEditId]    = useState(null);
  const [delId,     setDelId]     = useState(null);
  const [msg,       setMsg]       = useState({ text:"", ok:true });
  const [saving,    setSaving]    = useState(false);

  const load = () => getSuppliers().then(r => setSuppliers(r.data));
  useEffect(() => { load(); }, []);

  const showMsg = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text:"", ok:true }), 3500); };

  const startEdit = (sup) => { setEditId(sup.id); setForm({ name:sup.name, contact_name:sup.contact_name||"", phone:sup.phone||"", email:sup.email||"", address:sup.address||"" }); };
  const cancelEdit = () => { setEditId(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg("Supplier name is required", false);
    setSaving(true);
    try {
      if (editId) {
        await API.put(`/suppliers/${editId}`, form);
        showMsg("Supplier updated successfully!");
      } else {
        await API.post("/suppliers/", form);
        showMsg("Supplier added successfully!");
      }
      setForm(empty); setEditId(null); load();
    } catch(e) { showMsg(e.response?.data?.detail || "Error saving supplier", false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/suppliers/${delId}`);
      setDelId(null); load();
      showMsg("Supplier deleted.");
    } catch(e) { showMsg(e.response?.data?.detail || "Cannot delete — products may be linked to this supplier", false); setDelId(null); }
  };

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <h1 style={s.h1}>Suppliers</h1>
          <p style={s.sub}>{suppliers.length} suppliers registered</p>
        </div>
      </div>

      {msg.text && (
        <div style={{...s.msg, background:msg.ok?"#f0fdf4":"#fef2f2", color:msg.ok?"#166534":"#dc2626", border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>
          {msg.ok?"✅":"❌"} {msg.text}
        </div>
      )}

      <div style={s.layout}>
        {/* LEFT: Supplier list */}
        <div style={s.listCol}>
          {suppliers.length === 0 && (
            <div style={s.empty}>No suppliers yet. Add one using the form →</div>
          )}
          {suppliers.map(sup => (
            <div key={sup.id} style={{...s.card, ...(editId===sup.id?s.cardActive:{})}}>
              <div style={s.cardTop}>
                <div style={s.cardLeft}>
                  <div style={s.cardIcon}>🚚</div>
                  <div>
                    <div style={s.cardName}>{sup.name}</div>
                    {sup.contact_name && <div style={s.cardMeta}>👤 {sup.contact_name}</div>}
                  </div>
                </div>
                <div style={s.cardActions}>
                  <button style={s.editBtn} onClick={() => startEdit(sup)}>✏️ Edit</button>
                  <button style={s.delBtn}  onClick={() => setDelId(sup.id)}>🗑️</button>
                </div>
              </div>
              <div style={s.cardDetails}>
                {sup.phone && <span style={s.detail}>📞 {sup.phone}</span>}
                {sup.email && <span style={s.detail}>✉️ {sup.email}</span>}
                {sup.address && <span style={s.detail}>📍 {sup.address}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Add / Edit form */}
        <div style={s.formCol}>
          <div style={s.formCard}>
            <div style={s.formTitle}>{editId ? "✏️ Edit Supplier" : "➕ Add Supplier"}</div>

            <L>Supplier / Company name *</L>
            <input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. KidZone Wholesale" />

            <L>Contact person</L>
            <input style={s.input} value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))} placeholder="e.g. Ali Rahman" />

            <L>Phone number</L>
            <input style={s.input} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="e.g. +65 9100 0001" />

            <L>Email address</L>
            <input style={s.input} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="e.g. supplier@email.com" />

            <L>Address</L>
            <textarea style={{...s.input,height:64,resize:"vertical"}} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Full address…" />

            <div style={s.formBtns}>
              {editId && <button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>}
              <button style={{...s.saveBtn, flex:1}} onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update Supplier" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {delId && (
        <div style={s.overlay} onClick={() => setDelId(null)}>
          <div style={s.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={s.confirmTitle}>⚠️ Delete Supplier?</div>
            <p style={s.confirmText}>This will permanently delete this supplier. Products linked to them won't be deleted but will lose the supplier reference.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={() => setDelId(null)}>Cancel</button>
              <button style={s.confirmDelBtn} onClick={handleDelete}>Yes, Delete</button>
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
  layout:       { display:"grid", gridTemplateColumns:"1fr 300px", gap:20 },
  listCol:      { display:"flex", flexDirection:"column", gap:12 },
  empty:        { background:"#f9fafb", border:"2px dashed #e5e7eb", borderRadius:12, padding:32, textAlign:"center", color:"#9ca3af", fontSize:14 },
  card:         { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"16px 18px", transition:"border .15s" },
  cardActive:   { borderColor:"#4f46e5", boxShadow:"0 0 0 3px #eef2ff" },
  cardTop:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 },
  cardLeft:     { display:"flex", alignItems:"center", gap:12 },
  cardIcon:     { fontSize:28 },
  cardName:     { fontSize:15, fontWeight:700, color:"#111827" },
  cardMeta:     { fontSize:13, color:"#6b7280", marginTop:2 },
  cardActions:  { display:"flex", gap:8 },
  editBtn:      { padding:"6px 12px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff" },
  delBtn:       { padding:"6px 10px", border:"1px solid #fca5a5", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff", color:"#dc2626" },
  cardDetails:  { display:"flex", flexWrap:"wrap", gap:12 },
  detail:       { fontSize:12, color:"#6b7280" },
  formCol:      {},
  formCard:     { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:20 },
  formTitle:    { fontSize:15, fontWeight:700, color:"#111827", marginBottom:4 },
  input:        { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none", background:"#fff", color:"#111827" },
  formBtns:     { display:"flex", gap:8, marginTop:16 },
  cancelBtn:    { padding:"9px 14px", border:"1px solid #e5e7eb", borderRadius:8, background:"#fff", fontSize:13, cursor:"pointer" },
  saveBtn:      { padding:"9px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600 },
  overlay:      { position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 },
  confirmBox:   { background:"#fff", borderRadius:12, padding:24, width:360, boxShadow:"0 20px 60px rgba(0,0,0,.2)" },
  confirmTitle: { fontSize:16, fontWeight:700, color:"#111827", marginBottom:10 },
  confirmText:  { fontSize:13, color:"#6b7280", lineHeight:1.6, marginBottom:20 },
  confirmActions:{ display:"flex", gap:10, justifyContent:"flex-end" },
  confirmDelBtn:{ padding:"9px 18px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", fontWeight:600 },
};
