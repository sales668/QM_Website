import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { INDUSTRIES } from "../lib/staticData";

const RIG_IMG = "https://images.unsplash.com/photo-1727461553668-45322401f863?crop=entropy&cs=srgb&fm=jpg&w=1400&q=80";

export default function Industries() {
  return (
    <div data-testid="industries-page">
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// 04 / INDUSTRIES SERVED</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            Critical industries.<br />Compliant materials.
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            Our materials enable infrastructure that cannot afford to fail —
            from offshore platforms and chemical plants to dairy lines and structural frames.
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden border border-gray-200 sticky top-24">
              <img src={RIG_IMG} alt="Offshore platform" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="border-l border-t border-gray-200">
              {INDUSTRIES.map((ind, i) => (
                <div key={ind.code} className="border-r border-b border-gray-200 p-8 lg:p-10 bg-white" data-testid={`industry-${ind.code}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="qm-tick text-gray-400">{ind.code}</div>
                      <div className="font-display text-2xl font-black uppercase tracking-tight mt-2">{ind.name}</div>
                    </div>
                    <div className="font-mono-spec text-xs text-gray-300">{String(i + 1).padStart(2, "0")}</div>
                  </div>
                  <p className="text-[15px] text-gray-600 leading-relaxed mt-4 max-w-xl">{ind.description}</p>
                  <Link
                    to="/request-quote"
                    className="inline-flex items-center gap-2 mt-6 text-sm font-semibold uppercase tracking-widest text-[#002FA7] hover:underline"
                  >
                    Project enquiry <ArrowUpRight size={16} weight="bold" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
