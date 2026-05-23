export default function Receipt({ sale, onClose }) {
  const handlePrint = () => window.print();
  const dt = new Date(sale.created_at).toLocaleString("en-SG");
  return (
    <div style={s.overlay}>
      <div style={s.modal} id="receipt-print">
        <div style={s.header}>
          <div style={s.shopName}>🛍️ MartManager</div>
          <div style={s.shopSub}>Kids & Baby Fashion Store</div>
          <div style={s.divider}/>
          <div style={s.meta}><span>{sale.sale_number}</span><span>{dt}</span></div>
          <div style={s.meta}><span>Payment: <strong>{sale.payment_method}</strong></span>{sale.served_by&&<span>By: {sale.served_by}</span>}</div>
        </div>

        <div style={s.divider}/>
        <div style={s.itemsHeader}><span>Item</span><span>Qty</span><span>Total</span></div>
        <div style={s.divider}/>

        {sale.items.map((item,i) => (
          <div key={i} style={s.itemRow}>
            <div style={s.itemName}>{item.product_name}<div style={s.itemSku}>{item.sku} @ SGD {parseFloat(item.unit_price).toFixed(2)}</div></div>
            <div style={s.itemQty}>{item.quantity}</div>
            <div style={s.itemTotal}>SGD {parseFloat(item.line_total).toFixed(2)}</div>
          </div>
        ))}

        <div style={s.divider}/>
        <Row label="Subtotal"      value={`SGD ${parseFloat(sale.subtotal).toFixed(2)}`}/>
        {parseFloat(sale.discount_amount)>0&&(
          <Row label={`Discount (${sale.discount_type==="PERCENT"?sale.discount_value+"%":"SGD "+sale.discount_value})`} value={`− SGD ${parseFloat(sale.discount_amount).toFixed(2)}`} color="#dc2626"/>
        )}
        <div style={s.totalRow}><span>TOTAL</span><span>SGD {parseFloat(sale.total).toFixed(2)}</span></div>
        {sale.amount_paid&&<Row label="Paid" value={`SGD ${parseFloat(sale.amount_paid).toFixed(2)}`}/>}
        {parseFloat(sale.change_given||0)>0&&<Row label="Change" value={`SGD ${parseFloat(sale.change_given).toFixed(2)}`} color="#16a34a"/>}

        <div style={s.divider}/>
        <div style={s.footer}>Thank you for shopping with us! 💕</div>
        {sale.note&&<div style={s.note}>Note: {sale.note}</div>}

        <div style={s.actions} className="no-print">
          <button style={s.printBtn} onClick={handlePrint}>🖨️ Print Receipt</button>
          <button style={s.closeBtn} onClick={onClose}>✕ Close</button>
        </div>
      </div>
      <style>{`@media print { .no-print { display:none!important; } body * { visibility:hidden; } #receipt-print, #receipt-print * { visibility:visible; } #receipt-print { position:fixed;left:0;top:0;width:300px; } }`}</style>
    </div>
  );
}
function Row({label,value,color="#374151"}){return <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"3px 0",color}}><span>{label}</span><span>{value}</span></div>;}
const s={overlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999},modal:{background:"#fff",borderRadius:14,padding:24,width:320,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)",fontFamily:"monospace"},header:{textAlign:"center",marginBottom:8},shopName:{fontSize:18,fontWeight:700,color:"#111827"},shopSub:{fontSize:12,color:"#6b7280",marginTop:2},divider:{borderTop:"1px dashed #d1d5db",margin:"10px 0"},meta:{display:"flex",justifyContent:"space-between",fontSize:11,color:"#6b7280",marginTop:4},itemsHeader:{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase"},itemRow:{display:"flex",alignItems:"flex-start",padding:"6px 0",borderBottom:"1px solid #f9fafb",gap:8},itemName:{flex:1,fontSize:12,color:"#111827"},itemSku:{fontSize:10,color:"#9ca3af"},itemQty:{fontSize:12,minWidth:24,textAlign:"center"},itemTotal:{fontSize:12,fontWeight:600,minWidth:70,textAlign:"right"},totalRow:{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700,color:"#111827",padding:"8px 0",marginTop:4,borderTop:"2px solid #111827"},footer:{textAlign:"center",fontSize:12,color:"#6b7280",marginTop:8},note:{textAlign:"center",fontSize:11,color:"#9ca3af",marginTop:4},actions:{display:"flex",gap:8,marginTop:16},printBtn:{flex:1,padding:"10px",background:"#4f46e5",color:"#fff",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",fontWeight:600},closeBtn:{padding:"10px 14px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,cursor:"pointer",background:"#f9fafb"}};
