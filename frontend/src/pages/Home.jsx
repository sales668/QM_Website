import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CheckCircle, Certificate, Microscope, Truck, Compass } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { CATEGORIES, INDUSTRIES, STANDARDS } from "../lib/staticData";

const PIPES_IMG =
  "https://images.pexels.com/photos/19730402/pexels-photo-19730402.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1300";
const HERO_IMG = PIPES_IMG;
const RIG_IMG =
  "https://images.unsplash.com/photo-1727461553668-45322401f863?crop=entropy&cs=srgb&fm=jpg&w=1300&q=80";
const LAB_IMG =
  "https://images.unsplash.com/photo-1764737734436-7eb904d3a4ab?crop=entropy&cs=srgb&fm=jpg&w=1300&q=80";

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { featured: true } })
      .then((r) => setFeatured(r.data.slice(0, 6)))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 qm-rise">
              <div className="qm-tick mb-6">// QM-001 / NEW ZEALAND / EST 2024</div>
              <h1
                className="font-display font-black uppercase tracking-tighter leading-[0.85] text-[#0B1120]"
                style={{ fontSize: "clamp(40px, 7.2vw, 116px)" }}
              >
                Engineers don't<br />
                like surprises.<br />
                <span className="text-[#002FA7]">Neither do we.</span>
              </h1>
              <p className="mt-8 text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
                A one-stop industrial steel & alloy supplier — Carbon, Stainless, Duplex,
                High-Nickel and Titanium — sourced from approved manufacturers, delivered
                with full traceability. New Zealand based, globally sourced.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  to="/request-quote"
                  data-testid="hero-cta-quote"
                  className="inline-flex items-center gap-2 bg-[#002FA7] hover:bg-[#00247D] text-white px-7 py-4 text-sm font-semibold uppercase tracking-widest transition-colors"
                >
                  Send your BOM <ArrowUpRight size={18} weight="bold" />
                </Link>
                <Link
                  to="/products"
                  data-testid="hero-cta-products"
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-[#0B1120] hover:bg-gray-50 px-7 py-4 text-sm font-semibold uppercase tracking-widest"
                >
                  Browse Catalog <ArrowRight size={18} weight="bold" />
                </Link>
              </div>

              <dl className="mt-16 grid grid-cols-3 max-w-2xl border-t border-gray-200">
                <div className="border-r border-gray-200 py-5">
                  <dt className="qm-tick">Materials</dt>
                  <dd className="font-mono-spec text-sm sm:text-base font-semibold mt-2 text-[#0B1120] leading-snug">CS · SS · DSS<br/>Ni · Ti · Fasteners</dd>
                </div>
                <div className="border-r border-gray-200 py-5 pl-5">
                  <dt className="qm-tick">Standards</dt>
                  <dd className="font-mono-spec text-sm sm:text-base font-semibold mt-2 text-[#0B1120] leading-snug">ASTM · ASME · EN<br/>DIN · AS-NZ · ISO</dd>
                </div>
                <div className="py-5 pl-5">
                  <dt className="qm-tick">Sourcing</dt>
                  <dd className="font-mono-spec text-sm sm:text-base font-semibold mt-2 text-[#0B1120] leading-snug">Worldwide<br/>Approved Mills</dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-5 qm-rise-2">
              <div className="relative">
                <div className="aspect-[4/5] bg-gray-100 overflow-hidden border border-gray-200">
                  <img
                    src={HERO_IMG}
                    alt="Industrial steel surface"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = PIPES_IMG; }}
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white border border-gray-200 px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                  <div className="qm-tick text-gray-500">Spec Reference</div>
                  <div className="font-mono-spec text-sm font-semibold mt-1">EN 10204 3.1 / 3.2</div>
                </div>
                <div className="absolute -top-4 -right-4 bg-[#002FA7] text-white px-5 py-4">
                  <div className="qm-tick text-blue-100">Inspection</div>
                  <div className="font-mono-spec text-sm font-semibold mt-1">SGS · BV · TÜV</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Standards marquee */}
        <div className="border-t border-gray-200 bg-white overflow-hidden">
          <div className="flex qm-marquee whitespace-nowrap py-5">
            {[...STANDARDS, ...STANDARDS, ...STANDARDS].map((s, i) => (
              <div key={i} className="flex items-center gap-12 px-12">
                <span className="font-mono-spec text-sm tracking-widest text-gray-400">{s}</span>
                <span className="text-[#002FA7]">●</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
            <div>
              <div className="qm-tick mb-3">// 02 / MATERIAL CATALOG</div>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight max-w-2xl">
                A spectrum of metals,<br />engineered to spec.
              </h2>
            </div>
            <Link to="/products" className="text-sm font-semibold uppercase tracking-widest text-[#002FA7] hover:underline" data-testid="home-view-all-products">
              View Full Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-l border-t border-gray-200">
            {CATEGORIES.map((c, idx) => (
              <Link
                key={c.slug}
                to={`/products/${c.slug}`}
                data-testid={`home-category-${c.slug}`}
                className="group border-r border-b border-gray-200 p-8 lg:p-10 bg-white hover:bg-[#0B1120] hover:text-white transition-colors duration-300 min-h-[220px] flex flex-col justify-between"
              >
                <div>
                  <div className="qm-tick text-gray-400 group-hover:text-gray-500">CAT-{String(idx + 1).padStart(2, "0")} / {c.code}</div>
                  <div className="font-display text-2xl sm:text-[28px] font-black uppercase tracking-tight mt-3 leading-tight">
                    {c.name}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xs uppercase tracking-widest font-semibold opacity-60 group-hover:opacity-100">Explore →</span>
                  <ArrowUpRight size={22} weight="bold" className="opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED GRADES */}
      {featured.length > 0 && (
        <section className="border-b border-gray-200 bg-[#FAFAFA]">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 lg:py-28">
            <div className="qm-tick mb-3">// 03 / FEATURED GRADES</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight mb-12 max-w-3xl">
              Critical-service alloys<br /> we ship every week.
            </h2>
            <div className="bg-white border border-gray-200 overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="featured-products-table">
                <thead className="bg-[#0B1120] text-white font-mono-spec text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Grade</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 hidden md:table-cell">Forms</th>
                    <th className="px-6 py-4 hidden lg:table-cell">Standards</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {featured.map((p) => (
                    <tr key={p.id} className="qm-spec-row hover:bg-gray-50" data-testid={`featured-row-${p.id}`}>
                      <td className="px-6 py-5">
                        <div className="font-display text-base font-bold text-[#0B1120]">{p.name}</div>
                        <div className="font-mono-spec text-[11px] text-[#002FA7] mt-1">{p.grade}</div>
                      </td>
                      <td className="px-6 py-5 text-gray-700">{p.category}</td>
                      <td className="px-6 py-5 hidden md:table-cell text-gray-600 text-[13px]">{p.forms.slice(0, 3).join(", ")}{p.forms.length > 3 ? ", …" : ""}</td>
                      <td className="px-6 py-5 hidden lg:table-cell font-mono-spec text-[11px] text-gray-500">{p.standards.join(" · ")}</td>
                      <td className="px-6 py-5 text-right">
                        <Link to={`/products/${p.category_slug}`} className="text-[#002FA7] font-semibold uppercase tracking-widest text-[11px] hover:underline">Datasheet →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* INDUSTRIES */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <div className="qm-tick mb-3">// 04 / INDUSTRIES SERVED</div>
              <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight mb-6">
                Built for harsh<br />environments.
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 max-w-md">
                Marine, oil & gas, petrochemical, chemical, food, dairy and structural —
                wherever specification compliance and corrosion resistance can't be optional.
              </p>
              <div className="aspect-[4/3] overflow-hidden border border-gray-200">
                <img src={RIG_IMG} alt="Offshore rig" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 border-l border-t border-gray-200">
                {INDUSTRIES.map((ind) => (
                  <div key={ind.code} className="border-r border-b border-gray-200 p-7 bg-white hover:bg-[#FAFAFA] transition-colors min-h-[180px]">
                    <div className="qm-tick text-gray-400">{ind.code}</div>
                    <div className="font-display text-lg font-bold uppercase tracking-tight mt-2">{ind.name}</div>
                    <p className="text-[13px] text-gray-600 leading-relaxed mt-2">{ind.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES STRIP */}
      <section className="bg-[#0B1120] text-white border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 lg:py-28">
          <div className="qm-tick text-gray-500 mb-3">// 05 / END-TO-END</div>
          <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight max-w-3xl mb-12">
            More than a supplier.<br /> A project partner.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10">
            {[
              { Icon: Compass, code: "SVC-01", title: "Material Sourcing", text: "China, India, Europe — flexible and approved." },
              { Icon: Certificate, code: "SVC-02", title: "Contract Manufacturing", text: "Custom forgings, fittings, and fabrications." },
              { Icon: Microscope, code: "SVC-03", title: "Quality, Testing & Inspection", text: "EN 3.1/3.2, PMI, SGS / BV / TÜV." },
              { Icon: Truck, code: "SVC-04", title: "Logistics & Project Supply", text: "Seaworthy / VCI packing, project tagging." },
            ].map(({ Icon, code, title, text }) => (
              <div key={code} className="bg-[#0B1120] p-8 hover:bg-[#0e1729] transition-colors">
                <Icon size={28} weight="duotone" className="text-[#FF3B30]" />
                <div className="qm-tick text-gray-500 mt-6">{code}</div>
                <div className="font-display text-xl font-bold uppercase mt-2">{title}</div>
                <p className="text-sm text-gray-400 mt-3 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-[#FF3B30] hover:underline">
              View all services →
            </Link>
          </div>
        </div>
      </section>

      {/* QUALITY */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 lg:py-28 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <div className="aspect-[4/3] overflow-hidden border border-gray-200">
              <img src={LAB_IMG} alt="Quality inspection" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="qm-tick mb-3">// 06 / QUALITY & COMPLIANCE</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tight">
              Traceable.<br />Inspected.<br />Repeatable.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                "EN 10204 3.1 / 3.2 mill test certificates",
                "Positive Material Identification (PMI)",
                "Mechanical & chemical testing per ASTM / ASME",
                "Independent inspection by SGS / BV / TÜV",
                "Heat number traceability throughout the supply chain",
              ].map((q) => (
                <li key={q} className="flex items-start gap-3">
                  <CheckCircle size={22} weight="fill" className="text-[#002FA7] flex-shrink-0 mt-0.5" />
                  <span className="text-[15px] text-[#0B1120]">{q}</span>
                </li>
              ))}
            </ul>
            <Link to="/quality" className="inline-flex items-center gap-2 mt-10 text-sm font-semibold uppercase tracking-widest text-[#002FA7] hover:underline" data-testid="home-quality-link">
              Quality programme →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
