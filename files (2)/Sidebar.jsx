import { NavLink } from "react-router-dom";
const links = [
  { to:"/",          icon:"📊", label:"Dashboard"  },
  { to:"/pos",       icon:"🛒", label:"Point of Sale" },
  { to:"/sales",     icon:"🧾", label:"Sales & Reports" },
  { to:"/products",  icon:"📦", label:"Products"   },
  { to:"/inventory", icon:"🔔", label:"Inventory"  },
  { to:"/suppliers", icon:"🚚", label:"Suppliers"  },
];
export default function Sidebar() {
  return (
    <aside style={s.aside}>
      <div style={s.logo}>
        <div style={s.logoIcon}>🛍️</div>
        <div>
          <div style={s.logoName}>MartManager</div>
          <div style={s.logoSub}>v2.0 · Sales & Billing</div>
        </div>
      </div>
      <nav>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to==="/"} style={({isActive})=>({...s.link,...(isActive?s.linkActive:{})})}>
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={s.footer}>Phase 2 — Sales & Billing</div>
    </aside>
  );
}
const s={aside:{width:220,background:"#1e1b4b",display:"flex",flexDirection:"column",height:"100vh",flexShrink:0},logo:{display:"flex",alignItems:"center",gap:10,padding:"20px 16px",borderBottom:"1px solid #312e81"},logoIcon:{fontSize:28},logoName:{color:"#e0e7ff",fontWeight:700,fontSize:15},logoSub:{color:"#818cf8",fontSize:11},link:{display:"flex",alignItems:"center",gap:10,padding:"11px 20px",color:"#a5b4fc",textDecoration:"none",fontSize:14,borderLeft:"3px solid transparent",transition:"all .15s"},linkActive:{color:"#fff",background:"#312e81",borderLeftColor:"#818cf8"},footer:{marginTop:"auto",padding:"16px 20px",color:"#4338ca",fontSize:11}};
