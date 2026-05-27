import { useEffect, useState, useRef } from "react";
import { getProducts } from "../api/products";
import BarcodeLabel from "../components/BarcodeLabel";

const LABEL_SIZES = {
  small:  { label:"50mm × 30mm", w:"50mm",  h:"30mm",  desc:"Baby shoes, accessories, small items" },
  medium: { label:"100mm × 50mm", w:"100mm", h:"50mm",  desc:"Garments, jackets, larger items" },
};

export default function Barcodes() {
  const [products,   setProducts]   = useState([]);
  const [selected,   setSelected]   = useState({});   // { id: { copies, size } }
  const [search,     setSearch]     = useState("");
  const [showPrice,  setShowPrice]  = useState(true);
  const [loading,    setLoading]    = useState(true);
  const [defaultSize,setDefaultSize]= useState("small");
  const [printMode,  setPrintMode]  = useState("usb");    // "usb" | "pdf"
  const printRef = useRef();

  useEffect(() => {
    getProducts().then(r => { setProducts(r.data); setLoading(false); });
  }, []);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => {
    setSelected(prev => {
      if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: { copies: 1, size: defaultSize } };
    });
  };

  const setCopies = (id, val) => {
    const n = Math.max(1, Math.min(50, parseInt(val) || 1));
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], copies: n } }));
  };

  const setSize = (id, size) => {
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], size } }));
  };

  const selectAll = (size) => {
    const all = {};
    filtered.forEach(p => { all[p.id] = { copies: 1, size: size || defaultSize }; });
    setSelected(all);
  };

  const clearAll = () => setSelected({});

  // Build print list
  const printList = [];
  products.forEach(p => {
    const sel = selected[p.id];
    if (sel) {
      for (let i = 0; i < sel.copies; i++) {
        printList.push({ ...p, labelSize: sel.size });
      }
    }
  });

  const totalLabels   = printList.length;
  const selectedCount = Object.keys(selected).length;
  const smallCount    = printList.filter(p => p.labelSize === "small").length;
  const mediumCount   = printList.filter(p => p.labelSize === "medium").length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={s.page}>

      {/* ── SCREEN VIEW ── */}
      <div className="no-print">
        <div style={s.topbar}>
          <div>
            <h1 style={s.h1}>🏷️ Barcode Generator</h1>
            <p style={s.sub}>Select products → choose label size → print on thermal printer</p>
          </div>
          <button
            style={{ ...s.printBtn, ...(totalLabels === 0 ? s.printBtnDisabled : {}) }}
            onClick={handlePrint}
            disabled={totalLabels === 0}
          >
            🖨️ Print {totalLabels > 0 ? `${totalLabels} label${totalLabels > 1 ? "s" : ""}` : ""}
          </button>
        </div>

        {/* Settings bar */}
        <div style={s.settingsBar}>
          <div style={s.settingGroup}>
            <span style={s.settingLabel}>Default size:</span>
            {Object.entries(LABEL_SIZES).map(([key, sz]) => (
              <button key={key} style={{ ...s.sizeBtn, ...(defaultSize === key ? s.sizeBtnActive : {}) }}
                onClick={() => setDefaultSize(key)}>
                {sz.label}
              </button>
            ))}
          </div>
          <div style={s.settingGroup}>
            <span style={s.settingLabel}>Connection:</span>
            <button style={{ ...s.connBtn, ...(printMode === "usb" ? s.connBtnActive : {}) }}
              onClick={() => setPrintMode("usb")}>🔌 USB</button>
            <button style={{ ...s.connBtn, ...(printMode === "bluetooth" ? s.connBtnActive : {}) }}
              onClick={() => setPrintMode("bluetooth")}>📱 Bluetooth</button>
          </div>
          <label style={s.toggle}>
            <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} />
            <span> Show price</span>
          </label>
        </div>

        {/* Bluetooth tip */}
        {printMode === "bluetooth" && (
          <div style={s.btTip}>
            📱 <strong>Bluetooth mode:</strong> Click "Print" → In the print dialog, select <strong>"Save as PDF"</strong> →
            Transfer the PDF to your phone → Open on phone → Print via Bluetooth to your thermal printer.
          </div>
        )}

        {/* USB tip */}
        {printMode === "usb" && (
          <div style={s.usbTip}>
            🔌 <strong>USB mode:</strong> Make sure your thermal printer is set as the <strong>default printer</strong> →
            Click "Print" → Select your thermal printer in the dialog → Print.
          </div>
        )}

        {/* Summary */}
        {totalLabels > 0 && (
          <div style={s.summary}>
            <span style={s.summaryItem}>✅ {selectedCount} products selected</span>
            <span style={s.summaryItem}>🏷️ {totalLabels} total labels</span>
            {smallCount > 0  && <span style={s.summaryItem}>📦 {smallCount} × 50×30mm</span>}
            {mediumCount > 0 && <span style={s.summaryItem}>📦 {mediumCount} × 100×50mm</span>}
          </div>
        )}

        <div style={s.layout}>
          {/* Product list */}
          <div style={s.listCol}>
            <div style={s.listHeader}>
              <input style={s.search} placeholder="🔍 Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              <button style={s.selBtn} onClick={() => selectAll()}>Select all</button>
              {selectedCount > 0 && <button style={s.clearBtn} onClick={clearAll}>Clear ({selectedCount})</button>}
            </div>

            {loading && <div style={s.empty}>Loading products…</div>}
            {!loading && filtered.length === 0 && <div style={s.empty}>No products found</div>}

            {filtered.map(p => {
              const sel = selected[p.id];
              const isSelected = !!sel;
              return (
                <div key={p.id} style={{ ...s.productRow, ...(isSelected ? s.productRowSel : {}) }}>
                  <div style={s.productLeft} onClick={() => toggleSelect(p.id)}>
                    <div style={{ ...s.checkbox, ...(isSelected ? s.checkboxOn : {}) }}>
                      {isSelected ? "✓" : ""}
                    </div>
                    <div>
                      <div style={s.pName}>{p.name}</div>
                      <div style={s.pMeta}>
                        <code style={s.sku}>{p.sku}</code>
                        <span> · SGD {parseFloat(p.price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={s.controls}>
                      {/* Size selector */}
                      <div style={s.sizeSel}>
                        {Object.entries(LABEL_SIZES).map(([key, sz]) => (
                          <button key={key}
                            style={{ ...s.sizePill, ...(sel.size === key ? s.sizePillActive : {}) }}
                            onClick={() => setSize(p.id, key)}
                            title={sz.desc}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                      {/* Copies */}
                      <div style={s.copiesWrap}>
                        <span style={s.copiesLabel}>Copies:</span>
                        <button style={s.qtyBtn} onClick={() => setCopies(p.id, sel.copies - 1)}>−</button>
                        <input style={s.copiesInput} type="number" min="1" max="50"
                          value={sel.copies} onChange={e => setCopies(p.id, e.target.value)} />
                        <button style={s.qtyBtn} onClick={() => setCopies(p.id, sel.copies + 1)}>+</button>
                      </div>
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
              ? <div style={s.previewEmpty}>Select products to preview barcodes</div>
              : (
                <div style={s.previewGrid}>
                  {printList.slice(0, 4).map((p, i) => (
                    <div key={i}>
                      <div style={s.sizeTag}>{LABEL_SIZES[p.labelSize]?.label}</div>
                      <BarcodeLabel
                        sku={p.sku} name={p.name} price={p.price}
                        showPrice={showPrice} size={p.labelSize}
                      />
                    </div>
                  ))}
                  {totalLabels > 4 && (
                    <div style={s.moreLabels}>+{totalLabels - 4} more labels will print</div>
                  )}
                </div>
              )
            }
          </div>
        </div>
      </div>

      {/* ── PRINT VIEW ── */}
      <div className="print-only">
        {/* Group by size for proper printing */}
        {["small","medium"].map(size => {
          const sizeLabels = printList.filter(p => p.labelSize === size);
          if (!sizeLabels.length) return null;
          return (
            <div key={size} style={{ pageBreakAfter:"always" }}>
              <div style={{ ...s.printGrid,
                ...(size === "small"  ? s.printGridSmall  : {}),
                ...(size === "medium" ? s.printGridMedium : {}),
              }}>
                {sizeLabels.map((p, i) => (
                  <BarcodeLabel key={i} sku={p.sku} name={p.name} price={p.price}
                    showPrice={showPrice} size={size} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          .no-print  { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; margin: 0; padding: 0; }
          @page { margin: 3mm; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  page:           { padding:24, maxWidth:1200, margin:"0 auto" },
  topbar:         { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:12 },
  h1:             { fontSize:22, fontWeight:700, color:"#111827", marginBottom:4 },
  sub:            { fontSize:13, color:"#9ca3af" },
  printBtn:       { padding:"10px 20px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer" },
  printBtnDisabled:{ background:"#c7d2fe", cursor:"not-allowed" },
  settingsBar:    { display:"flex", gap:16, alignItems:"center", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 16px", marginBottom:12, flexWrap:"wrap" },
  settingGroup:   { display:"flex", alignItems:"center", gap:8 },
  settingLabel:   { fontSize:12, color:"#6b7280", fontWeight:600, whiteSpace:"nowrap" },
  sizeBtn:        { padding:"5px 12px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff", color:"#6b7280" },
  sizeBtnActive:  { background:"#4f46e5", color:"#fff", borderColor:"#4f46e5", fontWeight:600 },
  connBtn:        { padding:"5px 12px", border:"1px solid #e5e7eb", borderRadius:7, fontSize:12, cursor:"pointer", background:"#fff", color:"#6b7280" },
  connBtnActive:  { background:"#0ea5e9", color:"#fff", borderColor:"#0ea5e9", fontWeight:600 },
  toggle:         { display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#374151", cursor:"pointer" },
  btTip:          { background:"#eff6ff", border:"1px solid #93c5fd", borderRadius:9, padding:"10px 16px", fontSize:13, color:"#1d4ed8", marginBottom:12 },
  usbTip:         { background:"#f0fdf4", border:"1px solid #86efac", borderRadius:9, padding:"10px 16px", fontSize:13, color:"#166534", marginBottom:12 },
  summary:        { display:"flex", gap:16, background:"#f5f3ff", border:"1px solid #ddd6fe", borderRadius:9, padding:"10px 16px", marginBottom:14, flexWrap:"wrap" },
  summaryItem:    { fontSize:13, color:"#5b21b6", fontWeight:600 },
  layout:         { display:"grid", gridTemplateColumns:"1fr 340px", gap:20 },
  listCol:        { display:"flex", flexDirection:"column", gap:8 },
  listHeader:     { display:"flex", gap:8, marginBottom:4, flexWrap:"wrap" },
  search:         { flex:1, minWidth:180, padding:"9px 14px", border:"1px solid #d1d5db", borderRadius:9, fontSize:13, outline:"none" },
  selBtn:         { padding:"8px 14px", border:"1px solid #d1d5db", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fff" },
  clearBtn:       { padding:"8px 14px", border:"1px solid #fca5a5", borderRadius:8, fontSize:13, cursor:"pointer", background:"#fef2f2", color:"#dc2626" },
  productRow:     { display:"flex", alignItems:"center", justifyContent:"space-between", background:"#fff", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 16px", transition:"border .15s", gap:12, flexWrap:"wrap" },
  productRowSel:  { borderColor:"#4f46e5", background:"#f5f3ff" },
  productLeft:    { display:"flex", alignItems:"center", gap:12, cursor:"pointer", flex:1, minWidth:200 },
  checkbox:       { width:22, height:22, border:"2px solid #d1d5db", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0, color:"#fff" },
  checkboxOn:     { background:"#4f46e5", borderColor:"#4f46e5" },
  pName:          { fontSize:14, fontWeight:600, color:"#111827" },
  pMeta:          { fontSize:12, color:"#6b7280", marginTop:2 },
  sku:            { background:"#f3f4f6", padding:"1px 6px", borderRadius:4, fontSize:11 },
  controls:       { display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" },
  sizeSel:        { display:"flex", gap:6 },
  sizePill:       { padding:"4px 10px", border:"1px solid #e5e7eb", borderRadius:20, fontSize:11, cursor:"pointer", background:"#f9fafb", color:"#6b7280" },
  sizePillActive: { background:"#4f46e5", color:"#fff", borderColor:"#4f46e5", fontWeight:600 },
  copiesWrap:     { display:"flex", alignItems:"center", gap:6 },
  copiesLabel:    { fontSize:12, color:"#6b7280" },
  qtyBtn:         { width:26, height:26, border:"1px solid #e5e7eb", borderRadius:6, background:"#f9fafb", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center" },
  copiesInput:    { width:44, textAlign:"center", padding:"4px", border:"1px solid #d1d5db", borderRadius:6, fontSize:13, outline:"none" },
  previewCol:     { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:20, position:"sticky", top:20, maxHeight:"85vh", overflowY:"auto" },
  previewTitle:   { fontSize:14, fontWeight:700, color:"#111827", marginBottom:14 },
  previewEmpty:   { fontSize:13, color:"#9ca3af", textAlign:"center", padding:"32px 0" },
  previewGrid:    { display:"flex", flexDirection:"column", gap:14 },
  sizeTag:        { fontSize:10, color:"#9ca3af", marginBottom:4, textTransform:"uppercase", letterSpacing:".05em" },
  moreLabels:     { fontSize:13, color:"#6b7280", textAlign:"center", padding:"12px 0" },
  empty:          { textAlign:"center", padding:32, color:"#9ca3af", fontSize:14 },
  printGrid:      { display:"flex", flexWrap:"wrap", gap:"3mm", padding:"3mm" },
  printGridSmall: { gap:"2mm" },
  printGridMedium:{ gap:"3mm" },
};
