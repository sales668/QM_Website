import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";

const ABOUT_IMG = "https://images.pexels.com/photos/19730402/pexels-photo-19730402.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=1300";

export default function About() {
  return (
    <div data-testid="about-page">
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// 07 / ABOUT QUALITY METALS</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            A New Zealand<br />supplier with<br /><span className="text-[#002FA7]">global reach.</span>
          </h1>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <div className="qm-tick mb-3">Our position</div>
            <p className="font-display text-2xl sm:text-3xl leading-snug tracking-tight text-[#0B1120] max-w-2xl">
              Quality Metals Limited is a one-stop steel and alloy supplier supporting critical industries with reliable, specification-compliant materials sourced from approved manufacturers.
            </p>

            <div className="mt-12 grid sm:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
              {[
                { k: "Founded in", v: "New Zealand" },
                { k: "Sourcing network", v: "China · India · Europe" },
                { k: "Material families", v: "CS · MS · SS · DSS · Ni · Ti · Fasteners" },
                { k: "Project scope", v: "BOM-driven, single PO" },
              ].map((x) => (
                <div key={x.k} className="bg-white p-6">
                  <div className="qm-tick text-gray-400">{x.k}</div>
                  <div className="font-display text-xl font-bold uppercase tracking-tight mt-2">{x.v}</div>
                </div>
              ))}
            </div>

            <div className="mt-12 space-y-6 text-[15px] text-gray-700 leading-relaxed max-w-2xl">
              <p>
                Duplex and super duplex are not commodities — they require experience, control, and repeatability.
                This is where we specialise. We work shoulder-to-shoulder with EPC contractors, fabricators and OEMs
                to land material that is specification-compliant on the first delivery.
              </p>
              <p>
                Our mantra is simple: <strong>engineers don't like surprises, and neither do we.</strong> Every order is
                anchored in mill test certificates, PMI, third-party inspection and heat number traceability — so what
                arrives matches what was ordered.
              </p>
            </div>

            <div className="mt-10">
              <Link
                to="/request-quote"
                data-testid="about-cta-quote"
                className="inline-flex items-center gap-2 bg-[#002FA7] hover:bg-[#00247D] text-white px-7 py-4 text-sm font-bold uppercase tracking-widest"
              >
                Talk to our desk <ArrowUpRight size={16} weight="bold" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="aspect-[4/5] overflow-hidden border border-gray-200">
              <img src={ABOUT_IMG} alt="Industrial pipes" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
