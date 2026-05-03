import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, MagnifyingGlass } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/staticData";

export default function Products() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.grade, p.category, ...(p.standards || []), ...(p.forms || [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, search]);

  return (
    <div data-testid="products-page" className="bg-white">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// PRODUCT CATALOG / V1</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            {activeCat ? activeCat.name : "All Materials"}
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            {activeCat
              ? `${activeCat.name} — grades, forms, applicable standards, and typical applications. Send us your BOM for a project-specific quotation.`
              : "Carbon, Mild, Stainless, Duplex, High-Nickel and Titanium families — engineered to spec, traceable to the heat number."}
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-10 grid lg:grid-cols-12 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-3 lg:border-r lg:border-gray-200 lg:pr-8">
            <div className="qm-tick mb-4">Filters / Categories</div>
            <ul className="space-y-1" data-testid="category-sidebar">
              <li>
                <Link
                  to="/products"
                  data-testid="cat-link-all"
                  className={`block px-3 py-2 text-sm uppercase tracking-wider font-medium ${
                    !categorySlug ? "bg-[#002FA7] text-white" : "text-[#0B1120] hover:bg-gray-100"
                  }`}
                >
                  All Materials
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

            <div className="mt-10 border border-gray-200 p-5 bg-[#FAFAFA]">
              <div className="qm-tick mb-2">Need a custom grade?</div>
              <p className="text-sm text-gray-600 mb-4">Send us a BOM, drawing, or material list — we'll source it.</p>
              <Link to="/request-quote" className="inline-flex items-center gap-2 bg-[#002FA7] hover:bg-[#00247D] text-white px-4 py-3 text-xs uppercase tracking-widest font-semibold">
                Request Quote <ArrowUpRight size={14} weight="bold" />
              </Link>
            </div>
          </aside>

          {/* Table */}
          <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-2 w-full max-w-md">
                <MagnifyingGlass size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by grade, name, standard…"
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
              <div className="border border-gray-200 bg-white overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="products-table">
                  <thead className="bg-[#0B1120] text-white font-mono-spec text-[11px] uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-4">Grade / Name</th>
                      <th className="px-5 py-4 hidden md:table-cell">Category</th>
                      <th className="px-5 py-4 hidden lg:table-cell">Forms</th>
                      <th className="px-5 py-4 hidden lg:table-cell">Standards</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="qm-spec-row hover:bg-gray-50" data-testid={`product-row-${p.id}`}>
                        <td className="px-5 py-5">
                          <div className="font-display text-base font-bold text-[#0B1120]">{p.name}</div>
                          <div className="font-mono-spec text-[11px] text-[#002FA7] mt-1">{p.grade}</div>
                          <div className="text-[12px] text-gray-500 mt-1 max-w-md">{p.description}</div>
                        </td>
                        <td className="px-5 py-5 hidden md:table-cell text-gray-700">{p.category}</td>
                        <td className="px-5 py-5 hidden lg:table-cell text-gray-600 text-[12px]">
                          {(p.forms || []).join(", ")}
                        </td>
                        <td className="px-5 py-5 hidden lg:table-cell font-mono-spec text-[11px] text-gray-500">
                          {(p.standards || []).join(" · ")}
                        </td>
                        <td className="px-5 py-5 text-right">
                          <Link
                            to={`/request-quote?material=${encodeURIComponent(p.name)}`}
                            data-testid={`product-quote-${p.id}`}
                            className="inline-flex items-center gap-1 text-[#002FA7] font-semibold uppercase tracking-widest text-[11px] hover:underline"
                          >
                            Quote → 
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
