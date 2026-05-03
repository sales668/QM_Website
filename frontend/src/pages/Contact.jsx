import React from "react";
import { Envelope, WhatsappLogo, Globe, MapPin, ArrowUpRight } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <div data-testid="contact-page">
      <section className="border-b border-gray-200 bg-white qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// 08 / CONTACT</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            Talk to a metallurgist,<br />not a chatbot.
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            Whether it's a single drum of fasteners or a multi-container project, we'd rather have a
            real conversation about your spec than make you fill another form.
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-20 grid lg:grid-cols-12 gap-px bg-gray-200 border border-gray-200">
          {[
            { Icon: Envelope, label: "Sales", value: "sales@qualitymetalsltd.com", href: "mailto:sales@qualitymetalsltd.com", code: "C-01", testid: "contact-email" },
            { Icon: WhatsappLogo, label: "WhatsApp", value: "+64 21 081 56475", href: "https://wa.me/642108156475", code: "C-02", testid: "contact-whatsapp" },
            { Icon: Globe, label: "Web", value: "qualitymetalsltd.com", href: "https://qualitymetalsltd.com", code: "C-03", testid: "contact-web" },
            { Icon: MapPin, label: "Region", value: "New Zealand", href: null, code: "C-04", testid: "contact-region" },
          ].map(({ Icon, label, value, href, code, testid }) => (
            <a
              key={code}
              href={href || undefined}
              target={href ? "_blank" : undefined}
              rel={href ? "noopener noreferrer" : undefined}
              className="bg-white p-8 lg:col-span-3 hover:bg-[#FAFAFA] transition-colors"
              data-testid={testid}
            >
              <Icon size={28} weight="duotone" className="text-[#002FA7]" />
              <div className="qm-tick text-gray-400 mt-6">{code} / {label}</div>
              <div className="font-display text-xl font-bold mt-2 break-words">{value}</div>
              {href && <div className="mt-4 text-xs uppercase tracking-widest text-[#002FA7] font-semibold inline-flex items-center gap-1">Open <ArrowUpRight size={12} weight="bold" /></div>}
            </a>
          ))}
        </div>

        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 text-center">
          <p className="text-[15px] text-gray-600 max-w-xl mx-auto">
            Got a BOM, drawing or material list ready? Skip the back-and-forth — go straight to the quote desk.
          </p>
          <Link
            to="/request-quote"
            data-testid="contact-cta-quote"
            className="inline-flex items-center gap-2 mt-6 bg-[#002FA7] hover:bg-[#00247D] text-white px-7 py-4 text-sm font-bold uppercase tracking-widest"
          >
            Request a BOM Quote <ArrowUpRight size={16} weight="bold" />
          </Link>
        </div>
      </section>
    </div>
  );
}
