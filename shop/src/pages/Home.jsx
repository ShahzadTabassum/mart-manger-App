import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeaturedProducts, getShopCategories } from "../api/shop";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [featured,   setFeatured]   = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getFeaturedProducts().then(r => setFeatured(r.data)).catch(()=>{});
    getShopCategories().then(r => setCategories(r.data)).catch(()=>{});
  }, []);

  return (
    <div>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroTag}>Kids & Baby Fashion</div>
          <h1 style={s.heroTitle}>Dress Your Little Ones<br/>in Style</h1>
          <p style={s.heroSub}>Garments, shoes & accessories for babies and kids — all in one place</p>
          <div style={s.heroBtns}>
            <Link to="/shop" style={s.heroBtn}>Shop Now →</Link>
            <Link to="/shop?category=featured" style={s.heroBtn2}>View Featured</Link>
          </div>
        </div>
        <div style={s.heroEmoji}>👗👟🎀</div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionInner}>
            <h2 style={s.sectionTitle}>Shop by Category</h2>
            <div style={s.catGrid}>
              {categories.slice(0, 6).map(cat => (
                <Link key={cat.id} to={`/shop?category=${cat.id}`} style={s.catCard}>
                  <div style={s.catIcon}>{cat.icon || "🏷️"}</div>
                  <div style={s.catName}>{cat.name}</div>
                  <div style={s.catCount}>{cat.product_count} items</div>
                </Link>
              ))}
            </div>
            <div style={{textAlign:"center", marginTop:20}}>
              <Link to="/shop" style={s.viewAll}>View all categories →</Link>
            </div>
          </div>
        </div>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <div style={{...s.section, background:"#f9fafb"}}>
          <div style={s.sectionInner}>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>⭐ Featured Products</h2>
              <Link to="/shop" style={s.viewAll}>View all →</Link>
            </div>
            <div style={s.productGrid}>
              {featured.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div style={s.section}>
        <div style={s.sectionInner}>
          <div style={s.featureGrid}>
            {[
              { icon:"🚚", title:"Free Delivery", desc:"On orders above SGD 50" },
              { icon:"🔄", title:"Easy Returns", desc:"No time limit on returns" },
              { icon:"💳", title:"Secure Payment", desc:"Online or cash on delivery" },
              { icon:"🎁", title:"Loyalty Points", desc:"Earn points on every purchase" },
            ].map((f,i) => (
              <div key={i} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <div style={s.featureTitle}>{f.title}</div>
                <div style={s.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Track order banner */}
      <div style={s.trackBanner}>
        <div style={s.sectionInner}>
          <div style={s.trackInner}>
            <div>
              <div style={s.trackTitle}>📦 Track Your Order</div>
              <div style={s.trackDesc}>Enter your order number to check delivery status</div>
            </div>
            <Link to="/track" style={s.trackBtn}>Track Now →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  hero:         { background:"linear-gradient(135deg,#4f46e5,#7c3aed)", padding:"60px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:20 },
  heroInner:    { maxWidth:600, margin:"0 auto", flex:1 },
  heroTag:      { display:"inline-block", background:"rgba(255,255,255,.2)", color:"#e0e7ff", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20, marginBottom:14, letterSpacing:".05em" },
  heroTitle:    { fontSize:40, fontWeight:800, color:"#fff", lineHeight:1.2, marginBottom:14 },
  heroSub:      { fontSize:16, color:"#c7d2fe", marginBottom:28, lineHeight:1.6 },
  heroBtns:     { display:"flex", gap:12, flexWrap:"wrap" },
  heroBtn:      { padding:"13px 28px", background:"#fff", color:"#4f46e5", borderRadius:10, fontSize:15, fontWeight:700, textDecoration:"none" },
  heroBtn2:     { padding:"13px 28px", background:"rgba(255,255,255,.15)", color:"#fff", borderRadius:10, fontSize:15, fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,.3)" },
  heroEmoji:    { fontSize:80, lineHeight:1, textAlign:"center", flexShrink:0 },
  section:      { padding:"48px 20px" },
  sectionInner: { maxWidth:1200, margin:"0 auto" },
  sectionHeader:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 },
  sectionTitle: { fontSize:24, fontWeight:700, color:"#111827", marginBottom:24 },
  viewAll:      { fontSize:14, color:"#4f46e5", textDecoration:"none", fontWeight:600 },
  catGrid:      { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14 },
  catCard:      { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:"20px 14px", textAlign:"center", textDecoration:"none", transition:"all .2s" },
  catIcon:      { fontSize:36, marginBottom:10 },
  catName:      { fontSize:14, fontWeight:600, color:"#111827", marginBottom:4 },
  catCount:     { fontSize:12, color:"#9ca3af" },
  productGrid:  { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 },
  featureGrid:  { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 },
  featureCard:  { background:"#f9fafb", borderRadius:12, padding:20, textAlign:"center" },
  featureIcon:  { fontSize:36, marginBottom:10 },
  featureTitle: { fontSize:15, fontWeight:700, color:"#111827", marginBottom:6 },
  featureDesc:  { fontSize:13, color:"#6b7280" },
  trackBanner:  { background:"#1e1b4b", padding:"32px 20px" },
  trackInner:   { display:"flex", justifyContent:"space-between", alignItems:"center", gap:20, flexWrap:"wrap" },
  trackTitle:   { fontSize:20, fontWeight:700, color:"#fff", marginBottom:6 },
  trackDesc:    { fontSize:14, color:"#a5b4fc" },
  trackBtn:     { padding:"12px 24px", background:"#4f46e5", color:"#fff", borderRadius:9, fontSize:14, fontWeight:600, textDecoration:"none", flexShrink:0 },
};
