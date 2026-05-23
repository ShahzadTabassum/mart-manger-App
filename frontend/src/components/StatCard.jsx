export default function StatCard({ icon, label, value, sub, subColor="#16a34a" }) {
  return (
    <div style={s.card}>
      <div style={s.icon}>{icon}</div>
      <div style={s.label}>{label}</div>
      <div style={s.value}>{value}</div>
      {sub && <div style={{...s.sub, color:subColor}}>{sub}</div>}
    </div>
  );
}
const s = {
  card:  { background:"#fff", borderRadius:12, padding:"18px 20px", border:"1px solid #e5e7eb", flex:1, minWidth:160 },
  icon:  { fontSize:24, marginBottom:8 },
  label: { fontSize:12, color:"#6b7280", marginBottom:4 },
  value: { fontSize:26, fontWeight:700, color:"#111827" },
  sub:   { fontSize:12, marginTop:4 },
};
