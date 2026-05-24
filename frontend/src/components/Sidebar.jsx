import { NavLink } from "react-router-dom";
const groups = [
  { label:"SALES", links:[
    { to:"/",         icon:"📊", label:"Dashboard"      },
    { to:"/pos",      icon:"🛒", label:"Point of Sale"  },
    { to:"/sales",    icon:"🧾", label:"Sales & Reports"},
    { to:"/customers",icon:"👥", label:"Customers"      },
  ]},
  { label:"INVENTORY", links:[
    { to:"/products",   icon:"📦", label:"Products"   },
    { to:"/categories", icon:"🗂️", label:"Categories" },
    { to:"/inventory",  icon:"🔔", label:"Inventory"  },
    { to:"/suppliers",  icon:"🚚", label:"Suppliers"  },
  ]},
  { label:"STAFF", links:[
    { to:"/employees", icon:"👨‍💼", label:"Employees" },
  ]},
];
export default function Sidebar() {
  return (
    <aside style={s.aside}>
      <div style={s.logo}>
        <div style={s.logoIcon}>🛍️</div>
        <div>
          <div style={s.logoName}>MartManager</div>
          <div style={s.logoSub}>v3.0 · Full Management</div>
        </div>
      </div>
      <nav style={{flex:1,overflowY:"auto"}}>
        {groups.map(g=>(
          <div key={g.label}>
            <div style={s.groupLabel}>{g.label}</div>
            {g.links.map(l=>(
              <NavLink key={l.to} to={l.to} end={l.to==="/"} style={({isActive})=>({...s.link,...(isActive?s.linkActive:{})})}>
                <span>{l.icon}</span> {l.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div style={s.footer}>Phase 3 — Customers & Staff</div>
    </aside>
  );
}
const s={aside:{width:220,background:"#1e1b4b",display:"flex",flexDirection:"column",height:"100vh",flexShrink:0},logo:{display:"flex",alignItems:"center",gap:10,padding:"20px 16px",borderBottom:"1px solid #312e81"},logoIcon:{fontSize:28},logoName:{color:"#e0e7ff",fontWeight:700,fontSize:15},logoSub:{color:"#818cf8",fontSize:11},groupLabel:{fontSize:10,fontWeight:700,color:"#4338ca",letterSpacing:".08em",padding:"14px 20px 5px",textTransform:"uppercase"},link:{display:"flex",alignItems:"center",gap:10,padding:"9px 20px",color:"#a5b4fc",textDecoration:"none",fontSize:13,borderLeft:"3px solid transparent",transition:"all .15s"},linkActive:{color:"#fff",background:"#312e81",borderLeftColor:"#818cf8"},footer:{padding:"14px 20px",color:"#4338ca",fontSize:11,borderTop:"1px solid #312e81"}};
