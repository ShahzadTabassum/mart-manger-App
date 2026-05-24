import { useEffect, useState } from "react";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../api/employees";

const ROLES    = ["CASHIER", "MANAGER", "ADMIN"];
const ROLE_CLR = {
  ADMIN:   { bg:"#f5f3ff", color:"#5b21b6" },
  MANAGER: { bg:"#eff6ff", color:"#1d4ed8" },
  CASHIER: { bg:"#f0fdf4", color:"#166534" },
};
const empty = { name:"", phone:"", role:"CASHIER", pin:"0000" };

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form,      setForm]      = useState(empty);
  const [editId,    setEditId]    = useState(null);
  const [msg,       setMsg]       = useState({ text:"", ok:true });
  const [saving,    setSaving]    = useState(false);
  const [delId,     setDelId]     = useState(null);

  const load = () => getEmployees().then(r => setEmployees(r.data));
  useEffect(() => { load(); }, []);

  const showMsg = (text, ok=true) => { setMsg({text,ok}); setTimeout(()=>setMsg({text:"",ok:true}),3500); };
  const startEdit = (e) => { setEditId(e.id); setForm({ name:e.name, phone:e.phone||"", role:e.role, pin:"0000" }); };
  const cancelEdit = () => { setEditId(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg("Name is required", false);
    setSaving(true);
    try {
      if (editId) { await updateEmployee(editId, form); showMsg("Staff updated!"); }
      else        { await createEmployee(form);          showMsg("Staff member added!"); }
      setForm(empty); setEditId(null); load();
    } catch(e) { showMsg(e.response?.data?.detail || "Error", false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await deleteEmployee(delId); setDelId(null); load(); showMsg("Staff member removed."); }
    catch(e) { showMsg(e.response?.data?.detail || "Cannot delete", false); setDelId(null); }
  };

  const byRole = (role) => employees.filter(e => e.role === role);

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <h1 style={s.h1}>Staff Management</h1>
          <p style={s.sub}>{employees.length} active staff members</p>
        </div>
        <div style={s.notice}>
          🔒 Full login & permissions system coming in a future phase
        </div>
      </div>

      {msg.text && (
        <div style={{...s.msg, background:msg.ok?"#f0fdf4":"#fef2f2", color:msg.ok?"#166534":"#dc2626", border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>
          {msg.ok?"✅":"❌"} {msg.text}
        </div>
      )}

      <div style={s.layout}>
        {/* LEFT: staff grouped by role */}
        <div>
          {ROLES.map(role => {
            const group = byRole(role);
            if (group.length === 0) return null;
            const rc = ROLE_CLR[role];
            return (
              <div key={role} style={s.group}>
                <div style={s.groupHeader}>
                  <span style={{...s.roleBadge, background:rc.bg, color:rc.color}}>{role}</span>
                  <span style={s.groupCount}>{group.length} staff</span>
                </div>
                {group.map(emp => (
                  <div key={emp.id} style={{...s.card,...(editId===emp.id?s.cardActive:{})}}>
                    <div style={s.cardLeft}>
                      <div style={{...s.avatar, background:rc.color}}>{emp.name[0].toUpperCase()}</div>
                      <div>
                        <div style={s.empName}>{emp.name}</div>
                        <div style={s.empPhone}>{emp.phone ? `📞 ${emp.phone}` : "No phone"}</div>
                      </div>
                    </div>
                    <div style={s.cardActions}>
                      <button style={s.editBtn} onClick={() => startEdit(emp)}>✏️ Edit</button>
                      <button style={s.delBtn}  onClick={() => setDelId(emp.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {employees.length === 0 && (
            <div style={s.empty}>No staff yet. Add your first staff member →</div>
          )}
        </div>

        {/* RIGHT: simple add/edit form */}
        <div style={s.formCard}>
          <div style={s.formTitle}>{editId ? "✏️ Edit Staff" : "➕ Add Staff Member"}</div>
          <div style={s.formHint}>
            {editId
              ? "Update this staff member's details."
              : "Add your salespeople, cashiers, and managers here. Full access control coming soon."}
          </div>

          <L>Full name *</L>
          <input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Ahmad bin Ali" />

          <L>Phone number</L>
          <input style={s.input} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+65 9xxx xxxx" />

          <L>Role / Position</L>
          <div style={s.roleBtns}>
            {ROLES.map(r => {
              const rc = ROLE_CLR[r];
              return (
                <button key={r} style={{...s.roleBtn,...(form.role===r?{background:rc.bg,color:rc.color,borderColor:rc.color}:{})}}
                  onClick={()=>setForm(f=>({...f,role:r}))}>
                  {r}
                </button>
              );
            })}
          </div>

          <div style={s.formBtns}>
            {editId && <button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>}
            <button style={{...s.saveBtn,flex:1}} onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editId ? "Update Staff" : "Add Staff Member"}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {delId && (
        <div style={s.overlay} onClick={() => setDelId(null)}>
          <div style={s.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={s.confirmTitle}>⚠️ Remove Staff Member?</div>
            <p style={s.confirmText}>This will deactivate this staff member from the system.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={() => setDelId(null)}>Cancel</button>
              <button style={s.confirmDelBtn} onClick={handleDelete}>Yes, Remove</button>
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
  page:         { padding:28, maxWidth:1000, margin:"0 auto" },
  topbar:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 },
  h1:           { fontSize:22, fontWeight:700, color:"#111827", marginBottom:2 },
  sub:          { fontSize:13, color:"#9ca3af" },
  notice:       { fontSize:12, color:"#92400e", background:"#fef3c7", border:"1px solid #fcd34d", borderRadius:8, padding:"8px 14px" },
  msg:          { padding:"10px 16px", borderRadius:9, fontSize:13, marginBottom:14 },
  layout:       { display:"grid", gridTemplateColumns:"1fr 300px", gap:20 },
  group:        { marginBottom:20 },
  groupHeader:  { display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  roleBadge:    { padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 },
  groupCount:   { fontSize:12, color:"#9ca3af" },
  card:         { background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, transition:"border .15s" },
  cardActive:   { borderColor:"#4f46e5", boxShadow:"0 0 0 3px #eef2ff" },
  cardLeft:     { display:"flex", alignItems:"center", gap:12 },
  avatar:       { width:38, height:38, borderRadius:"50%", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, flexShrink:0 },
  empName:      { fontSize:14, fontWeight:600, color:"#111827" },
  empPhone:     { fontSize:12, color:"#6b7280", marginTop:2 },
  cardActions:  { display:"flex", gap:8 },
  editBtn:      { padding:"5px 12px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff" },
  delBtn:       { padding:"5px 9px", border:"1px solid #fca5a5", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff", color:"#dc2626" },
  empty:        { background:"#f9fafb", border:"2px dashed #e5e7eb", borderRadius:12, padding:40, textAlign:"center", color:"#9ca3af", fontSize:14 },
  formCard:     { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:20 },
  formTitle:    { fontSize:15, fontWeight:700, color:"#111827", marginBottom:6 },
  formHint:     { fontSize:12, color:"#6b7280", lineHeight:1.5, background:"#f9fafb", borderRadius:8, padding:"8px 10px" },
  input:        { width:"100%", padding:"8px 10px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, boxSizing:"border-box", outline:"none", background:"#fff", color:"#111827" },
  roleBtns:     { display:"flex", gap:8 },
  roleBtn:      { flex:1, padding:"8px 4px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:12, cursor:"pointer", background:"#f9fafb", fontWeight:600, color:"#6b7280" },
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
