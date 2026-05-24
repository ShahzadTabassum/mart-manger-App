import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Login() {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) return setError("Please enter phone and password");
    setLoading(true); setError("");
    try {
  const r = await login({ phone: phone.trim(), password });

  loginUser(r.data.access_token, r.data.user);

  navigate("/dashboard");

} catch(err) {
      setError(err.response?.data?.detail || "Invalid phone or password");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🛍️</div>
        <h1 style={s.title}>MartManager</h1>
        <p style={s.sub}>Sign in to continue</p>

        {error && <div style={s.error}>⚠️ {error}</div>}

        <form onSubmit={handleLogin} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Phone number</label>
            <input
              style={s.input}
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoFocus
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.passWrap}>
              <input
                style={{...s.input, paddingRight:44}}
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(p => !p)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button style={{...s.loginBtn,...(loading?s.loginBtnDisabled:{})}} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
          <div style={{ textAlign: "center", marginTop: 14 }}>
  <Link
    to="/forgot-password"
    style={{
      fontSize: 13,
      color: "#4f46e5",
      textDecoration: "none"
    }}
  >
    Forgot Password?
  </Link>
</div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page:           { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f3ff" },
  card:           { background:"#fff", borderRadius:16, padding:"40px 36px", width:380, maxWidth:"95vw", boxShadow:"0 8px 40px rgba(79,70,229,.12)", border:"1px solid #e5e7eb" },
  logo:           { fontSize:48, textAlign:"center", marginBottom:12 },
  title:          { fontSize:24, fontWeight:700, color:"#111827", textAlign:"center", marginBottom:4 },
  sub:            { fontSize:14, color:"#6b7280", textAlign:"center", marginBottom:24 },
  error:          { background:"#fef2f2", color:"#dc2626", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:16 },
  form:           { display:"flex", flexDirection:"column", gap:16 },
  field:          { display:"flex", flexDirection:"column", gap:6 },
  label:          { fontSize:13, fontWeight:500, color:"#374151" },
  input:          { padding:"10px 14px", border:"1px solid #d1d5db", borderRadius:9, fontSize:14, outline:"none", boxSizing:"border-box", width:"100%", color:"#111827" },
  passWrap:       { position:"relative" },
  eyeBtn:         { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16 },
  loginBtn:       { padding:"12px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:15, fontWeight:600, cursor:"pointer", marginTop:4 },
  loginBtnDisabled:{ background:"#c7d2fe", cursor:"not-allowed" },
  hint:           { marginTop:20, padding:"10px 14px", background:"#f5f3ff", borderRadius:8, fontSize:12, color:"#6b7280", lineHeight:1.6 },
};
