import React from "react";

export const CATEGORIES = [
  { slug: "carbon-steel", name: "Carbon Steel", code: "CS" },
  { slug: "mild-steel", name: "Mild Steel", code: "MS" },
  { slug: "stainless-steel", name: "Stainless Steel", code: "SS" },
  { slug: "duplex", name: "Duplex & Super Duplex", code: "DSS" },
  { slug: "high-nickel-alloys", name: "High Nickel Alloys", code: "Ni" },
  { slug: "titanium", name: "Titanium Alloys", code: "Ti" },
  { slug: "fasteners", name: "Fasteners", code: "FAS" },
];

export const INDUSTRIES = [
  { name: "Marine & Shipbuilding", code: "MAR-01", description: "ASTM A131 hulls, 316L piping, Monel marine fasteners — chloride-tested, class-approved.", icon: "Anchor" },
  { name: "Oil & Gas / Offshore", code: "OG-02", description: "Super Duplex 2507, Inconel 625, A333 low-temp pipe for subsea, topside, and process service.", icon: "OilCan" },
  { name: "Petrochemical & Refining", code: "PCR-03", description: "A106 Gr B, A335 P-grades, Incoloy 800H — high-temperature, high-pressure compliant.", icon: "Factory" },
  { name: "Chemical Processing", code: "CHM-04", description: "Hastelloy C-276, Alloy 20, 904L for sulfuric/HCl service and severe corrosion.", icon: "TestTube" },
  { name: "Food, Dairy & Pharma", code: "FDP-05", description: "304L / 316L sanitary tube, BPE/3-A compliant fittings, full traceability.", icon: "ForkKnife" },
  { name: "Structural Engineering", code: "STR-06", description: "A36, IS 2062, lean duplex SHS/RHS for load-bearing and infrastructure projects.", icon: "Buildings" },
];

export const SERVICES = [
  {
    code: "SVC-01",
    title: "Material Sourcing",
    summary: "One-stop supply across CS, SS, Duplex, Nickel & Titanium.",
    bullets: [
      "Flexible sourcing from China, India & Europe",
      "Approved manufacturer network",
      "Class-approved & specification-compliant",
      "Mixed-item container loading",
    ],
  },
  {
    code: "SVC-02",
    title: "Contract Manufacturing",
    summary: "Partnered fabrication, machining and forging capacity.",
    bullets: [
      "Custom forgings & fabrications",
      "BW & forged fittings on demand",
      "Drawing & BOM-driven supply",
      "Single-source project delivery",
    ],
  },
  {
    code: "SVC-03",
    title: "Quality, Testing & Inspection",
    summary: "Independent verification and full traceability.",
    bullets: [
      "EN 10204 3.1 / 3.2 certification",
      "Positive Material Identification (PMI)",
      "Mechanical & chemical testing",
      "SGS / BV / TÜV third-party inspection",
      "Heat number traceability throughout supply chain",
    ],
  },
  {
    code: "SVC-04",
    title: "Logistics & Project Supply",
    summary: "Engineered packing for global, project-grade delivery.",
    bullets: [
      "Seaworthy & VCI packing",
      "Project-wise tagging & colour coding",
      "Mixed-item container loading",
      "Door-to-door global logistics",
    ],
  },
];

export const STANDARDS = [
  "ASTM", "ASME", "EN", "DIN", "AS-NZ", "SANS", "ISO",
];

export const COMPLIANCE_HIGHLIGHTS = [
  { code: "Q-01", title: "EN 10204 3.1 / 3.2", desc: "Mill test certificates with full traceability — heat number, chemistry, mechanicals, and inspector sign-off." },
  { code: "Q-02", title: "Positive Material Identification (PMI)", desc: "On-site XRF verification of grade and chemistry before dispatch — no surprises at site." },
  { code: "Q-03", title: "Independent Inspection", desc: "Third-party witness by SGS, Bureau Veritas or TÜV — release notes per project specification." },
  { code: "Q-04", title: "Class-Approved Material", desc: "DNV, Lloyd's, ABS, and equivalent class society approvals where the project demands it." },
  { code: "Q-05", title: "Heat Number Traceability", desc: "Hard-stamped, paint-marked, and document-linked from mill to final delivery." },
];
