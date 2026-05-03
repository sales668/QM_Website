import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "@phosphor-icons/react";
import { COMPLIANCE_HIGHLIGHTS, STANDARDS } from "../lib/staticData";

const LAB_IMG = "https://images.unsplash.com/photo-1764737734436-7eb904d3a4ab?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80";

export default function Quality() {
  return (
    <div data-testid="quality-page">
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// 06 / QUALITY & COMPLIANCE</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            Engineered<br />for traceability.
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            Every shipment is paired with documentation a project engineer can defend.
            From PMI to third-party witness, our quality programme is built for audit-grade supply.
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <div className="border-l border-t border-gray-200">
              {COMPLIANCE_HIGHLIGHTS.map((q) => (
                <div key={q.code} className="border-r border-b border-gray-200 p-8 bg-white flex gap-6" data-testid={`quality-${q.code}`}>
                  <ShieldCheck size={28} weight="duotone" className="text-[#002FA7] flex-shrink-0 mt-1" />
                  <div>
                    <div className="qm-tick text-gray-400">{q.code}</div>
                    <div className="font-display text-xl font-bold uppercase tracking-tight mt-1">{q.title}</div>
                    <p className="text-[14px] text-gray-600 leading-relaxed mt-2 max-w-xl">{q.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden border border-gray-200 mb-8">
              <img src={LAB_IMG} alt="Quality testing lab" className="w-full h-full object-cover" />
            </div>
            <div className="border border-gray-200 p-6 bg-[#FAFAFA]">
              <div className="qm-tick text-gray-500 mb-4">Standards we work to</div>
              <div className="flex flex-wrap gap-2">
                {STANDARDS.map((s) => (
                  <span key={s} className="font-mono-spec text-[11px] tracking-widest border border-gray-300 px-3 py-2 bg-white">{s}</span>
                ))}
              </div>
              <p className="text-[13px] text-gray-600 mt-5 leading-relaxed">
                Plus equivalents from BS, IS and JIS as required by project specification.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1120] text-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 grid sm:grid-cols-3 gap-px bg-white/10">
          {[
            { k: "Class Approved", v: "DNV · LR · ABS" },
            { k: "Independent Inspection", v: "SGS · BV · TÜV" },
            { k: "Certification", v: "EN 10204 3.1 / 3.2" },
          ].map((x) => (
            <div key={x.k} className="bg-[#0B1120] p-10">
              <div className="qm-tick text-gray-500">{x.k}</div>
              <div className="font-display text-2xl font-black uppercase tracking-tight mt-3 text-white">{x.v}</div>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-12 text-center">
          <Link to="/request-quote" className="inline-block bg-white text-[#0B1120] hover:bg-[#FF3B30] hover:text-white px-7 py-4 text-sm font-bold uppercase tracking-widest">
            Request a Mill Test Certificate Sample →
          </Link>
        </div>
      </section>
    </div>
  );
}
