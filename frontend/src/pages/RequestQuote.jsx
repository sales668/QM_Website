import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowUpRight } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";

export default function RequestQuote() {
  const [params] = useSearchParams();
  const prefillMaterial = params.get("material") || "";

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    country: "",
    materials: prefillMaterial,
    quantity: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefillMaterial) setForm((f) => ({ ...f, materials: prefillMaterial }));
  }, [prefillMaterial]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error("Name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/inquiries", form);
      setDone(true);
      toast.success("Inquiry received. We'll be in touch shortly.");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div data-testid="quote-success" className="bg-white">
        <section className="border-b border-gray-200 qm-grid-bg">
          <div className="mx-auto max-w-[900px] px-6 sm:px-12 lg:px-16 py-24 text-center">
            <CheckCircle size={64} weight="duotone" className="mx-auto text-[#002FA7]" />
            <div className="qm-tick mt-6 text-gray-500">// INQ-RECEIVED / 200 OK</div>
            <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-4xl sm:text-5xl mt-4">
              Inquiry received.
            </h1>
            <p className="mt-6 text-gray-600 max-w-lg mx-auto">
              Thanks {form.name.split(" ")[0]} — our quote desk will respond with a technical &
              commercial quotation. For urgent enquiries WhatsApp us on +64 21 081 56475.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <Link to="/products" className="bg-[#002FA7] hover:bg-[#00247D] text-white px-7 py-4 text-sm font-bold uppercase tracking-widest">
                Browse Catalog
              </Link>
              <Link to="/" className="bg-white border border-gray-300 hover:bg-gray-50 px-7 py-4 text-sm font-bold uppercase tracking-widest">
                Back Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div data-testid="request-quote-page" className="bg-white">
      <section className="border-b border-gray-200 qm-grid-bg">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 lg:py-20">
          <div className="qm-tick mb-4">// REQUEST FOR QUOTE / RFQ-V1</div>
          <h1 className="font-display font-black uppercase tracking-tighter leading-[0.9] text-[#0B1120] text-5xl sm:text-6xl lg:text-7xl">
            Send your BOM,<br />drawings or<br />material list.
          </h1>
          <p className="mt-6 max-w-2xl text-gray-600 text-base leading-relaxed">
            Fill in what you have — even rough specs are fine. Our team will reach out for any
            clarifications and respond with a technical & commercial quotation.
          </p>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16 py-16 grid lg:grid-cols-12 gap-12">
          <form onSubmit={submit} className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6" data-testid="quote-form">
            <Field label="Full Name *" id="name">
              <input type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} data-testid="quote-name-input" />
            </Field>
            <Field label="Company" id="company">
              <input type="text" value={form.company} onChange={(e) => update("company", e.target.value)} className={inputCls} data-testid="quote-company-input" />
            </Field>
            <Field label="Email *" id="email">
              <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls} data-testid="quote-email-input" />
            </Field>
            <Field label="Phone / WhatsApp" id="phone">
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls} data-testid="quote-phone-input" />
            </Field>
            <Field label="Country / Region" id="country">
              <input type="text" value={form.country} onChange={(e) => update("country", e.target.value)} className={inputCls} data-testid="quote-country-input" />
            </Field>
            <Field label="Approx. Quantity" id="quantity">
              <input type="text" placeholder="e.g. 12 MT, 200 mtr" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className={inputCls} data-testid="quote-quantity-input" />
            </Field>
            <Field label="Materials / Grades / Sizes *" id="materials" full>
              <textarea
                rows={3}
                value={form.materials}
                onChange={(e) => update("materials", e.target.value)}
                placeholder="e.g. 316L SMLS pipe Sch 40, 6m, 50 NB; Duplex 2205 plates 10mm, 1500x6000…"
                className={`${inputCls} font-mono-spec text-[13px]`}
                data-testid="quote-materials-input"
              />
            </Field>
            <Field label="Project Notes / Standards / Inspection" id="message" full>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Standards (ASTM/ASME), MTC requirements, packing, delivery port…"
                className={inputCls}
                data-testid="quote-message-input"
              />
            </Field>

            <div className="sm:col-span-2 flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 max-w-md">
                By submitting you agree to be contacted regarding this enquiry. We never share your information.
              </p>
              <button
                type="submit"
                disabled={submitting}
                data-testid="quote-submit-btn"
                className="inline-flex items-center gap-2 bg-[#002FA7] hover:bg-[#00247D] disabled:opacity-50 text-white px-8 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
              >
                {submitting ? "Submitting…" : "Send Inquiry"} <ArrowUpRight size={16} weight="bold" />
              </button>
            </div>
          </form>

          <aside className="lg:col-span-4">
            <div className="border border-gray-200 p-6 bg-[#FAFAFA] sticky top-24">
              <div className="qm-tick mb-3">What we'll send back</div>
              <ul className="space-y-3 text-sm">
                {[
                  "Technical compliance vs. your spec",
                  "Mill / source options with lead-times",
                  "FOB / CIF commercial pricing",
                  "Inspection & certification scope",
                  "Suggested packing & dispatch plan",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <CheckCircle size={16} weight="fill" className="text-[#002FA7] mt-0.5 flex-shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="qm-tick text-gray-500 mb-2">Direct line</div>
                <a href="mailto:sales@qualitymetalsltd.com" className="block text-sm text-[#002FA7] font-semibold break-all">sales@qualitymetalsltd.com</a>
                <a href="https://wa.me/642108156475" className="block text-sm text-[#002FA7] font-semibold mt-1">+64 21 081 56475</a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#002FA7] focus:border-transparent rounded-none";

function Field({ label, id, full, children }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block font-mono-spec">
        {label}
      </label>
      {React.cloneElement(children, { id })}
    </div>
  );
}
