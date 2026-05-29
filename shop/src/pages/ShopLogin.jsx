import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { shopLogin, shopRegister } from "../api/shop";
import { useShopAuth } from "../context/ShopAuthContext";

export default function ShopLogin() {
  const [tab,      setTab]      = useState("login");
  const [form,     setForm]     = useState({ name:"", phone:"", password:"" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const { loginCustomer } = useShopAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.phone.trim() || !form.password.trim()) return setError("Please fill in all required fields");
    if (tab === "register" && !form.name.trim()) return setError("Please enter your name");
    if (tab === "register" && form.password.length < 6) return setError("Password must be at least 6 characters");
    setLoading(true); setError("");
    try {
      const fn = tab === "login" ? shopLogin : shopRegister;
      const r  = await fn(form);
      loginCustomer(r.data.access_token, r.data.customer);
      navigate("/account");
    } catch(e) { setError(e.response?.data?.detail || "Error. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🛍️</div>
        <h1 style={s.title}>MartShop</h1>

        <div style={s.tabs}>
          <button style={{...s.tab,...(tab==="login"?s.tabActive:{})}} onClick={()=>{setTab("login");setError("");}}>Sign In</button>
          <button style={{...s.tab,...(tab==="register"?s.tabActive:{})}} onClick={()=>{setTab("register");setError("");}}>Create Account</button>
        </div>

        {error && <div style={s.error}>⚠️ {error}</div>}

        {tab === "register" && (
          <div style={s.field}>
            <label style={s.label}>Full name *</label>
            <input style={s.input} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your full name"/>
          </div>
        )}
        <div style={s.field}>
          <label style={s.label}>Phone number *</label>
          <input style={s.input} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+65 9xxx xxxx" type="tel"/>
        </div>
        <div style={s.field}>
          <label style={s.label}>Password *</label>
          <div style={s.passWrap}>
            <input style={{...s.input,paddingRight:44}} type={showPass?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder={tab==="register"?"Min 6 characters":"Your password"}/>
            <button style={s.eyeBtn} onClick={()=>setShowPass(p=>!p)} type="button">{showPass?"🙈":"👁️"}</button>
          </div>
        </div>

        <button style={{...s.submitBtn,...(loading?{background:"#c7d2fe",cursor:"not-allowed"}:{})}} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait…" : tab==="login" ? "Sign In →" : "Create Account →"}
        </button>

        <div style={s.divider}>or</div>
        <div style={s.guestNote}>
          You can also <Link to="/checkout" style={s.guestLink}>checkout as guest</Link> without creating an account.
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:"calc(100vh - 64px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 20px", background:"#f9fafb" },
  card:      { background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, padding:"36px 32px", width:380, maxWidth:"100%" },
  logo:      { fontSize:40, textAlign:"center", marginBottom:8 },
  title:     { fontSize:22, fontWeight:800, color:"#111827", textAlign:"center", marginBottom:20 },
  tabs:      { display:"flex", background:"#f3f4f6", borderRadius:10, padding:4, marginBottom:20 },
  tab:       { flex:1, padding:"9px", border:"none", borderRadius:8, fontSize:13, cursor:"pointer", background:"transparent", color:"#6b7280", fontWeight:500 },
  tabActive: { background:"#fff", color:"#4f46e5", fontWeight:700, boxShadow:"0 1px 4px rgba(0,0,0,.1)" },
  error:     { background:"#fef2f2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 },
  field:     { marginBottom:14 },
  label:     { display:"block", fontSize:13, fontWeight:500, color:"#374151", marginBottom:5 },
  input:     { width:"100%", padding:"10px 14px", border:"1px solid #d1d5db", borderRadius:9, fontSize:14, outline:"none", boxSizing:"border-box" },
  passWrap:  { position:"relative" },
  eyeBtn:    { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16 },
  submitBtn: { width:"100%", padding:"13px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:15, fontWeight:700, cursor:"pointer", marginTop:6 },
  divider:   { textAlign:"center", color:"#9ca3af", fontSize:13, margin:"16px 0" },
  guestNote: { textAlign:"center", fontSize:13, color:"#6b7280" },
  guestLink: { color:"#4f46e5", fontWeight:600 },
};
