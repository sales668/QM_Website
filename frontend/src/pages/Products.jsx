import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, MagnifyingGlass } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { CATEGORIES, ALL_GRADES } from "../lib/staticData";

export default function Products() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeGrade, setActiveGrade] = useState("");

  const activeCat = useMemo(
    () => CATEGORIES.find((c) => c.slug === categorySlug) || null,
    [categorySlug]
  );

  useEffect(() => {
    setLoading(true);
    const params = categorySlug ? { category: categorySlug } : {};
    api.get("/products", { params })
      .then((r) => setProducts(r.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug]);

  const filtered = useMemo(() => {
    let list = products;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        [p.name, p.subtype, p.grade, p.category, p.sizes, ...(p.standards || []), ...(p.grades || []), ...(p.forms || [])]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (activeGrade) {
      const g = activeGrade.toLowerCase();
      list = list.filter((p) =>
        (p.grades || []).join(" ").toLowerCase().includes(g)
      );
    }
    return list;
  }, [products, search, activeGrade]);

  return (
    <div data-testid="products-page" className="bg-white">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// PRODUCT CATALOG / V2</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            {activeCat ? activeCat.name : "All Products"}
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            {activeCat
              ? `${activeCat.desc}. Available across the full grade spectrum — Carbon, Stainless, Duplex, High-Nickel, Titanium. Send a BOM for project pricing.`
              : "Pipes, fittings, flanges, forgings, bars, sections, fasteners, valves and pre-fab spools — across CS, SS, Duplex, Super Duplex, Inconel, Monel, Titanium and more."}
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-10 grid lg:grid-cols-12 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-3 lg:border-r lg:border-gray-200 lg:pr-8">
            <div className="qm-tick mb-4">Filter / Product Type</div>
            <ul className="space-y-1" data-testid="category-sidebar">
              <li>
                <Link
                  to="/products"
                  data-testid="cat-link-all"
                  className={`flex justify-between px-3 py-2 text-sm uppercase tracking-wider font-medium ${
                    !categorySlug ? "bg-[#002FA7] text-white" : "text-[#0B1120] hover:bg-gray-100"
                  }`}
                >
                  <span>All Products</span>
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/products/${c.slug}`}
                    data-testid={`cat-link-${c.slug}`}
                    className={`flex justify-between px-3 py-2 text-sm uppercase tracking-wider font-medium ${
                      categorySlug === c.slug ? "bg-[#002FA7] text-white" : "text-[#0B1120] hover:bg-gray-100"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="font-mono-spec text-[10px] opacity-70">{c.code}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="qm-tick mt-10 mb-3">Filter / Grade</div>
            <select
              value={activeGrade}
              onChange={(e) => setActiveGrade(e.target.value)}
              data-testid="grade-filter"
              className="w-full border border-gray-300 bg-white px-3 py-2 text-sm rounded-none focus:outline-none focus:ring-2 focus:ring-[#002FA7]"
            >
              <option value="">All grades</option>
              {ALL_GRADES.map((g) => (
                <option key={g} value={g.split(" ")[0] === "Stainless" ? g.split("(")[1]?.replace(")", "") || g : g.split(" ")[0]}>
                  {g}
                </option>
              ))}
            </select>

            <div className="mt-10 border border-gray-200 p-5 bg-[#FAFAFA]">
              <div className="qm-tick mb-2">Need a custom item?</div>
              <p className="text-sm text-gray-600 mb-4">Forgings, spools, special grades — send your drawing.</p>
              <Link to="/request-quote" className="inline-flex items-center gap-2 bg-[#002FA7] hover:bg-[#00247D] text-white px-4 py-3 text-xs uppercase tracking-widest font-semibold">
                Request Quote <ArrowUpRight size={14} weight="bold" />
              </Link>
            </div>
          </aside>

          {/* Cards grid */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 w-full max-w-md">
                <MagnifyingGlass size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product, subtype, grade, standard, size…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent border-0 outline-none text-sm"
                  data-testid="product-search-input"
                />
              </div>
              <div className="font-mono-spec text-xs text-gray-500">{filtered.length} items</div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-500 font-mono-spec text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-500 font-mono-spec text-sm" data-testid="no-products-message">
                No matching products. Try a different search or send a BOM directly.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="products-grid">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ product }) {
  const grades = product.grades || [];
  const standards = product.standards || [];
  const imgSrc = product.image_url
    ? (product.image_url.startsWith("/api/") ? `${process.env.REACT_APP_BACKEND_URL}${product.image_url}` : product.image_url)
    : "";
  return (
    <div
      className="group flex flex-col bg-white border border-gray-200 hover:border-[#002FA7] transition-colors"
      data-testid={`product-card-${product.id}`}
    >
      <div className="aspect-[4/3] bg-[#0B1120] overflow-hidden relative">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-500 font-mono-spec text-xs">No image</div>
        )}
        {product.subtype && (
          <span className="absolute top-3 left-3 bg-white text-[#0B1120] font-mono-spec text-[10px] uppercase tracking-widest px-2 py-1">
            {product.subtype}
          </span>
        )}
        {product.featured && (
          <span className="absolute top-3 right-3 bg-[#FF3B30] text-white font-mono-spec text-[10px] uppercase tracking-widest px-2 py-1">
            Featured
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="qm-tick text-gray-400">{product.category}</div>
        <h3 className="font-display text-lg font-bold uppercase tracking-tight mt-1 text-[#0B1120]">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[13px] text-gray-600 leading-relaxed mt-2 line-clamp-2">{product.description}</p>
        )}

        {product.sizes && (
          <div className="mt-3 flex items-baseline gap-2">
            <span className="qm-tick text-gray-400">Sizes</span>
            <span className="font-mono-spec text-[11px] text-[#002FA7]">{product.sizes}</span>
          </div>
        )}

        {standards.length > 0 && (
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="qm-tick text-gray-400">Std</span>
            <span className="font-mono-spec text-[11px] text-gray-600">{standards.join(" · ")}</span>
          </div>
        )}

        {grades.length > 0 && (
          <div className="mt-4">
            <div className="qm-tick text-gray-400 mb-2">Available grades</div>
            <div className="flex flex-wrap gap-1.5">
              {grades.slice(0, 6).map((g) => (
                <span key={g} className="font-mono-spec text-[10px] tracking-wide border border-gray-300 px-2 py-1 text-gray-700">
                  {g}
                </span>
              ))}
              {grades.length > 6 && (
                <span className="font-mono-spec text-[10px] tracking-wide bg-[#0B1120] text-white px-2 py-1">
                  +{grades.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
          <Link
            to={`/request-quote?material=${encodeURIComponent(product.name + (product.subtype ? " — " + product.subtype : ""))}`}
            data-testid={`product-quote-${product.id}`}
            className="text-[#002FA7] font-semibold uppercase tracking-widest text-[11px] hover:underline inline-flex items-center gap-1"
          >
            Request Quote <ArrowUpRight size={12} weight="bold" />
          </Link>
          <span className="font-mono-spec text-[10px] text-gray-400 uppercase tracking-widest">
            {product.grade}
          </span>
        </div>
      </div>
    </div>
  );
}
