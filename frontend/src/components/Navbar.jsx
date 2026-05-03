import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/industries", label: "Industries" },
  { to: "/services", label: "Services" },
  { to: "/quality", label: "Quality" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="qm-glass sticky top-0 z-50 border-b border-gray-200" data-testid="main-navbar">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-12 lg:px-16">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="grid h-9 w-9 place-items-center bg-[#002FA7] text-white font-mono-spec text-[11px] tracking-tight">QM</div>
            <div className="leading-tight">
              <div className="font-display font-black text-[15px] tracking-tight text-[#0B1120] uppercase">Quality Metals</div>
              <div className="font-mono-spec text-[10px] tracking-[0.18em] text-gray-500 uppercase">Limited / NZ</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                data-testid={`nav-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-4 py-2 text-[13px] font-medium tracking-wide uppercase transition-colors ${
                    isActive ? "text-[#002FA7]" : "text-[#0B1120] hover:text-[#002FA7]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/request-quote"
              data-testid="nav-request-quote-btn"
              className="bg-[#002FA7] hover:bg-[#00247D] text-white px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              Request BOM Quote →
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2"
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-200 bg-white" data-testid="mobile-menu">
          <div className="flex flex-col py-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-3 text-sm font-medium tracking-wide uppercase border-b border-gray-100 ${
                    isActive ? "text-[#002FA7] bg-gray-50" : "text-[#0B1120]"
                  }`
                }
                data-testid={`mobile-nav-${l.label.toLowerCase()}`}
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/request-quote"
              onClick={() => setOpen(false)}
              className="mx-6 my-4 bg-[#002FA7] text-white px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center"
              data-testid="mobile-request-quote-btn"
            >
              Request BOM Quote →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
