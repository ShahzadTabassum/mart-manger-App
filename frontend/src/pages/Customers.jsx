import { useEffect, useState } from "react";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerHistory, adjustLoyalty } from "../api/customers";

const empty = { name:"", phone:"" };
const ROLE_COLORS = { ADMIN:"#7c3aed", MANAGER:"#0369a1", CASHIER:"#047857" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search,    setSearch]    = useState("");
  const [form,      setForm]      = useState(empty);
  const [editId,    setEditId]    = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [history,   setHistory]   = useState(null);
  const [msg,       setMsg]       = useState({ text:"", ok:true });
  const [saving,    setSaving]    = useState(false);

  const load = () => getCustomers(search ? { search } : {}).then(r => setCustomers(r.data));
  useEffect(() => { load(); }, [search]);

  const showMsg = (text, ok=true) => { setMsg({text,ok}); setTimeout(()=>setMsg({text:"",ok:true}),3500); };

  const startEdit = (c) => { setEditId(c.id); setForm({name:c.name,phone:c.phone}); setSelected(null); setHistory(null); };
  const cancelEdit = () => { setEditId(null); setForm(empty); };

  const viewHistory = async (c) => {
    setSelected(c); setEditId(null); setForm(empty);
    const r = await getCustomerHistory(c.id);
    setHistory(r.data);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg("Name is required", false);
    if (!form.phone.trim()) return showMsg("Phone is required", false);
    setSaving(true);
    try {
      if (editId) { await updateCustomer(editId, form); showMsg("Customer updated!"); }
      else        { await createCustomer(form);          showMsg("Customer added!"); }
      setForm(empty); setEditId(null); load();
    } catch(e) { showMsg(e.response?.data?.detail || "Error", false); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this customer?")) return;
    await deleteCustomer(id); load(); showMsg("Customer removed.");
    if (selected?.id === id) { setSelected(null); setHistory(null); }
  };

  const totalPoints = customers.reduce((a,c) => a + c.loyalty_points, 0);
  const totalSpent  = customers.reduce((a,c) => a + parseFloat(c.total_spent), 0);

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Customers</h1>
      <div style={s.statRow}>
        <Stat icon="👥" label="Total customers" value={customers.length} />
        <Stat icon="🎁" label="Total loyalty points" value={totalPoints.toLocaleString()} />
        <Stat icon="💰" label="Total revenue from customers" value={`SGD ${totalSpent.toFixed(2)}`} />
      </div>

      {msg.text && <div style={{...s.msg,background:msg.ok?"#f0fdf4":"#fef2f2",color:msg.ok?"#166534":"#dc2626",border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>{msg.ok?"✅":"❌"} {msg.text}</div>}

      <div style={s.layout}>
        {/* LEFT: list + form */}
        <div>
          {/* Search + Add form */}
          <div style={s.card}>
            <div style={s.formTitle}>{editId ? "✏️ Edit Customer" : "➕ Add Customer"}</div>
            <div style={s.formRow}>
              <div style={{flex:1}}><L>Name *</L><input style={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Customer name"/></div>
              <div style={{flex:1}}><L>Phone *</L><input style={s.input} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+65 9xxx xxxx"/></div>
              <div style={s.formBtns}>
                {editId && <button style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>}
                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving?"...":editId?"Update":"Add"}</button>
              </div>
            </div>
          </div>

          <input style={{...s.input,marginBottom:12,marginTop:4}} placeholder="🔍  Search by name or phone…" value={search} onChange={e=>setSearch(e.target.value)} />

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>{["Customer","Phone","Points","Spent","Visits",""].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {customers.length===0
                  ? <tr><td colSpan={6} style={s.empty}>No customers yet</td></tr>
                  : customers.map(c=>(
                  <tr key={c.id} style={{...s.tr,...(selected?.id===c.id?{background:"#f5f3ff"}:{})}}>
                    <td style={s.td}><div style={s.cName}>{c.name}</div></td>
                    <td style={s.td}>{c.phone}</td>
                    <td style={s.td}><span style={s.pointsBadge}>🎁 {c.loyalty_points}</span></td>
                    <td style={s.td}>SGD {parseFloat(c.total_spent).toFixed(2)}</td>
                    <td style={s.td}>{c.visit_count}x</td>
                    <td style={s.td}>
                      <div style={{display:"flex",gap:6}}>
                        <button style={s.viewBtn}  onClick={()=>viewHistory(c)}>📋</button>
                        <button style={s.editBtn2} onClick={()=>startEdit(c)}>✏️</button>
                        <button style={s.delBtn}   onClick={()=>handleDelete(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Customer detail / history */}
        <div>
          {!selected && <div style={s.emptyDetail}>Click 📋 on a customer to view their history</div>}
          {selected && history && (
            <div style={s.detailCard}>
              <div style={s.detailHeader}>
                <div>
                  <div style={s.detailName}>{selected.name}</div>
                  <div style={s.detailPhone}>{selected.phone}</div>
                </div>
                <button style={s.closeDet} onClick={()=>{setSelected(null);setHistory(null);}}>✕</button>
              </div>
              <div style={s.detailStats}>
                <div style={s.dStat}><div style={s.dStatVal}>{selected.loyalty_points}</div><div style={s.dStatLab}>Points</div></div>
                <div style={s.dStat}><div style={s.dStatVal}>SGD {parseFloat(selected.total_spent).toFixed(0)}</div><div style={s.dStatLab}>Spent</div></div>
                <div style={s.dStat}><div style={s.dStatVal}>{selected.visit_count}</div><div style={s.dStatLab}>Visits</div></div>
              </div>

              <div style={s.detailSection}>Purchase History</div>
              {history.sales.length===0 ? <div style={s.noData}>No purchases yet</div>
              : history.sales.map(sale=>(
                <div key={sale.id} style={s.histRow}>
                  <div><div style={s.histNo}>{sale.sale_number}</div><div style={s.histDate}>{new Date(sale.created_at).toLocaleDateString("en-SG")}</div></div>
                  <div style={{textAlign:"right"}}>
                    <div style={s.histAmt}>SGD {sale.total.toFixed(2)}</div>
                    {sale.loyalty_earned>0&&<div style={s.histPts}>+{sale.loyalty_earned} pts</div>}
                    {sale.loyalty_redeemed>0&&<div style={{...s.histPts,color:"#dc2626"}}>−{sale.loyalty_redeemed} pts</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({icon,label,value}){return(<div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",flex:1}}><div style={{fontSize:20,marginBottom:4}}>{icon}</div><div style={{fontSize:11,color:"#6b7280"}}>{label}</div><div style={{fontSize:18,fontWeight:700,color:"#111827",marginTop:2}}>{value}</div></div>);}
function L({children}){return <div style={{fontSize:12,color:"#6b7280",marginBottom:4,marginTop:8}}>{children}</div>;}

const s={page:{padding:28,maxWidth:1200,margin:"0 auto"},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:16},statRow:{display:"flex",gap:12,marginBottom:20},msg:{padding:"10px 16px",borderRadius:9,fontSize:13,marginBottom:14},layout:{display:"grid",gridTemplateColumns:"1fr 300px",gap:20},card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16,marginBottom:12},formTitle:{fontSize:14,fontWeight:700,color:"#111827",marginBottom:8},formRow:{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"},formBtns:{display:"flex",gap:6,alignItems:"flex-end",paddingBottom:0,marginTop:20},cancelBtn:{padding:"8px 12px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",fontSize:13,cursor:"pointer"},saveBtn:{padding:"8px 16px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600},input:{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",outline:"none"},tableWrap:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden"},table:{width:"100%",borderCollapse:"collapse"},th:{textAlign:"left",fontSize:11,color:"#6b7280",textTransform:"uppercase",padding:"10px 14px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",letterSpacing:".04em"},tr:{borderBottom:"1px solid #f3f4f6"},td:{padding:"10px 14px",fontSize:13,color:"#374151",verticalAlign:"middle"},cName:{fontWeight:600,color:"#111827"},pointsBadge:{background:"#f5f3ff",color:"#5b21b6",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:600},viewBtn:{padding:"5px 8px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff"},editBtn2:{padding:"5px 8px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff"},delBtn:{padding:"5px 8px",border:"1px solid #fca5a5",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff",color:"#dc2626"},empty:{textAlign:"center",padding:32,color:"#9ca3af",fontSize:14},emptyDetail:{background:"#f9fafb",border:"2px dashed #e5e7eb",borderRadius:12,padding:40,textAlign:"center",color:"#9ca3af",fontSize:13},detailCard:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden",position:"sticky",top:20},detailHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"16px 18px",borderBottom:"1px solid #f3f4f6"},detailName:{fontSize:16,fontWeight:700,color:"#111827"},detailPhone:{fontSize:13,color:"#6b7280",marginTop:2},closeDet:{background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#9ca3af"},detailStats:{display:"flex",borderBottom:"1px solid #f3f4f6"},dStat:{flex:1,padding:"14px 0",textAlign:"center",borderRight:"1px solid #f3f4f6"},dStatVal:{fontSize:18,fontWeight:700,color:"#4f46e5"},dStatLab:{fontSize:11,color:"#9ca3af",marginTop:2},detailSection:{padding:"12px 18px 6px",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".06em"},noData:{padding:"16px 18px",fontSize:13,color:"#9ca3af"},histRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 18px",borderBottom:"1px solid #f9fafb"},histNo:{fontSize:12,fontWeight:600,color:"#111827"},histDate:{fontSize:11,color:"#9ca3af",marginTop:2},histAmt:{fontSize:13,fontWeight:700,color:"#4f46e5"},histPts:{fontSize:11,color:"#16a34a",marginTop:2}};
