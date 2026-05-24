import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ page, children }) {
  const { user, loading, can } = useAuth();
  if (loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",color:"#6b7280",fontSize:14}}>Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (page && !can(page)) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:12}}>
      <div style={{fontSize:48}}>🔒</div>
      <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Access Denied</div>
      <div style={{fontSize:14,color:"#6b7280"}}>You don't have permission to view this page.</div>
    </div>
  );
  return children;
}
