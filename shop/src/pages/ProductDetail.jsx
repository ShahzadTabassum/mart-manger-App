import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getShopProduct } from "../api/shop";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty,     setQty]     = useState(1);
  const [added,   setAdded]   = useState(false);
  const { addToCart, cart } = useCart();

  useEffect(() => {
    getShopProduct(id).then(r => setProduct(r.data)).catch(()=>{}).finally(() => setLoading(false));
  }, [id]);

  const inCart = cart.find(i => i.id === parseInt(id));

  const handleAdd = () => {
    if (!product?.in_stock) return;
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div style={s.loading}>Loading product…</div>;
  if (!product) return <div style={s.loading}>Product not found. <Link to="/shop">← Back to shop</Link></div>;

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <Link to="/shop" style={s.back}>← Back to shop</Link>
        <div style={s.layout}>
          {/* Image */}
          <div style={s.imgCol}>
            <div style={s.imgBox}>
              <span style={s.imgIcon}>{product.category?.icon || "👗"}</span>
            </div>
            {!product.in_stock && <div style={s.outTag}>Out of Stock</div>}
          </div>

          {/* Info */}
          <div style={s.infoCol}>
            <div style={s.category}>{product.category?.icon} {product.category?.name}</div>
            <h1 style={s.name}>{product.name}</h1>
            <div style={s.sku}>SKU: {product.sku}</div>
            <div style={s.price}>SGD {product.price.toFixed(2)}</div>

            {product.description && <p style={s.desc}>{product.description}</p>}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div style={s.variants}>
                <div style={s.varTitle}>Available Options</div>
                <div style={s.varGrid}>
                  {product.variants.map((v, i) => (
                    <div key={i} style={s.varTag}>
                      {[v.size, v.color, v.age_group].filter(Boolean).join(" · ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div style={{ ...s.stockTag, color: product.in_stock ? "#16a34a" : "#dc2626" }}>
              {product.in_stock ? `✅ In Stock (${product.stock_qty} available)` : "❌ Out of Stock"}
            </div>

            {/* Quantity + Add to Cart */}
            {product.in_stock && (
              <div style={s.addRow}>
                <div style={s.qtyWrap}>
                  <button style={s.qtyBtn} onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                  <span style={s.qty}>{qty}</span>
                  <button style={s.qtyBtn} onClick={() => setQty(q => Math.min(q+1, product.stock_qty))}>+</button>
                </div>
                <button style={{...s.addBtn, ...(added?{background:"#16a34a"}:{})}} onClick={handleAdd}>
                  {added ? "✓ Added to Cart!" : inCart ? "Add More" : "Add to Cart"}
                </button>
              </div>
            )}

            {inCart && (
              <Link to="/cart" style={s.viewCartLink}>View Cart ({inCart.quantity} in cart) →</Link>
            )}

            {/* Features */}
            <div style={s.features}>
              {[["🚚","Free delivery on orders above SGD 50"],["🔄","Easy returns — no time limit"],["🎁","Earn loyalty points on every purchase"]].map(([icon,text],i)=>(
                <div key={i} style={s.feature}><span>{icon}</span><span style={s.featureText}>{text}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { padding:"24px 20px", minHeight:"calc(100vh - 64px)" },
  inner:     { maxWidth:1000, margin:"0 auto" },
  back:      { display:"inline-block", fontSize:14, color:"#4f46e5", textDecoration:"none", marginBottom:20, fontWeight:500 },
  loading:   { textAlign:"center", padding:80, color:"#9ca3af", fontSize:14 },
  layout:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"start" },
  imgCol:    {},
  imgBox:    { background:"linear-gradient(135deg,#f5f3ff,#eef2ff)", borderRadius:16, height:350, display:"flex", alignItems:"center", justifyContent:"center" },
  imgIcon:   { fontSize:100 },
  outTag:    { background:"#dc2626", color:"#fff", fontSize:13, fontWeight:700, padding:"6px 16px", borderRadius:9, textAlign:"center", marginTop:12 },
  infoCol:   {},
  category:  { fontSize:13, color:"#6b7280", marginBottom:8, textTransform:"uppercase", letterSpacing:".05em" },
  name:      { fontSize:28, fontWeight:800, color:"#111827", marginBottom:8, lineHeight:1.2 },
  sku:       { fontSize:12, color:"#9ca3af", marginBottom:16 },
  price:     { fontSize:32, fontWeight:800, color:"#4f46e5", marginBottom:16 },
  desc:      { fontSize:14, color:"#6b7280", lineHeight:1.6, marginBottom:16 },
  variants:  { marginBottom:16 },
  varTitle:  { fontSize:13, fontWeight:600, color:"#374151", marginBottom:8 },
  varGrid:   { display:"flex", flexWrap:"wrap", gap:8 },
  varTag:    { background:"#f3f4f6", borderRadius:7, padding:"5px 12px", fontSize:12, color:"#374151" },
  stockTag:  { fontSize:14, fontWeight:600, marginBottom:20 },
  addRow:    { display:"flex", gap:12, alignItems:"center", marginBottom:14 },
  qtyWrap:   { display:"flex", alignItems:"center", gap:10, border:"1px solid #e5e7eb", borderRadius:9, padding:"4px 8px" },
  qtyBtn:    { width:30, height:30, border:"none", background:"none", fontSize:20, cursor:"pointer", color:"#374151" },
  qty:       { fontSize:16, fontWeight:700, minWidth:28, textAlign:"center" },
  addBtn:    { flex:1, padding:"13px 24px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, fontSize:15, fontWeight:700, cursor:"pointer", transition:"background .2s" },
  viewCartLink:{ display:"block", fontSize:13, color:"#4f46e5", fontWeight:600, textDecoration:"none", marginBottom:20 },
  features:  { display:"flex", flexDirection:"column", gap:10, marginTop:20, padding:16, background:"#f9fafb", borderRadius:10 },
  feature:   { display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#374151" },
  featureText:{ },
};
