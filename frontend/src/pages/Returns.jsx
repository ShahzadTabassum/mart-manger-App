import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import { getEmployees } from "../api/employees";
import axios from "axios";

const API = axios.create({ baseURL: "http://localhost:8000" });

export default function Returns() {
  const [tab,        setTab]       = useState("new");
  const [products,   setProducts]  = useState([]);
  const [salesmen,   setSalesmen]  = useState([]);
  const [history,    setHistory]   = useState([]);
  const [type,       setType]      = useState("REFUND");
  const [saleId,     setSaleId]    = useState("");
  const [reason,     setReason]    = useState("");
  const [servedBy,   setServedBy]  = useState("");
  const [refundMethod,setRefundMethod] = useState("CASH");
  const [retItems,   setRetItems]  = useState([]);   // items being returned
  const [excItems,   setExcItems]  = useState([]);   // items given in exchange
  const [search,     setSearch]    = useState("");
  const [excSearch,  setExcSearch] = useState("");
  const [result,     setResult]    = useState(null);
  const [submitting, setSubmitting]= useState(false);
  const [msg,        setMsg]       = useState({text:"",ok:true});

  useEffect(()=>{
    getProducts().then(r=>setProducts(r.data));
    getEmployees().then(r=>setSalesmen(r.data));
    loadHistory();
  },[]);

  const loadHistory=()=>API.get("/returns/").then(r=>setHistory(r.data));
  const showMsg=(text,ok=true)=>{setMsg({text,ok});setTimeout(()=>setMsg({text:"",ok:true}),4000);};

  const filteredRet = products.filter(p=>search && (p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase()))).slice(0,8);
  const filteredExc = products.filter(p=>excSearch && (p.name.toLowerCase().includes(excSearch.toLowerCase())||p.sku.toLowerCase().includes(excSearch.toLowerCase()))).slice(0,8);

  const addRetItem=(p)=>{
    setRetItems(c=>{const ex=c.find(i=>i.product_id===p.id);if(ex)return c.map(i=>i.product_id===p.id?{...i,quantity:i.quantity+1}:i);return[...c,{product_id:p.id,name:p.name,sku:p.sku,price:parseFloat(p.price),quantity:1}];});
    setSearch("");
  };
  const addExcItem=(p)=>{
    setExcItems(c=>{const ex=c.find(i=>i.product_id===p.id);if(ex)return c.map(i=>i.product_id===p.id?{...i,quantity:i.quantity+1}:i);return[...c,{product_id:p.id,name:p.name,sku:p.sku,price:parseFloat(p.price),quantity:1}];});
    setExcSearch("");
  };
  const updateRetQty=(id,qty)=>{ if(qty<1)setRetItems(c=>c.filter(i=>i.product_id!==id)); else setRetItems(c=>c.map(i=>i.product_id===id?{...i,quantity:qty}:i)); };
  const updateExcQty=(id,qty)=>{ if(qty<1)setExcItems(c=>c.filter(i=>i.product_id!==id)); else setExcItems(c=>c.map(i=>i.product_id===id?{...i,quantity:qty}:i)); };

  const retTotal = retItems.reduce((a,i)=>a+i.price*i.quantity,0);
  const excTotal = excItems.reduce((a,i)=>a+i.price*i.quantity,0);
  const refundAmt = Math.max(0, retTotal-excTotal);
  const extraPay  = Math.max(0, excTotal-retTotal);

  const handleSubmit = async()=>{
    if(!retItems.length) return showMsg("Add at least one return item",false);
    if(type==="EXCHANGE"&&!excItems.length) return showMsg("Add at least one exchange item",false);
    setSubmitting(true);
    try{
      const r=await API.post("/returns/",{
        original_sale_id: saleId?parseInt(saleId):null,
        type, reason: reason||null,
        refund_method: type==="REFUND"?refundMethod:null,
        return_items:  retItems.map(i=>({product_id:i.product_id,quantity:i.quantity})),
        exchange_items:type==="EXCHANGE"?excItems.map(i=>({product_id:i.product_id,quantity:i.quantity})):[],
        served_by: servedBy||null,
      });
      setResult(r.data);
      setRetItems([]);setExcItems([]);setSaleId("");setReason("");setServedBy("");
      loadHistory();
    }catch(e){showMsg(e.response?.data?.detail||"Error processing return",false);}
    setSubmitting(false);
  };

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Returns & Exchanges</h1>

      <div style={s.tabs}>
        {[["new","🔄 New Return/Exchange"],["history","📋 History"]].map(([t,l])=>(
          <button key={t} style={{...s.tab,...(tab===t?s.tabActive:{})}} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {msg.text&&<div style={{...s.msg,background:msg.ok?"#f0fdf4":"#fef2f2",color:msg.ok?"#166534":"#dc2626",border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`}}>{msg.ok?"✅":"❌"} {msg.text}</div>}

      {/* ── SUCCESS RESULT ── */}
      {result&&(
        <div style={s.resultBox}>
          <div style={s.resultTitle}>✅ {result.return_number} processed!</div>
          <div style={s.resultGrid}>
            <div><span style={s.rl}>Type</span><span style={s.rv}>{result.type}</span></div>
            <div><span style={s.rl}>Return value</span><span style={s.rv}>SGD {result.return_total?.toFixed(2)}</span></div>
            {result.exchange_total>0&&<div><span style={s.rl}>Exchange value</span><span style={s.rv}>SGD {result.exchange_total?.toFixed(2)}</span></div>}
            {result.refund_amount>0&&<div><span style={s.rl}>Refund to customer</span><span style={{...s.rv,color:"#16a34a",fontWeight:700}}>SGD {result.refund_amount?.toFixed(2)} ({result.refund_method})</span></div>}
            {result.extra_to_pay>0&&<div><span style={s.rl}>Customer pays extra</span><span style={{...s.rv,color:"#dc2626",fontWeight:700}}>SGD {result.extra_to_pay?.toFixed(2)}</span></div>}
          </div>
          <button style={s.newRetBtn} onClick={()=>setResult(null)}>+ New Return</button>
        </div>
      )}

      {tab==="new"&&!result&&(
        <div style={s.layout}>
          {/* LEFT */}
          <div>
            {/* Type toggle */}
            <div style={s.card}>
              <div style={s.cardTitle}>Type</div>
              <div style={s.typeBtns}>
                <button style={{...s.typeBtn,...(type==="REFUND"?s.typeBtnActive:{})}} onClick={()=>{setType("REFUND");setExcItems([]); }}>💰 Refund</button>
                <button style={{...s.typeBtn,...(type==="EXCHANGE"?s.typeBtnActiveExc:{})}} onClick={()=>setType("EXCHANGE")}>🔁 Exchange</button>
              </div>
            </div>

            {/* Returned items */}
            <div style={s.card}>
              <div style={s.cardTitle}>📦 Items Being Returned</div>
              <input style={s.search} placeholder="Search product to return…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search&&filteredRet.length>0&&(
                <div style={s.dropdown}>
                  {filteredRet.map(p=>(
                    <div key={p.id} style={s.dropRow} onClick={()=>addRetItem(p)}>
                      <div><div style={s.drName}>{p.name}</div><div style={s.drSku}>{p.sku}</div></div>
                      <div style={s.drPrice}>SGD {parseFloat(p.price).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
              {retItems.length===0&&<div style={s.emptyList}>No items added yet</div>}
              {retItems.map(item=>(
                <div key={item.product_id} style={s.itemRow}>
                  <div style={{flex:1}}><div style={s.iName}>{item.name}</div><div style={s.iSku}>{item.sku} · SGD {item.price.toFixed(2)}</div></div>
                  <div style={s.qtyCtrl}>
                    <button style={s.qb} onClick={()=>updateRetQty(item.product_id,item.quantity-1)}>−</button>
                    <span style={s.qv}>{item.quantity}</span>
                    <button style={s.qb} onClick={()=>updateRetQty(item.product_id,item.quantity+1)}>+</button>
                  </div>
                  <div style={s.iTotal}>SGD {(item.price*item.quantity).toFixed(2)}</div>
                </div>
              ))}
              {retItems.length>0&&<div style={s.subtotalRow}>Return value: <strong>SGD {retTotal.toFixed(2)}</strong></div>}
            </div>

            {/* Exchange items */}
            {type==="EXCHANGE"&&(
              <div style={s.card}>
                <div style={s.cardTitle}>🔁 Items Given in Exchange</div>
                <input style={s.search} placeholder="Search product to give…" value={excSearch} onChange={e=>setExcSearch(e.target.value)}/>
                {excSearch&&filteredExc.length>0&&(
                  <div style={s.dropdown}>
                    {filteredExc.map(p=>(
                      <div key={p.id} style={s.dropRow} onClick={()=>addExcItem(p)}>
                        <div><div style={s.drName}>{p.name}</div><div style={s.drSku}>{p.sku} · {p.inventory?.quantity} in stock</div></div>
                        <div style={s.drPrice}>SGD {parseFloat(p.price).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {excItems.length===0&&<div style={s.emptyList}>No exchange items added yet</div>}
                {excItems.map(item=>(
                  <div key={item.product_id} style={s.itemRow}>
                    <div style={{flex:1}}><div style={s.iName}>{item.name}</div><div style={s.iSku}>{item.sku} · SGD {item.price.toFixed(2)}</div></div>
                    <div style={s.qtyCtrl}>
                      <button style={s.qb} onClick={()=>updateExcQty(item.product_id,item.quantity-1)}>−</button>
                      <span style={s.qv}>{item.quantity}</span>
                      <button style={s.qb} onClick={()=>updateExcQty(item.product_id,item.quantity+1)}>+</button>
                    </div>
                    <div style={s.iTotal}>SGD {(item.price*item.quantity).toFixed(2)}</div>
                  </div>
                ))}
                {excItems.length>0&&<div style={s.subtotalRow}>Exchange value: <strong>SGD {excTotal.toFixed(2)}</strong></div>}
              </div>
            )}
          </div>

          {/* RIGHT: details panel */}
          <div style={s.panel}>
            <div style={s.panelTitle}>📋 Return Details</div>

            <L>Original Sale ID (optional)</L>
            <input style={s.input} placeholder="e.g. 12 (from sale history)" value={saleId} onChange={e=>setSaleId(e.target.value)}/>

            <L>Reason for return</L>
            <textarea style={{...s.input,height:64,resize:"vertical"}} placeholder="e.g. Wrong size, defective item…" value={reason} onChange={e=>setReason(e.target.value)}/>

            {type==="REFUND"&&(
              <>
                <L>Refund method</L>
                <div style={s.payBtns}>
                  {[["CASH","💵 Cash"],["CARD","💳 Card"],["QR","📱 QR"]].map(([v,l])=>(
                    <button key={v} style={{...s.payBtn,...(refundMethod===v?s.payBtnActive:{})}} onClick={()=>setRefundMethod(v)}>{l}</button>
                  ))}
                </div>
              </>
            )}

            <L>Processed by</L>
            <select style={s.input} value={servedBy} onChange={e=>setServedBy(e.target.value)}>
              <option value="">Select salesman</option>
              {salesmen.map(sm=><option key={sm.id} value={sm.name}>{sm.name}</option>)}
            </select>

            {/* Summary */}
            {(retItems.length>0||excItems.length>0)&&(
              <div style={s.summary}>
                <SumRow label="Return value"    value={`SGD ${retTotal.toFixed(2)}`}/>
                {excTotal>0&&<SumRow label="Exchange value" value={`SGD ${excTotal.toFixed(2)}`}/>}
                {refundAmt>0&&<SumRow label="Refund to customer" value={`SGD ${refundAmt.toFixed(2)}`} color="#16a34a"/>}
                {extraPay>0&&<SumRow label="Customer pays extra" value={`SGD ${extraPay.toFixed(2)}`} color="#dc2626"/>}
              </div>
            )}

            <button style={{...s.submitBtn,...(submitting?{background:"#c7d2fe",cursor:"not-allowed"}:{})}} onClick={handleSubmit} disabled={submitting}>
              {submitting?"Processing…":`✅ Process ${type === "REFUND"?"Refund":"Exchange"}`}
            </button>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab==="history"&&(
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead><tr>{["Return #","Type","Returned Items","Exchange Items","Refund","Reason","By","Date"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {history.length===0?<tr><td colSpan={8} style={s.empty}>No returns yet</td></tr>
              :history.map(r=>(
                <tr key={r.id} style={s.tr}>
                  <td style={s.td}><code style={s.retNo}>{r.return_number}</code></td>
                  <td style={s.td}><span style={{...s.badge,...(r.type==="REFUND"?{background:"#fef2f2",color:"#dc2626"}:{background:"#eff6ff",color:"#1d4ed8"})}}>{r.type}</span></td>
                  <td style={s.td}>{r.return_items.map(i=>`${i.product_name} x${i.quantity}`).join(", ")}</td>
                  <td style={s.td}>{r.exchange_items.length>0?r.exchange_items.map(i=>`${i.product_name} x${i.quantity}`).join(", "):"—"}</td>
                  <td style={{...s.td,fontWeight:700,color:"#16a34a"}}>{r.refund_amount>0?`SGD ${r.refund_amount.toFixed(2)}`:"—"}</td>
                  <td style={s.td}>{r.reason||"—"}</td>
                  <td style={s.td}>{r.served_by||"—"}</td>
                  <td style={s.td}>{new Date(r.created_at).toLocaleDateString("en-SG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function L({children}){return <div style={{fontSize:12,color:"#6b7280",marginBottom:4,marginTop:12}}>{children}</div>;}
function SumRow({label,value,color="#374151"}){return <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"4px 0",color}}><span>{label}</span><strong>{value}</strong></div>;}

const s={page:{padding:28,maxWidth:1200,margin:"0 auto"},h1:{fontSize:22,fontWeight:700,color:"#111827",marginBottom:16},tabs:{display:"flex",gap:8,marginBottom:16},tab:{padding:"9px 18px",border:"1px solid #e5e7eb",borderRadius:9,fontSize:13,cursor:"pointer",background:"#fff",color:"#6b7280"},tabActive:{background:"#4f46e5",color:"#fff",borderColor:"#4f46e5"},msg:{padding:"10px 16px",borderRadius:9,fontSize:13,marginBottom:14},resultBox:{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:12,padding:20,marginBottom:20},resultTitle:{fontSize:16,fontWeight:700,color:"#166534",marginBottom:12},resultGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16},rl:{fontSize:12,color:"#6b7280",display:"block"},rv:{fontSize:14,fontWeight:600,color:"#111827"},newRetBtn:{padding:"9px 18px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600},layout:{display:"grid",gridTemplateColumns:"1fr 300px",gap:20},card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16,marginBottom:14},cardTitle:{fontSize:14,fontWeight:700,color:"#111827",marginBottom:12},typeBtns:{display:"flex",gap:8},typeBtn:{flex:1,padding:"10px",border:"1px solid #e5e7eb",borderRadius:9,fontSize:13,cursor:"pointer",background:"#f9fafb",fontWeight:600,color:"#6b7280"},typeBtnActive:{background:"#fef2f2",color:"#dc2626",borderColor:"#fca5a5"},typeBtnActiveExc:{background:"#eff6ff",color:"#1d4ed8",borderColor:"#93c5fd"},search:{width:"100%",padding:"9px 12px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",outline:"none",marginBottom:8},dropdown:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:9,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.08)",marginBottom:8},dropRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f9fafb"},drName:{fontSize:13,fontWeight:600,color:"#111827"},drSku:{fontSize:11,color:"#9ca3af"},drPrice:{fontSize:13,fontWeight:700,color:"#4f46e5"},emptyList:{fontSize:13,color:"#d1d5db",textAlign:"center",padding:"16px 0",fontStyle:"italic"},itemRow:{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #f9fafb"},iName:{fontSize:13,fontWeight:600,color:"#111827"},iSku:{fontSize:11,color:"#9ca3af"},qtyCtrl:{display:"flex",alignItems:"center",gap:6},qb:{width:26,height:26,border:"1px solid #e5e7eb",borderRadius:6,background:"#f9fafb",cursor:"pointer",fontSize:14},qv:{fontSize:13,fontWeight:600,minWidth:20,textAlign:"center"},iTotal:{fontSize:13,fontWeight:700,color:"#4f46e5",minWidth:70,textAlign:"right"},subtotalRow:{fontSize:13,color:"#6b7280",textAlign:"right",paddingTop:8,marginTop:4,borderTop:"1px solid #f3f4f6"},panel:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:18,position:"sticky",top:20},panelTitle:{fontSize:14,fontWeight:700,color:"#111827",marginBottom:8},input:{width:"100%",padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",outline:"none",background:"#fff",color:"#111827"},payBtns:{display:"flex",gap:6},payBtn:{flex:1,padding:"8px 4px",border:"1px solid #e5e7eb",borderRadius:7,fontSize:12,cursor:"pointer",background:"#f9fafb",fontWeight:500},payBtnActive:{background:"#eef2ff",borderColor:"#4f46e5",color:"#4f46e5"},summary:{background:"#f9fafb",borderRadius:9,padding:"12px 14px",marginTop:12},submitBtn:{width:"100%",marginTop:14,padding:"12px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:9,fontSize:14,fontWeight:700,cursor:"pointer"},tableWrap:{background:"#fff",borderRadius:12,border:"1px solid #e5e7eb",overflow:"hidden"},table:{width:"100%",borderCollapse:"collapse"},th:{textAlign:"left",fontSize:11,color:"#6b7280",textTransform:"uppercase",padding:"11px 14px",background:"#f9fafb",borderBottom:"1px solid #e5e7eb",letterSpacing:".04em"},tr:{borderBottom:"1px solid #f3f4f6"},td:{padding:"11px 14px",fontSize:13,color:"#374151",verticalAlign:"middle"},retNo:{fontSize:11,background:"#f3f4f6",padding:"2px 6px",borderRadius:4},badge:{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:700},empty:{textAlign:"center",padding:32,color:"#9ca3af",fontSize:14}};
