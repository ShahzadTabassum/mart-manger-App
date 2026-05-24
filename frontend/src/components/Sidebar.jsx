import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const allGroups = [
  { label:"SALES", links:[
    { to:"/",         icon:"📊", label:"Dashboard",        page:"dashboard"  },
    { to:"/pos",      icon:"🛒", label:"Point of Sale",    page:"pos"        },
    { to:"/sales",    icon:"🧾", label:"Sales & Reports",  page:"sales"      },
    { to:"/returns",  icon:"🔄", label:"Returns & Exchange",page:"returns"   },
    { to:"/customers",icon:"👥", label:"Customers",        page:"customers"  },
  ]},
  { label:"INVENTORY", links:[
    { to:"/products",   icon:"📦", label:"Products",    page:"products"   },
    { to:"/categories", icon:"🗂️", label:"Categories",  page:"categories" },
    { to:"/inventory",  icon:"🔔", label:"Inventory",   page:"inventory"  },
    { to:"/suppliers",  icon:"🚚", label:"Suppliers",   page:"suppliers"  },
  ]},
  { label:"STAFF", links:[
    { to:"/employees", icon:"👨‍💼", label:"Salesman",   page:"employees"  },
    { to:"/users",     icon:"🔐", label:"User Access",  page:"users"      },
  ]},
];

export default function Sidebar() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const ROLE_CLR = { ADMIN:"#7c3aed", MANAGER:"#1d4ed8", CASHIER:"#047857" };

  return (
    <aside style={s.aside}>
      <div style={s.logo}>
        <div style={s.logoIcon}>🛍️</div>
        <div>
          <div style={s.logoName}>MartManager</div>
          <div style={s.logoSub}>v4.0 · Full Management</div>
        </div>
      </div>

      <nav style={{flex:1,overflowY:"auto"}}>
        {allGroups.map(g => {
          const visibleLinks = g.links.filter(l => can(l.page));
          if (!visibleLinks.length) return null;
          return (
            <div key={g.label}>
              <div style={s.groupLabel}>{g.label}</div>
              {visibleLinks.map(l => (
                <NavLink key={l.to} to={l.to} end={l.to==="/"} style={({isActive})=>({...s.link,...(isActive?s.linkActive:{})})}>
                  <span>{l.icon}</span> {l.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {user && (
        <div style={s.userBox}>
          <div style={{...s.avatar, background: ROLE_CLR[user.role]||"#4f46e5"}}>{user.name[0].toUpperCase()}</div>
          <div style={s.userInfo}>
            <div style={s.userName}>{user.name}</div>
            <div style={s.userRole}>{user.role}</div>
          </div>
          <button style={s.logoutBtn} onClick={handleLogout} title="Logout">⏻</button>
        </div>
      )}
    </aside>
  );
}

const s={aside:{width:220,background:"#1e1b4b",display:"flex",flexDirection:"column",height:"100vh",flexShrink:0},logo:{display:"flex",alignItems:"center",gap:10,padding:"20px 16px",borderBottom:"1px solid #312e81"},logoIcon:{fontSize:28},logoName:{color:"#e0e7ff",fontWeight:700,fontSize:15},logoSub:{color:"#818cf8",fontSize:11},groupLabel:{fontSize:10,fontWeight:700,color:"#4338ca",letterSpacing:".08em",padding:"14px 20px 5px",textTransform:"uppercase"},link:{display:"flex",alignItems:"center",gap:10,padding:"9px 20px",color:"#a5b4fc",textDecoration:"none",fontSize:13,borderLeft:"3px solid transparent",transition:"all .15s"},linkActive:{color:"#fff",background:"#312e81",borderLeftColor:"#818cf8"},userBox:{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderTop:"1px solid #312e81"},avatar:{width:32,height:32,borderRadius:"50%",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0},userInfo:{flex:1,overflow:"hidden"},userName:{color:"#e0e7ff",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},userRole:{color:"#818cf8",fontSize:11},logoutBtn:{background:"none",border:"none",color:"#6366f1",cursor:"pointer",fontSize:18,padding:"4px",lineHeight:1}};
