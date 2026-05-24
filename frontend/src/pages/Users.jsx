import { useEffect, useState } from "react";
import { getUsers, createUser, updateUser, deleteUser } from "../api/auth";

const ROLES    = ["ADMIN","MANAGER","CASHIER"];
const ROLE_CLR = { ADMIN:{bg:"#f5f3ff",color:"#5b21b6"}, MANAGER:{bg:"#eff6ff",color:"#1d4ed8"}, CASHIER:{bg:"#f0fdf4",color:"#166534"} };
const empty    = { name:"", phone:"", password:"", role:"CASHIER" };

export default function Users() {
  const [users,   setUsers]   = useState([]);
  const [form,    setForm]    = useState(empty);
  const [editId,  setEditId]  = useState(null);
  const [showPw,  setShowPw]  = useState(false);
  const [msg,     setMsg]     = useState({text:"",ok:true});
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState(null);

  const load = () => getUsers().then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const showMsg  = (text,ok=true) => { setMsg({text,ok}); setTimeout(()=>setMsg({text:"",ok:true}),3500); };
  const startEdit= (u) => { setEditId(u.id); setForm({name:u.name,phone:u.phone,password:"",role:u.role}); };
  const cancelEdit=() => { setEditId(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.name.trim())  return showMsg("Name is required",false);
    if (!form.phone.trim()) return showMsg("Phone is required",false);
    if (!editId && form.password.length < 6) return showMsg("Password must be at least 6 characters",false);
    setSaving(true);
    try {
      if (editId) { await updateUser(editId,form); showMsg("User updated!"); }
      else        { await createUser(form);         showMsg("User created!"); }
      setForm(empty); setEditId(null); load();
    } catch(e) { showMsg(e.response?.data?.detail||"Error",false); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await deleteUser(delId); setDelId(null); load(); showMsg("User removed."); }
    catch(e) { showMsg(e.response?.data?.detail||"Cannot delete",false); setDelId(null); }
  };

  const byRole = (role) => users.filter(u => u.role === role);

  return (
    <div style={s.page}>
      <div style={s.topbar}>
        <div>
          <h1 style={s.h1}>User Management</h1>
          <p style={s.sub}>{users.length} users · Admin access only</p>
        </div>
      </div>

      {msg.text && <div style={{...s.msg,background:msg.ok?"#f0fdf4":"#fef2f2",color:msg.ok?"#166534":"#dc2626",border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>{msg.ok?"✅":"❌"} {msg.text}</div>}

      <div style={s.layout}>
        <div style={s.listCol}>
          {ROLES.map(role => {
            const group = byRole(role);
            if (!group.length) return null;
            const rc = ROLE_CLR[role];
            return (
              <div key={role} style={s.group}>
                <div style={s.groupHeader}>
                  <span style={{...s.roleBadge,background:rc.bg,color:rc.color}}>{role}</span>
                  <span style={s.groupCount}>{group.length} users</span>
                </div>
                {group.map(u => (
                  <div key={u.id} style={{...s.card,...(editId===u.id?s.cardActive:{})}}>
                    <div style={s.cardLeft}>
                      <div style={{...s.avatar,background:rc.color}}>{u.name[0].toUpperCase()}</div>
                      <div>
                        <div style={s.uName}>{u.name}</div>
                        <div style={s.uPhone}>📞 {u.phone}</div>
                      </div>
                    </div>
                    <div style={s.cardActions}>
                      <button style={s.editBtn} onClick={()=>startEdit(u)}>✏️ Edit</button>
                      <button style={s.delBtn}  onClick={()=>setDelId(u.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {users.length===0&&<div style={s.empty}>No users found</div>}
        </div>

        <div style={s.formCard}>
          <div style={s.formTitle}>{editId?"✏️ Edit User":"➕ Add User"}</div>

          <L>Full name *</L>
          <input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Ahmad bin Ali"/>

          <L>Phone number *</L>
          <input style={s.input} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="e.g. 0123456789"/>

          <L>{editId?"New password (leave blank to keep old)":"Password * (min 6 characters)"}</L>
          <div style={s.passWrap}>
            <input style={{...s.input,paddingRight:44}} type={showPw?"text":"password"} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder={editId?"Leave blank to keep current":"Min 6 characters"}/>
            <button style={s.eyeBtn} type="button" onClick={()=>setShowPw(p=>!p)}>{showPw?"🙈":"👁️"}</button>
          </div>

          <L>Role *</L>
          <div style={s.roleBtns}>
            {ROLES.map(r=>{
              const rc=ROLE_CLR[r];
              return <button key={r} style={{...s.roleBtn,...(form.role===r?{background:rc.bg,color:rc.color,borderColor:rc.color}:{})}} onClick={()=>setForm(f=>({...f,role:r}))}>{r}</button>;
            })}
          </div>

          <div style={s.permHint}>
            {form.role==="ADMIN"&&"Full access to all pages and settings."}
            {form.role==="MANAGER"&&"Access: POS, Returns, Customers, Products, Inventory, Dashboard."}
            {form.role==="CASHIER"&&"Access: POS and Returns only."}
          </div>

          <div style={s.formBtns}>
            {editId&&<button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>}
            <button style={{...s.saveBtn,flex:1}} onClick={handleSave} disabled={saving}>{saving?"Saving…":editId?"Update User":"Add User"}</button>
          </div>
        </div>
      </div>

      {delId&&(
        <div style={s.overlay} onClick={()=>setDelId(null)}>
          <div style={s.confirmBox} onClick={e=>e.stopPropagation()}>
            <div style={s.confirmTitle}>⚠️ Remove User?</div>
            <p style={s.confirmText}>This user will no longer be able to log in.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelBtn} onClick={()=>setDelId(null)}>Cancel</button>
              <button style={s.confirmDelBtn} onClick={handleDelete}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function L({children}){return <div style={{fontSize:12,color:"#6b7280",marginBottom:4,marginTop:12}}>{children}</div>;}

const s={page:{padding:28,maxWidth:1000,margin:"0 auto"},topbar:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:2},sub:{fontSize:13,color:"#9ca3af"},msg:{padding:"10px 16px",borderRadius:9,fontSize:13,marginBottom:14},layout:{display:"grid",gridTemplateColumns:"1fr 300px",gap:20},listCol:{display:"flex",flexDirection:"column",gap:4},group:{marginBottom:16},groupHeader:{display:"flex",alignItems:"center",gap:10,marginBottom:8},roleBadge:{padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:700},groupCount:{fontSize:12,color:"#9ca3af"},card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,transition:"border .15s"},cardActive:{borderColor:"#4f46e5",boxShadow:"0 0 0 3px #eef2ff"},cardLeft:{display:"flex",alignItems:"center",gap:12},avatar:{width:38,height:38,borderRadius:"50%",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,flexShrink:0},uName:{fontSize:14,fontWeight:600,color:"#111827"},uPhone:{fontSize:12,color:"#6b7280",marginTop:2},cardActions:{display:"flex",gap:8},editBtn:{padding:"5px 12px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff"},delBtn:{padding:"5px 9px",border:"1px solid #fca5a5",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff",color:"#dc2626"},empty:{background:"#f9fafb",border:"2px dashed #e5e7eb",borderRadius:12,padding:32,textAlign:"center",color:"#9ca3af"},formCard:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:20,position:"sticky",top:20},formTitle:{fontSize:15,fontWeight:700,color:"#111827",marginBottom:4},input:{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",outline:"none",background:"#fff",color:"#111827"},passWrap:{position:"relative"},eyeBtn:{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:14},roleBtns:{display:"flex",gap:6},roleBtn:{flex:1,padding:"7px 4px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:11,cursor:"pointer",background:"#f9fafb",fontWeight:700,color:"#6b7280"},permHint:{marginTop:8,fontSize:12,color:"#6b7280",background:"#f9fafb",borderRadius:7,padding:"7px 10px",minHeight:32},formBtns:{display:"flex",gap:8,marginTop:16},cancelBtn:{padding:"9px 14px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",fontSize:13,cursor:"pointer"},saveBtn:{padding:"9px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600},overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999},confirmBox:{background:"#fff",borderRadius:12,padding:24,width:360,boxShadow:"0 20px 60px rgba(0,0,0,.2)"},confirmTitle:{fontSize:16,fontWeight:700,color:"#111827",marginBottom:10},confirmText:{fontSize:13,color:"#6b7280",lineHeight:1.6,marginBottom:20},confirmActions:{display:"flex",gap:10,justifyContent:"flex-end"},confirmDelBtn:{padding:"9px 18px",background:"#dc2626",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600}};
