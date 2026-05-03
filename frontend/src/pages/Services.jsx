import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowUpRight } from "@phosphor-icons/react";
import { SERVICES } from "../lib/staticData";

export default function Services() {
  return (
    <div data-testid="services-page">
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// 05 / SERVICES</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            From mill to site.<br />Single source.
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            Sourcing, manufacturing partnerships, third-party inspection and project logistics —
            handled as one accountable scope.
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-12">
          <div className="grid sm:grid-cols-2 border-l border-t border-gray-200">
            {SERVICES.map((s) => (
              <div key={s.code} className="border-r border-b border-gray-200 p-10 bg-white" data-testid={`service-${s.code}`}>
                <div className="qm-tick text-gray-400">{s.code}</div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tight mt-3">{s.title}</h2>
                <p className="text-[15px] text-gray-600 mt-3 leading-relaxed">{s.summary}</p>
                <ul className="mt-6 space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-[14px]">
                      <CheckCircle size={18} weight="fill" className="text-[#002FA7] flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0B1120] text-white">
          <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="qm-tick text-gray-500 mb-2">Single point of contact</div>
              <div className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight">
                One quotation. One PO. One project manager.
              </div>
            </div>
            <Link
              to="/request-quote"
              data-testid="services-cta-quote"
              className="inline-flex items-center gap-2 bg-white text-[#0B1120] hover:bg-[#FF3B30] hover:text-white px-7 py-4 text-sm font-bold uppercase tracking-widest"
            >
              Start a Project <ArrowUpRight size={16} weight="bold" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
