import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Envelope, WhatsappLogo, Globe, MapPin } from "@phosphor-icons/react";

export default function Footer() {
  return (
    <footer className="bg-[#0B1120] text-white" data-testid="main-footer">
      {/* Massive CTA */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-24 sm:py-32">
          <div className="qm-tick text-gray-400 mb-8">// CALL TO ACTION / CTA-001</div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <h2
              className="font-display font-black uppercase tracking-tighter leading-[0.85] text-white"
              style={{ fontSize: "clamp(48px, 9vw, 168px)" }}
            >
              Send your<br />BOM.
            </h2>
            <Link
              to="/request-quote"
              data-testid="footer-cta-quote-btn"
              className="inline-flex items-center gap-3 bg-white text-[#0B1120] px-8 py-5 text-sm font-bold uppercase tracking-widest hover:bg-[#FF3B30] hover:text-white transition-colors"
            >
              Get a Technical Quote <ArrowUpRight size={20} weight="bold" />
            </Link>
          </div>
          <p className="mt-10 max-w-2xl text-gray-400 text-base leading-relaxed">
            Send us your BOM, drawings, or material list — we respond with a quick technical
            and commercial quotation. Engineers don't like surprises. Neither do we.
          </p>
        </div>
      </div>

      {/* Footer columns */}
      <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-10 w-10 place-items-center bg-[#002FA7] text-white font-mono-spec text-xs tracking-tight">QM</div>
              <div className="leading-tight">
                <div className="font-display font-black text-base uppercase tracking-tight">Quality Metals Limited</div>
                <div className="font-mono-spec text-[10px] tracking-[0.2em] text-gray-400 uppercase">New Zealand</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              A one-stop industrial steel and alloy supplier supporting critical industries
              with reliable, specification-compliant materials.
            </p>
          </div>

          <div className="md:col-span-3">
            <div className="qm-tick text-gray-500 mb-4">Navigate</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-[#FF3B30]" data-testid="footer-link-products">Products</Link></li>
              <li><Link to="/industries" className="hover:text-[#FF3B30]" data-testid="footer-link-industries">Industries</Link></li>
              <li><Link to="/services" className="hover:text-[#FF3B30]" data-testid="footer-link-services">Services</Link></li>
              <li><Link to="/quality" className="hover:text-[#FF3B30]" data-testid="footer-link-quality">Quality</Link></li>
              <li><Link to="/about" className="hover:text-[#FF3B30]" data-testid="footer-link-about">About</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="qm-tick text-gray-500 mb-4">Materials</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products/carbon-steel" className="hover:text-[#FF3B30]">Carbon Steel</Link></li>
              <li><Link to="/products/stainless-steel" className="hover:text-[#FF3B30]">Stainless Steel</Link></li>
              <li><Link to="/products/duplex" className="hover:text-[#FF3B30]">Duplex & Super Duplex</Link></li>
              <li><Link to="/products/high-nickel-alloys" className="hover:text-[#FF3B30]">High Nickel Alloys</Link></li>
              <li><Link to="/products/titanium" className="hover:text-[#FF3B30]">Titanium</Link></li>
              <li><Link to="/products/fasteners" className="hover:text-[#FF3B30]">Fasteners</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="qm-tick text-gray-500 mb-4">Contact</div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2"><Envelope size={16} className="mt-0.5" /> <a href="mailto:sales@qualitymetalsltd.com" className="hover:text-[#FF3B30] break-all">sales@qualitymetalsltd.com</a></li>
              <li className="flex items-start gap-2"><WhatsappLogo size={16} className="mt-0.5" /> +64 21 081 56475</li>
              <li className="flex items-start gap-2"><Globe size={16} className="mt-0.5" /> qualitymetalsltd.com</li>
              <li className="flex items-start gap-2"><MapPin size={16} className="mt-0.5" /> New Zealand</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-between text-xs text-gray-500 font-mono-spec uppercase tracking-widest">
          <div>© {new Date().getFullYear()} Quality Metals Limited. All rights reserved.</div>
          <div className="flex gap-6">
            <span>ASTM · ASME · EN · DIN · AS-NZ · ISO</span>
            <Link to="/admin/login" className="hover:text-white" data-testid="footer-admin-link">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
