import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import BarcodeLabel from "../components/BarcodeLabel";

export default function Barcodes() {
  const [products,  setProducts]  = useState([]);
  const [selected,  setSelected]  = useState({}); // { product_id: copies }
  const [search,    setSearch]    = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    getProducts().then(r => { setProducts(r.data); setLoading(false); });
  }, []);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected(prev => {
      if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: 1 };
    });
  };

  const setCopies = (id, val) => {
    const n = Math.max(1, Math.min(50, parseInt(val) || 1));
    setSelected(prev => ({ ...prev, [id]: n }));
  };

  const selectAll = () => {
    const all = {};
    filtered.forEach(p => { all[p.id] = 1; });
    setSelected(all);
  };

  const clearAll = () => setSelected({});

  const selectedCount = Object.keys(selected).length;
  const totalLabels   = Object.values(selected).reduce((a, b) => a + b, 0);

  const handlePrint = () => {
    window.print();
  };

  // Build print list
  const printList = [];
  products.forEach(p => {
    const copies = selected[p.id];
    if (copies) {
      for (let i = 0; i < copies; i++) {
        printList.push(p);
      }
    }
  });

  return (
    <div style={s.page}>
      {/* ── Screen view ── */}
      <div className="no-print">
        <div style={s.topbar}>
          <div>
            <h1 style={s.h1}>🏷️ Barcode Generator</h1>
            <p style={s.sub}>Select products → set copies → print and stick on items</p>
          </div>
          <button
            style={{...s.printBtn, ...(totalLabels === 0 ? s.printBtnDisabled : {})}}
            onClick={handlePrint}
            disabled={totalLabels === 0}
          >
            🖨️ Print {totalLabels > 0 ? `${totalLabels} label${totalLabels > 1 ? "s" : ""}` : "labels"}
          </button>
        </div>

        <div style={s.toolbar}>
          <input style={s.search} placeholder="🔍 Search products…" value={search} onChange={e => setSearch(e.target.value)} />
          <label style={s.toggle}>
            <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} />
            <span> Show price on label</span>
          </label>
          <button style={s.selBtn} onClick={selectAll}>Select all</button>
          {selectedCount > 0 && <button style={s.clearBtn} onClick={clearAll}>Clear ({selectedCount})</button>}
        </div>

        <div style={s.layout}>
          {/* Product list */}
          <div style={s.listCol}>
            {loading && <div style={s.empty}>Loading products…</div>}
            {!loading && filtered.length === 0 && <div style={s.empty}>No products found</div>}
            {filtered.map(p => {
              const isSelected = !!selected[p.id];
              return (
                <div key={p.id} style={{...s.productRow, ...(isSelected ? s.productRowSelected : {})}}>
                  <div style={s.productLeft} onClick={() => toggleSelect(p.id)}>
                    <div style={{...s.checkbox, ...(isSelected ? s.checkboxOn : {})}}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <div>
                      <div style={s.pName}>{p.name}</div>
                      <div style={s.pMeta}><code style={s.sku}>{p.sku}</code> · SGD {parseFloat(p.price).toFixed(2)}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div style={s.copiesWrap}>
                      <span style={s.copiesLabel}>Copies:</span>
                      <button style={s.qtyBtn} onClick={() => setCopies(p.id, (selected[p.id] || 1) - 1)}>−</button>
                      <input
                        style={s.copiesInput}
                        type="number" min="1" max="50"
                        value={selected[p.id] || 1}
                        onChange={e => setCopies(p.id, e.target.value)}
                      />
                      <button style={s.qtyBtn} onClick={() => setCopies(p.id, (selected[p.id] || 1) + 1)}>+</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div style={s.previewCol}>
            <div style={s.previewTitle}>Preview</div>
            {totalLabels === 0
              ? <div style={s.previewEmpty}>Select products from the list to preview their barcodes</div>
              : (
                <div style={s.previewGrid}>
                  {printList.slice(0, 6).map((p, i) => (
                    <BarcodeLabel key={i} sku={p.sku} name={p.name} price={p.price} showPrice={showPrice} />
                  ))}
                  {totalLabels > 6 && (
                    <div style={s.moreLabels}>+{totalLabels - 6} more labels</div>
                  )}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* ── Print view (only shown when printing) ── */}
      <div className="print-only" style={s.printGrid}>
        {printList.map((p, i) => (
          <BarcodeLabel key={i} sku={p.sku} name={p.name} price={p.price} showPrice={showPrice} />
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: flex !important; }
          body { background: white; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  page:              { padding:24, maxWidth:1200, margin:"0 auto" },
  topbar:            { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:12 },
  h1:                { fontSize:22, fontWeight:700, color:"#111827", marginBottom:4 },
  sub:               { fontSize:13, color:"#9ca3af" },
  printBtn:          { padding:"10px 20px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" },
  printBtnDisabled:  { background:"#c7d2fe", cursor:"not-allowed" },
  toolbar:           { display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" },
  search:            { flex:1, minWidth:200, padding:"9px 14px", border:"1px solid #d1d5db", borderRadius:9, fontSize:13, outline:"none" },
  toggle:            { display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#374151", cursor:"pointer" },
  selBtn:            { padding:"8px 14px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" },
  clearBtn:          { padding:"8px 14px", border:"1px solid #fca5a5", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fef2f2", color:"#dc2626" },
  layout:            { display:"grid", gridTemplateColumns:"1fr 380px", gap:20 },
  listCol:           { display:"flex", flexDirection:"column", gap:8 },
  productRow:        { display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 16px", cursor:"pointer", transition:"border .15s", gap:12 },
  productRowSelected:{ borderColor:"#4f46e5", background:"#f5f3ff" },
  productLeft:       { display:"flex", alignItems:"center", gap:12, flex:1 },
  checkbox:          { width:22, height:22, border:"2px solid #d1d5db", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0, color:"#fff" },
  checkboxOn:        { background:"#4f46e5", borderColor:"#4f46e5" },
  pName:             { fontSize:14, fontWeight:600, color:"#111827" },
  pMeta:             { fontSize:12, color:"#6b7280", marginTop:2 },
  sku:               { background:"#f3f4f6", padding:"1px 6px", borderRadius:4, fontSize:11 },
  copiesWrap:        { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  copiesLabel:       { fontSize:12, color:"#6b7280" },
  qtyBtn:            { width:26, height:26, border:"1px solid #e5e7eb", borderRadius:6, background:"#f9fafb", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" },
  copiesInput:       { width:44, textAlign:"center", padding:"4px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, outline:"none" },
  previewCol:        { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:20, maxHeight:"80vh", overflowY:"auto" },
  previewTitle:      { fontSize:14, fontWeight:700, color:"#111827", marginBottom:14 },
  previewEmpty:      { fontSize:13, color:"#9ca3af", textAlign:"center", padding:"32px 0" },
  previewGrid:       { display:"flex", flexWrap:"wrap", gap:12 },
  moreLabels:        { fontSize:13, color:"#6b7280", padding:"12px 0", width:"100%", textAlign:"center" },
  empty:             { textAlign:"center", padding:32, color:"#9ca3af", fontSize:14 },
  printGrid:         { display:"flex", flexWrap:"wrap", gap:8, padding:8 },
};
