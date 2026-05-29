import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const { addToCart, cart } = useCart();
  const inCart = cart.find(i => i.id === product.id);

  return (
    <div style={s.card}>
      {/* Product image placeholder */}
      <Link to={`/product/${product.id}`} style={s.imgWrap}>
        <div style={s.imgPlaceholder}>
          <span style={s.imgIcon}>{product.category?.icon || "👗"}</span>
        </div>
        {!product.in_stock && <div style={s.outBadge}>Out of Stock</div>}
        {product.featured && product.in_stock && <div style={s.featBadge}>⭐ Featured</div>}
      </Link>

      <div style={s.info}>
        <div style={s.category}>{product.category?.name}</div>
        <Link to={`/product/${product.id}`} style={s.name}>{product.name}</Link>
        <div style={s.bottom}>
          <div style={s.price}>SGD {product.price.toFixed(2)}</div>
          <button
            style={{ ...s.addBtn, ...((!product.in_stock || inCart) ? s.addBtnDisabled : {}) }}
            onClick={() => product.in_stock && !inCart && addToCart(product)}
            disabled={!product.in_stock || !!inCart}
          >
            {inCart ? "✓ In Cart" : product.in_stock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  card:        { background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", overflow:"hidden", transition:"box-shadow .2s", display:"flex", flexDirection:"column" },
  imgWrap:     { position:"relative", textDecoration:"none", display:"block" },
  imgPlaceholder:{ height:180, background:"linear-gradient(135deg,#f5f3ff,#eef2ff)", display:"flex", alignItems:"center", justifyContent:"center" },
  imgIcon:     { fontSize:60 },
  outBadge:    { position:"absolute", top:10, left:10, background:"#dc2626", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20 },
  featBadge:   { position:"absolute", top:10, left:10, background:"#f59e0b", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20 },
  info:        { padding:"14px 16px", display:"flex", flexDirection:"column", gap:6, flex:1 },
  category:    { fontSize:11, color:"#9ca3af", textTransform:"uppercase", letterSpacing:".05em" },
  name:        { fontSize:14, fontWeight:600, color:"#111827", textDecoration:"none", lineHeight:1.4 },
  bottom:      { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6 },
  price:       { fontSize:16, fontWeight:700, color:"#4f46e5" },
  addBtn:      { padding:"7px 14px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer" },
  addBtnDisabled:{ background:"#e5e7eb", color:"#9ca3af", cursor:"not-allowed" },
};
