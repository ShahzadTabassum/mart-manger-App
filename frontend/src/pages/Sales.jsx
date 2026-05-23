import { useEffect, useState } from "react";
import { getSales, getDailyReport, getTopProducts } from "../api/sales";
import Receipt from "../components/Receipt";

export default function Sales() {
  const [sales,      setSales]      = useState([]);
  const [daily,      setDaily]      = useState([]);
  const [topProds,   setTopProds]   = useState([]);
  const [tab,        setTab]        = useState("history");
  const [receipt,    setReceipt]    = useState(null);
  const [dateFilter, setDateFilter] = useState("");
  const [payFilter,  setPayFilter]  = useState("");

  const load = () => {
    const params = {};
    if (dateFilter) params.sale_date      = dateFilter;
    if (payFilter)  params.payment_method = payFilter;
    getSales(params).then(r => setSales(r.data));
    getDailyReport().then(r => setDaily(r.data));
    getTopProducts().then(r => setTopProds(r.data));
  };
  useEffect(load, [dateFilter, payFilter]);

  const PM = { CASH:"💵", CARD:"💳", QR:"📱" };
  const todayRevenue = daily[0] ? parseFloat(daily[0].total_revenue) : 0;
  const todayTx      = daily[0] ? daily[0].total_transactions : 0;

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Sales & Reports</h1>

      <div style={s.tabs}>
        {[["history","📋 Sales History"],["report","📊 Daily Report"],["top","🏆 Top Products"]].map(([t,l])=>(
          <button key={t} style={{...s.tab,...(tab===t?s.tabActive:{})}} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab==="history"&&(
        <>
          <div style={s.filters}>
            <input type="date" style={s.input} value={dateFilter} onChange={e=>setDateFilter(e.target.value)} />
            <select style={s.input} value={payFilter} onChange={e=>setPayFilter(e.target.value)}>
              <option value="">All payments</option>
              <option value="CASH">💵 Cash</option>
              <option value="CARD">💳 Card</option>
              <option value="QR">📱 QR</option>
            </select>
            <button style={s.clearBtn} onClick={()=>{setDateFilter("");setPayFilter("");}}>Clear filters</button>
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>{["Sale #","Date & Time","Items","Payment","Discount","Total",""].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {sales.length===0?<tr><td colSpan={7} style={s.empty}>No sales found</td></tr>
                :sales.map(sale=>(
                  <tr key={sale.id} style={s.tr}>
                    <td style={s.td}><code style={s.saleNo}>{sale.sale_number}</code></td>
                    <td style={s.td}>{new Date(sale.created_at).toLocaleString("en-SG")}</td>
                    <td style={s.td}>{sale.items?.length ?? "—"} items</td>
                    <td style={s.td}>{PM[sale.payment_method]} {sale.payment_method}</td>
                    <td style={s.td}>{parseFloat(sale.discount_amount)>0?<span style={{color:"#dc2626"}}>− SGD {parseFloat(sale.discount_amount).toFixed(2)}</span>:"—"}</td>
                    <td style={{...s.td,fontWeight:700,color:"#4f46e5"}}>SGD {parseFloat(sale.total).toFixed(2)}</td>
                    <td style={s.td}><button style={s.viewBtn} onClick={()=>setReceipt(sale)}>🧾 Receipt</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab==="report"&&(
        <>
          <div style={s.statRow}>
            <Stat icon="💰" label="Today's Revenue"      value={`SGD ${todayRevenue.toFixed(2)}`} />
            <Stat icon="🧾" label="Today's Transactions" value={todayTx} />
            <Stat icon="💵" label="Cash"  value={`SGD ${daily[0]?parseFloat(daily[0].cash_revenue).toFixed(2):"0.00"}`} />
            <Stat icon="💳" label="Card"  value={`SGD ${daily[0]?parseFloat(daily[0].card_revenue).toFixed(2):"0.00"}`} />
            <Stat icon="📱" label="QR"    value={`SGD ${daily[0]?parseFloat(daily[0].qr_revenue).toFixed(2):"0.00"}`} />
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>{["Date","Transactions","Revenue","Discounts","Cash","Card","QR"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {daily.map((d,i)=>(
                  <tr key={i} style={s.tr}>
                    <td style={s.td}>{d.sale_date}</td>
                    <td style={s.td}>{d.total_transactions}</td>
                    <td style={{...s.td,fontWeight:700,color:"#4f46e5"}}>SGD {parseFloat(d.total_revenue).toFixed(2)}</td>
                    <td style={{...s.td,color:"#dc2626"}}>SGD {parseFloat(d.total_discounts).toFixed(2)}</td>
                    <td style={s.td}>SGD {parseFloat(d.cash_revenue).toFixed(2)}</td>
                    <td style={s.td}>SGD {parseFloat(d.card_revenue).toFixed(2)}</td>
                    <td style={s.td}>SGD {parseFloat(d.qr_revenue).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab==="top"&&(
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>{["#","Product","SKU","Units Sold","Revenue"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {topProds.length===0?<tr><td colSpan={5} style={s.empty}>No sales data yet</td></tr>
              :topProds.map((p,i)=>(
                <tr key={i} style={s.tr}>
                  <td style={{...s.td,fontWeight:700,color:"#9ca3af"}}>#{i+1}</td>
                  <td style={s.td}><strong>{p.product_name}</strong></td>
                  <td style={s.td}><code style={s.saleNo}>{p.sku}</code></td>
                  <td style={{...s.td,fontWeight:700}}>{p.total_units_sold}</td>
                  <td style={{...s.td,fontWeight:700,color:"#4f46e5"}}>SGD {parseFloat(p.total_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {receipt&&<Receipt sale={receipt} onClose={()=>setReceipt(null)}/>}
    </div>
  );
}

function Stat({icon,label,value}){return(<div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"14px 18px",flex:1,minWidth:120}}><div style={{fontSize:20,marginBottom:4}}>{icon}</div><div style={{fontSize:11,color:"#6b7280"}}>{label}</div><div style={{fontSize:18,fontWeight:700,color:"#111827",marginTop:2}}>{value}</div></div>);}

const s={page:{padding:28,maxWidth:1100,margin:"0 auto"},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:20},tabs:{display:"flex",gap:8,marginBottom:20},tab:{padding:"9px 18px",border:"1px solid #e5e7eb",borderRadius:9,fontSize:13,cursor:"pointer",background:"#fff",color:"#6b7280"},tabActive:{background:"#4f46e5",color:"#fff",borderColor:"#4f46e5"},filters:{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"},input:{padding:"8px 12px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,background:"#fff",outline:"none"},clearBtn:{padding:"8px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,cursor:"pointer",background:"#fff"},statRow:{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"},tableWrap:{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"},table:{width:"100%",borderCollapse:"collapse"},th:{textAlign:"left",fontSize:11,color:"#6b7280",textTransform:"uppercase",padding:"12px 16px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",letterSpacing:".04em"},tr:{borderBottom:"1px solid #f3f4f6"},td:{padding:"12px 16px",fontSize:13,color:"#374151"},saleNo:{fontSize:11,background:"#f3f4f6",padding:"2px 6px",borderRadius:4},viewBtn:{padding:"5px 10px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,cursor:"pointer",background:"#fff"},empty:{textAlign:"center",padding:40,color:"#9ca3af",fontSize:14}};
