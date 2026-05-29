import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getShopProducts, getShopCategories } from "../api/shop";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get("category");
  const search     = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    getShopCategories().then(r => setCategories(r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (categoryId && categoryId !== "featured") params.category_id = categoryId;
    if (categoryId === "featured") params.featured = true;
    if (search) params.search = search;
    getShopProducts(params)
      .then(r => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [categoryId, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set("search", searchInput); return p; });
  };

  const setCategory = (id) => {
    setSearchParams(id ? { category: id } : {});
  };

  const selectedCat = categories.find(c => String(c.id) === categoryId);

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>{selectedCat ? `${selectedCat.icon} ${selectedCat.name}` : "🛍️ All Products"}</h1>
            <p style={s.sub}>{products.length} products found</p>
          </div>
          <form onSubmit={handleSearch} style={s.searchForm}>
            <input style={s.search} placeholder="Search products…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
            <button type="submit" style={s.searchBtn}>🔍</button>
          </form>
        </div>

        <div style={s.layout}>
          {/* Sidebar filters */}
          <div style={s.sidebar}>
            <div style={s.filterTitle}>Categories</div>
            <button style={{...s.catItem,...(!categoryId?s.catItemActive:{})}} onClick={() => setCategory("")}>
              🏷️ All Products
            </button>
            {categories.map(cat => (
              <button key={cat.id}
                style={{...s.catItem,...(String(cat.id)===categoryId?s.catItemActive:{})}}
                onClick={() => setCategory(String(cat.id))}>
                {cat.icon} {cat.name}
                <span style={s.catCount}>{cat.product_count}</span>
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div style={s.main}>
            {loading ? (
              <div style={s.loading}>Loading products…</div>
            ) : products.length === 0 ? (
              <div style={s.empty}>
                <div style={{fontSize:48, marginBottom:12}}>🔍</div>
                <div style={{fontSize:16, fontWeight:600, color:"#374151"}}>No products found</div>
                <div style={{fontSize:14, color:"#9ca3af", marginTop:4}}>Try a different category or search term</div>
              </div>
            ) : (
              <div style={s.grid}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { padding:"24px 20px", minHeight:"calc(100vh - 64px)" },
  inner:        { maxWidth:1200, margin:"0 auto" },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 },
  title:        { fontSize:24, fontWeight:700, color:"#111827", marginBottom:4 },
  sub:          { fontSize:13, color:"#9ca3af" },
  searchForm:   { display:"flex", gap:8 },
  search:       { padding:"10px 16px", border:"1px solid #d1d5db", borderRadius:9, fontSize:14, outline:"none", width:240 },
  searchBtn:    { padding:"10px 14px", background:"#4f46e5", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", fontSize:16 },
  layout:       { display:"grid", gridTemplateColumns:"200px 1fr", gap:24 },
  sidebar:      { background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16, height:"fit-content", position:"sticky", top:80 },
  filterTitle:  { fontSize:12, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:".06em", marginBottom:12 },
  catItem:      { display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%", padding:"9px 12px", border:"none", borderRadius:8, background:"none", fontSize:13, cursor:"pointer", color:"#374151", textAlign:"left", marginBottom:4 },
  catItemActive:{ background:"#eef2ff", color:"#4f46e5", fontWeight:600 },
  catCount:     { background:"#f3f4f6", borderRadius:20, padding:"1px 7px", fontSize:11, color:"#6b7280" },
  main:         {},
  grid:         { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 },
  loading:      { textAlign:"center", padding:60, color:"#9ca3af", fontSize:14 },
  empty:        { textAlign:"center", padding:60 },
};
